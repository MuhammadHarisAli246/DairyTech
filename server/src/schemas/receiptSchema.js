import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema(
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
      index: true,
    },

    month: {
      type: String, // Example: 2026-07
      required: true,
    },

    totalMilk: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    remainingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["paid", "unpaid", "partially_paid"],
      default: "unpaid",
    },

    generatedOn: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One bill per customer, month and account.
receiptSchema.index(
  {
    ownerId: 1,
    customerId: 1,
    month: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.models.Receipt ||
  mongoose.model("Receipt", receiptSchema);