import mongoose from "mongoose";

const milkSessionSchema = new mongoose.Schema(
  {
    baseQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    extraQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveredQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["delivered", "not_delivered"],
      default: "not_delivered",
    },
  },
  {
    _id: false,
  }
);

const createEmptySession = () => ({
  baseQty: 0,
  extraQty: 0,
  deliveredQty: 0,
  amount: 0,
  status: "not_delivered",
});

const dailyMilkSchema = new mongoose.Schema(
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
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    morning: {
      type: milkSessionSchema,
      required: true,
      default: createEmptySession,
    },

    evening: {
      type: milkSessionSchema,
      required: true,
      default: createEmptySession,
    },

    totalQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One record per owner, customer and calendar date.
dailyMilkSchema.index(
  {
    ownerId: 1,
    customerId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.models.DailyMilkQty ||
  mongoose.model(
    "DailyMilkQty",
    dailyMilkSchema,
    "dailyMilkQty"
  );