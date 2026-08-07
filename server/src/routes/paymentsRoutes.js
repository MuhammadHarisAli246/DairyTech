import express from 'express';
import { 
    addPayment, // Changed from addPayments to match controller
    getPaymentsByCustomer, 
    updatePayment, 
    deletePayment 
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", addPayment);
router.get("/customer/:customerId", getPaymentsByCustomer);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;