import express from "express";

import {
  generateMonthlyReceipt,
  generateAllMonthlyReceipts,
  getAllReceipts,
  getReceiptsByCustomer,
} from "../controllers/receiptController.js";

const router = express.Router();

router.get("/", getAllReceipts);

router.get(
  "/customer/:customerId",
  getReceiptsByCustomer
);

router.post(
  "/generate",
  generateMonthlyReceipt
);

router.post(
  "/generate-all",
  generateAllMonthlyReceipts
);

export default router;