import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    // Internal global ID used by existing milk, receipt and payment records
    _id: {
      type: String,
      required: true,
    },

    // Account that owns this customer
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Visible ID that starts from cust001 for every account
    customerCode: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    defaultMorningQty: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    defaultEveningQty: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    milkRate: {
      type: Number,
      required: true,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    deliveryStatus: {
      type: String,
      enum: ["active", "paused", "inactive"],
      default: "active",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Same owner cannot use the same phone twice
customerSchema.index(
  { ownerId: 1, phone: 1 },
  { unique: true }
);

// Every owner gets their own cust001, cust002, etc.
customerSchema.index(
  { ownerId: 1, customerCode: 1 },
  { unique: true }
);

export default mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema);