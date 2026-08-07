import mongoose from "mongoose";

const paymentsSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    customerId: {
      type: String,
      required: true,
    },

    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receipt",
      required: true,
    },

    month: {
      type: String, // format: "2026-07"
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    method: {
      type: String,
      enum: ["cash", "online", "check"],
      default: "cash",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Payments ||
  mongoose.model("Payments", paymentsSchema);