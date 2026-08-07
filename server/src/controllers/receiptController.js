import Receipt from "../schemas/receiptSchema.js";
import DailyMilkQty from "../schemas/dailyMilkQty.js";
import Customer from "../schemas/customer.js";

const getOwnerId = (req) => req.userId || req.user?.id;

const getMonthRange = (month) => {
  if (!/^\d{4}-\d{2}$/.test(month || "")) {
    return null;
  }

  const [year, monthNumber] = month.split("-").map(Number);

  const start = new Date(year, monthNumber - 1, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(year, monthNumber, 1);
  end.setHours(0, 0, 0, 0);

  return { start, end };
};

const calculateStatus = (totalAmount, paidAmount) => {
  if (paidAmount >= totalAmount) {
    return "paid";
  }

  if (paidAmount > 0) {
    return "partially_paid";
  }

  return "unpaid";
};

const attachCustomer = async (receipt, ownerId) => {
  const customer = await Customer.findOne({
    _id: receipt.customerId,
    ownerId,
  }).lean();

  return {
    ...receipt,
    customer: customer
      ? {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
        }
      : null,
  };
};

// POST /api/receipts/generate
export const generateMonthlyReceipt = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { customerId, month } = req.body;

    if (!customerId || !month) {
      return res.status(400).json({
        success: false,
        message: "customerId and month are required",
      });
    }

    const range = getMonthRange(month);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Month must use YYYY-MM format",
      });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      ownerId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const milkRecords = await DailyMilkQty.find({
      ownerId,
      customerId,
      date: {
        $gte: range.start,
        $lt: range.end,
      },
    });

    if (milkRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No milk records found for this month",
      });
    }

    const totalMilk = milkRecords.reduce(
      (sum, record) => sum + Number(record.totalQty || 0),
      0
    );

    const totalAmount = milkRecords.reduce(
      (sum, record) => sum + Number(record.totalAmount || 0),
      0
    );

    const existingReceipt = await Receipt.findOne({
      ownerId,
      customerId,
      month,
    });

    const paidAmount = Number(existingReceipt?.paidAmount || 0);
    const remainingBalance = Math.max(totalAmount - paidAmount, 0);
    const status = calculateStatus(totalAmount, paidAmount);

    const receipt = await Receipt.findOneAndUpdate(
      {
        ownerId,
        customerId,
        month,
      },
      {
        ownerId,
        customerId,
        month,
        totalMilk,
        totalAmount,
        paidAmount,
        remainingBalance,
        status,
        generatedOn: new Date(),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    ).lean();

    const enrichedReceipt = await attachCustomer(receipt, ownerId);

    res.status(201).json({
      success: true,
      message: "Monthly receipt generated successfully",
      data: enrichedReceipt,
    });
  } catch (error) {
    console.error("Generate receipt error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// POST /api/receipts/generate-all
export const generateAllMonthlyReceipts = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { month } = req.body;

    const range = getMonthRange(month);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Month must use YYYY-MM format",
      });
    }

    const customers = await Customer.find({
      ownerId,
      isActive: true,
      deliveryStatus: "active",
    }).lean();

    if (!customers.length) {
      return res.status(200).json({
        success: true,
        message: "No active customers found",
        count: 0,
        data: [],
      });
    }

    const customerIds = customers.map((c) => c._id);

    const [allMilkRecords, existingReceipts] = await Promise.all([
      DailyMilkQty.find({
        ownerId,
        customerId: { $in: customerIds },
        date: { $gte: range.start, $lt: range.end },
      }).lean(),
      Receipt.find({
        ownerId,
        customerId: { $in: customerIds },
        month,
      }).lean(),
    ]);

    const milkByCustomer = {};
    for (const record of allMilkRecords) {
      if (!milkByCustomer[record.customerId]) {
        milkByCustomer[record.customerId] = [];
      }
      milkByCustomer[record.customerId].push(record);
    }

    const receiptMap = {};
    for (const receipt of existingReceipts) {
      receiptMap[receipt.customerId] = receipt;
    }

    const customerMap = {};
    for (const customer of customers) {
      customerMap[customer._id] = customer;
    }

    const bulkOps = [];
    const results = [];

    for (const customer of customers) {
      const milkRecords = milkByCustomer[customer._id];

      if (!milkRecords || milkRecords.length === 0) {
        continue;
      }

      const totalMilk = milkRecords.reduce(
        (sum, record) => sum + Number(record.totalQty || 0),
        0
      );

      const totalAmount = milkRecords.reduce(
        (sum, record) => sum + Number(record.totalAmount || 0),
        0
      );

      const existingReceipt = receiptMap[customer._id];
      const paidAmount = Number(existingReceipt?.paidAmount || 0);
      const remainingBalance = Math.max(totalAmount - paidAmount, 0);
      const status = calculateStatus(totalAmount, paidAmount);

      bulkOps.push({
        updateOne: {
          filter: { ownerId, customerId: customer._id, month },
          update: {
            $set: {
              ownerId,
              customerId: customer._id,
              month,
              totalMilk,
              totalAmount,
              paidAmount,
              remainingBalance,
              status,
              generatedOn: new Date(),
            },
          },
          upsert: true,
        },
      });

      results.push({
        ownerId,
        customerId: customer._id,
        month,
        totalMilk,
        totalAmount,
        paidAmount,
        remainingBalance,
        status,
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
        },
      });
    }

    if (bulkOps.length > 0) {
      await Receipt.bulkWrite(bulkOps, { ordered: false });
    }

    res.status(201).json({
      success: true,
      message: "Monthly receipts generated successfully",
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Generate all receipts error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// GET /api/receipts
export const getAllReceipts = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { month } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const filter = { ownerId };

    if (month) {
      filter.month = month;
    }

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .sort({ month: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Receipt.countDocuments(filter),
    ]);

    const enrichedReceipts = await Promise.all(
      receipts.map((receipt) => attachCustomer(receipt, ownerId))
    );

    res.status(200).json({
      success: true,
      count: enrichedReceipts.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: enrichedReceipts,
    });
  } catch (error) {
    console.error("Get all receipts error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// GET /api/receipts/customer/:customerId
export const getReceiptsByCustomer = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const { customerId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const customer = await Customer.findOne({
      _id: customerId,
      ownerId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const filter = { ownerId, customerId };

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .sort({ month: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Receipt.countDocuments(filter),
    ]);

    const enrichedReceipts = receipts.map((receipt) => ({
      ...receipt,
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      },
    }));

    res.status(200).json({
      success: true,
      count: enrichedReceipts.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: enrichedReceipts,
    });
  } catch (error) {
    console.error("Get customer receipts error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};