import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.dairytech_access;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (decoded.type !== "access" || !decoded.id) {
      throw new Error("Invalid access token");
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };
    req.userId = decoded.id;

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Session expired",
    });
  }
};

export default authMiddleware;
