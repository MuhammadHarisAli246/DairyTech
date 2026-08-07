import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

import connectDb from "./src/config/db.js";
import authMiddleware from "./src/middleware/authMiddleware.js";
import {
  generateDailyMilkRecords,
  startDailyMilkJob,
} from "./src/jobs/generateDailyMilkRecords.js";
import authRoutes from "./src/routes/authRoutes.js";
import customerRoutes from "./src/routes/customerRoutes.js";
import dailyMilkRoutes from "./src/routes/dailyMilkRoutes.js";
import paymentsRoutes from "./src/routes/paymentsRoutes.js";
import priceRoutes from "./src/routes/priceRoutes.js";
import receiptRoutes from "./src/routes/receiptRoutes.js";
import searchRoutes from "./src/routes/searchCustomer.js";

dotenv.config();

console.log("DEBUG CLIENT_URL_RESET:", process.env.CLIENT_URL_RESET);
console.log("DEBUG CLIENT_URL:", process.env.CLIENT_URL);
console.log("DEBUG cwd:", process.cwd());

const requiredEnvironment = [
  "MONGO_URL",
  "CLIENT_URL",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
];

for (const key of requiredEnvironment) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const app = express();
app.get('/health', (req, res) => res.send('ok'));
const PORT = Number(process.env.PORT) || 8080;
const allowedOrigins = process.env.CLIENT_URL.split(",").map((origin) =>
  origin.trim()
);

const isPrivateAddress = (hostname) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
  /^192\.168\.\d+\.\d+$/.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(hostname) ||
  hostname.endsWith(".local");

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) return true;

  if (process.env.NODE_ENV === "production") return false;

  try {
    return isPrivateAddress(new URL(origin).hostname);
  } catch {
    return false;
  }
};

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS_BLOCKED"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));
app.use(cookieParser());

await connectDb();
await generateDailyMilkRecords();
startDailyMilkJob();

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DairyTech API Running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/customers", authMiddleware, customerRoutes);
app.use("/api/milk", authMiddleware, dailyMilkRoutes);
app.use("/api/payments", authMiddleware, paymentsRoutes);
app.use("/api/price", authMiddleware, priceRoutes);
app.use("/api/search-customer", authMiddleware, searchRoutes);
app.use("/api/receipts", authMiddleware, receiptRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  if (err.message === "CORS_BLOCKED") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  console.error("Unhandled server error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DairyTech API running on port ${PORT}`);
});