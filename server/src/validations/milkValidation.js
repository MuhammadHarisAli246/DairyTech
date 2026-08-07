import { body, validationResult } from "express-validator";

const allowedStatuses = [
  "delivered",
  "not_delivered",
];

const statusValidator = body("status")
  .optional()
  .isIn(allowedStatuses)
  .withMessage(
    "Status must be auto_delivered, delivered, or not_delivered"
  );

const extraQtyValidator = body("extraQty")
  .optional()
  .isFloat({ min: 0 })
  .withMessage("Extra milk quantity must be 0 or greater");

export const validateMorningUpdate = [
  extraQtyValidator,
  statusValidator,
];

export const validateEveningUpdate = [
  extraQtyValidator,
  statusValidator,
];

export const handleMilkValidationErrors = (
  req,
  res,
  next
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};