import express from "express";
import { searchCustomerByName } from "../controllers/searchCustomerByName.js";

const router = express.Router();

// This defines the endpoint as /search
router.get("/search", searchCustomerByName);

export default router;