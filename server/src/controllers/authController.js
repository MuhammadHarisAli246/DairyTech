import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../schemas/user.js";
import sendEmail from "../utils/sendEmail.js";

const ACCESS_COOKIE = "dairytech_access";
const REFRESH_COOKIE = "dairytech_refresh";

const accessCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 15 * 60 * 1000,
});

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phoneNo: user.phoneNo,
  role: user.role,
});

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const signAccessToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), role: user.role, type: "access" },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), type: "refresh" },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
  );

const setSessionCookies = async (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
};

const clearSessionCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, accessCookieOptions());
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
};

export const registerUser = async (req, res) => {
  try {
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    const existingUser = await User.exists({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Unable to create account with these details",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      phoneNo: req.body.phoneNo?.trim() || "",
      password: passwordHash,
      role: "User",
    });

    await setSessionCookies(res, user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Unable to create account with these details",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email }).select(
      "+password +refreshTokenHash"
    );

    const passwordMatches =
      user && (await bcrypt.compare(req.body.password, user.password));

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    await setSessionCookies(res, user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
};

export const refreshSession = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];

  if (!refreshToken) {
    clearSessionCookies(res);
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (payload.type !== "refresh" || !payload.id) {
      throw new Error("Invalid refresh token");
    }

    const user = await User.findById(payload.id).select("+refreshTokenHash");

    const validStoredToken =
      user &&
      user.refreshTokenHash &&
      crypto.timingSafeEqual(
        Buffer.from(user.refreshTokenHash, "hex"),
        Buffer.from(hashToken(refreshToken), "hex")
      );

    if (!validStoredToken) {
      clearSessionCookies(res);
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
    }

    await setSessionCookies(res, user);

    return res.status(200).json({
      success: true,
      user: publicUser(user),
    });
  } catch {
    clearSessionCookies(res);
    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again",
    });
  }
};

export const logoutUser = async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];

  if (refreshToken) {
    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      if (payload?.id) {
        await User.findByIdAndUpdate(payload.id, {
          $set: { refreshTokenHash: null },
        });
      }
    } catch {
      // Invalid/expired cookies are still safely cleared below.
    }
  }

  clearSessionCookies(res);
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  return res.status(200).json({
    success: true,
    user: publicUser(user),
  });
};

export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with that email, a reset link has been sent",
      });
    }

    const resetToken = jwt.sign(
      { id: user._id.toString(), type: "reset" },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.RESET_TOKEN_EXPIRES_IN || "15m" }
    );

    user.passwordResetHash = hashToken(resetToken);
    user.passwordResetExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL_RESET || `${process.env.CLIENT_URL.split(",")[0]}/reset-password`;
    const resetUrl = `${clientUrl}?token=${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "DairyTech — Reset Your Password",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#10b981;">Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Reset Password</a>
          <p style="color:#64748b;font-size:13px;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="color:#94a3b8;font-size:12px;">DairyTech — Milk Delivery Management</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "If an account exists with that email, a reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process request",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(422).json({
        success: false,
        message: "Token and password are required",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    if (payload.type !== "reset" || !payload.id) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const user = await User.findById(payload.id).select(
      "+passwordResetHash +passwordResetExpires"
    );

    if (
      !user ||
      !user.passwordResetHash ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    const tokenValid = crypto.timingSafeEqual(
      Buffer.from(user.passwordResetHash, "hex"),
      Buffer.from(hashToken(token), "hex")
    );

    if (!tokenValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetHash = null;
    user.passwordResetExpires = null;
    user.refreshTokenHash = null;
    await user.save({ validateBeforeSave: false });

    clearSessionCookies(res);

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in with your new password",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};
