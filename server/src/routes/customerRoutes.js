import express from "express";

import {
  addCustomer,
  getCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

import {
  validateCustomer,
  handleValidationErrors,
} from "../validations/customerValidation.js";

const router = express.Router();

router.get("/", getCustomer);
router.get("/:id", getCustomerById);
router.post("/", validateCustomer, handleValidationErrors, addCustomer);
router.put("/:id", validateCustomer, handleValidationErrors, updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;