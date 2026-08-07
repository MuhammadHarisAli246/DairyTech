import Payments from "../schemas/payments.js";
import Receipt from "../schemas/receiptSchema.js";

const getOwnerId = (req) => req.userId || req.user?.id;

const updateReceiptBalance = async (receiptId, ownerId) => {
  const receipt = await Receipt.findOne({ _id: receiptId, ownerId });

  if (!receipt) {
    throw new Error("Receipt not found");
  }

  const payments = await Payments.find({ receiptId, ownerId });

  const paidAmount = payments.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0
  );

  const remainingBalance = Math.max(
    (receipt.totalAmount || 0) - paidAmount,
    0
  );

  let status = "unpaid";

  if (paidAmount >= receipt.totalAmount) {
    status = "paid";
  } else if (paidAmount > 0) {
    status = "partially_paid";
  }

  receipt.paidAmount = paidAmount;
  receipt.remainingBalance = remainingBalance;
  receipt.status = status;

  await receipt.save();

  return receipt;
};

export const addPayment = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { customerId, receiptId, month, amount, method, paymentDate, note } =
      req.body;

    if (!customerId || !receiptId || !month || !amount) {
      return res.status(400).json({
        success: false,
        message: "customerId, receiptId, month and amount are required",
      });
    }

    const receipt = await Receipt.findOne({ _id: receiptId, ownerId });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const payment = await Payments.create({
      ownerId,
      customerId,
      receiptId,
      month,
      amount,
      method,
      paymentDate,
      note,
    });

    const updatedReceipt = await updateReceiptBalance(receiptId, ownerId);

    res.status(201).json({
      success: true,
      message: "Payment added successfully",
      data: {
        payment,
        receipt: updatedReceipt,
      },
    });
  } catch (error) {
    console.error("Add payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getPaymentsByCustomer = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { ownerId, customerId: req.params.customerId };

    const [payments, total] = await Promise.all([
      Payments.find(filter).sort({ paymentDate: -1 }).skip(skip).limit(limit),
      Payments.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);

    const payment = await Payments.findOneAndUpdate(
      { _id: req.params.id, ownerId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const updatedReceipt = await updateReceiptBalance(payment.receiptId, ownerId);

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: {
        payment,
        receipt: updatedReceipt,
      },
    });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);

    const payment = await Payments.findOneAndDelete({
      _id: req.params.id,
      ownerId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const updatedReceipt = await updateReceiptBalance(payment.receiptId, ownerId);

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
      data: {
        receipt: updatedReceipt,
      },
    });
  } catch (error) {
    console.error("Delete payment error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};