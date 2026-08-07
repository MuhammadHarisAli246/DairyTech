import express from "express";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import {
  forgotPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  resetPassword,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const rejectInvalidInput = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Please correct the submitted information",
      errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }

  return next();
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later",
  },
});

const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 10, max: 72 })
    .withMessage("Password must be between 10 and 72 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain a special character"),
  body("phoneNo")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^03\d{2}-?\d{7}$/)
    .withMessage("Enter a valid Pakistani mobile number"),
];

const loginValidation = [
  body("email").trim().isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 1, max: 72 }),
];

const forgotPasswordValidation = [
  body("email").trim().isEmail().withMessage("Enter a valid email address").normalizeEmail(),
];

const resetPasswordValidation = [
  body("token").isString().notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 10, max: 72 })
    .withMessage("Password must be between 10 and 72 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain a special character"),
];

router.post(
  "/register",
  authLimiter,
  registerValidation,
  rejectInvalidInput,
  registerUser
);
router.post(
  "/login",
  authLimiter,
  loginValidation,
  rejectInvalidInput,
  loginUser
);
router.post("/refresh", authLimiter, refreshSession);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getCurrentUser);
router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidation,
  rejectInvalidInput,
  forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  resetPasswordValidation,
  rejectInvalidInput,
  resetPassword
);

export default router;
