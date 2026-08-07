import express from "express"
import { setPrice , getLatestPrice } from "../controllers/priceController.js";

const router = express.Router();


router.post("/",setPrice);
router.get("/",getLatestPrice);

export default router;