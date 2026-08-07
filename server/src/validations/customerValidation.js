import { body, validationResult } from "express-validator";

export const validateCustomer = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Customer name is required")
        .isLength({ min: 2 })
        .withMessage("Customer name must be at least 2 characters"),

    body("phone")
        .trim()
        .notEmpty()
        .withMessage("Phone number is required")
        .matches(/^03[0-9]{2}-?[0-9]{7}$/)
        .withMessage("Phone must be Pakistani format like 03101148270 or 0310-1148270"),

    body("defaultMorningQty")
        .isFloat({ min: 0 })
        .withMessage("Morning milk quantity must be 0 or greater"),

    body("defaultEveningQty")
        .isFloat({ min: 0 })
        .withMessage("Evening milk quantity must be 0 or greater"),

    body("milkRate")
        .isFloat({ min: 1 })
        .withMessage("Milk rate must be greater than 0"),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be true or false"),

    body("address")
        .optional()
        .trim(),
];

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }

    next();
};