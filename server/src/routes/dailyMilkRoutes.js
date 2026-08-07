import express from "express";

import {
  getTodayMilk,
  getAllMilk,
  getMilkByCustomer,
  updateMorningMilk,
  updateEveningMilk,
  deleteMilk,
} from "../controllers/dailyMilkController.js";

import {
  validateMorningUpdate,
  validateEveningUpdate,
  handleMilkValidationErrors,
} from "../validations/milkValidation.js";

const router = express.Router();

// Today's milk
router.get("/today", getTodayMilk);

// Milk by date
router.get("/", getAllMilk);

// Customer milk history
router.get("/customer/:customerId", getMilkByCustomer);

// Update morning session
router.patch(
  "/:id/morning",
  validateMorningUpdate,
  handleMilkValidationErrors,
  updateMorningMilk
);

// Update evening session
router.patch(
  "/:id/evening",
  validateEveningUpdate,
  handleMilkValidationErrors,
  updateEveningMilk
);

// Delete daily record
router.delete("/:id", deleteMilk);

export default router;