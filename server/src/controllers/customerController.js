import Customer from "../schemas/customer.js";
import DailyMilkQty from "../schemas/dailyMilkQty.js";
import Receipt from "../schemas/receiptSchema.js";
import Payments from "../schemas/payments.js";

const getOwnerId = (req) => req.userId || req.user?.id;

// Internal IDs remain globally unique: cust001, cust002, cust012, etc.
const generateGlobalCustomerId = async () => {
  const customers = await Customer.find({
    _id: /^cust\d+$/,
  })
    .select("_id")
    .lean();

  let highestNumber = 0;

  for (const customer of customers) {
    const number = Number.parseInt(
      customer._id.replace("cust", ""),
      10
    );

    if (Number.isFinite(number) && number > highestNumber) {
      highestNumber = number;
    }
  }

  return `cust${String(highestNumber + 1).padStart(3, "0")}`;
};

// Visible code starts from cust001 separately for each account
const generateCustomerCode = async (ownerId) => {
  const customers = await Customer.find({
    ownerId,
    customerCode: /^cust\d+$/,
  })
    .select("customerCode")
    .lean();

  let highestNumber = 0;

  for (const customer of customers) {
    const number = Number.parseInt(
      customer.customerCode.replace("cust", ""),
      10
    );

    if (Number.isFinite(number) && number > highestNumber) {
      highestNumber = number;
    }
  }

  return `cust${String(highestNumber + 1).padStart(3, "0")}`;
};

const createMilkSession = (baseQuantity, milkRate) => {
  const baseQty = Math.max(Number(baseQuantity) || 0, 0);
  const rate = Math.max(Number(milkRate) || 0, 0);

  return {
    baseQty,
    extraQty: 0,
    deliveredQty: baseQty,
    amount: baseQty * rate,
    status: baseQty > 0 ? "delivered" : "not_delivered",
  };
};
// Creates today's milk record immediately after customer creation
const createTodayMilkRecord = async (customer) => {
  if (
    customer.isActive !== true ||
    customer.deliveryStatus !== "active"
  ) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingRecord = await DailyMilkQty.findOne({
    ownerId: customer.ownerId,
    customerId: customer._id,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  });

  if (existingRecord) {
    return existingRecord;
  }

  const morning = createMilkSession(
    customer.defaultMorningQty,
    customer.milkRate
  );

  const evening = createMilkSession(
    customer.defaultEveningQty,
    customer.milkRate
  );

  return DailyMilkQty.create({
    ownerId: customer.ownerId,
    customerId: customer._id,
    date: today,
    morning,
    evening,
    totalQty:
      morning.deliveredQty + evening.deliveredQty,
    totalAmount: morning.amount + evening.amount,
  });
};

export const addCustomer = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);

    const {
      name,
      phone,
      address = "",
      defaultMorningQty,
      defaultEveningQty,
      milkRate,
      isActive = true,
      deliveryStatus = "active",
      notes = "",
    } = req.body;

    const existingPhone = await Customer.findOne({
      ownerId,
      phone,
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "Customer with this phone number already exists in your account",
      });
    }

    const [customerId, customerCode] = await Promise.all([
      generateGlobalCustomerId(),
      generateCustomerCode(ownerId),
    ]);

    const newCustomer = await Customer.create({
      _id: customerId,
      ownerId,
      customerCode,
      name,
      phone,
      address,
      defaultMorningQty,
      defaultEveningQty,
      milkRate,
      isActive,
      deliveryStatus,
      notes,
    });

    let milkRecordCreated = false;

    try {
      const milkRecord = await createTodayMilkRecord(newCustomer);
      milkRecordCreated = Boolean(milkRecord);
    } catch (milkError) {
      console.error(
        "Customer created, but today's milk record failed:",
        milkError
      );
    }

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: newCustomer,
      todayMilkRecordCreated: milkRecordCreated,
    });
  } catch (error) {
    console.error("Add customer error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Customer phone number or customer code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find({ ownerId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Customer.countDocuments({ ownerId }),
    ]);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);

    const customer = await Customer.findOne({
      _id: req.params.id,
      ownerId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Get customer error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);

    const {
      phone,
      defaultMorningQty,
      defaultEveningQty,
      milkRate,
      deliveryStatus,
    } = req.body;

    if (phone) {
      const duplicatePhone = await Customer.findOne({
        ownerId,
        phone,
        _id: { $ne: req.params.id },
      });

      if (duplicatePhone) {
        return res.status(409).json({
          success: false,
          message:
            "Phone number already belongs to another customer",
        });
      }
    }

    if (
      defaultMorningQty !== undefined &&
      Number(defaultMorningQty) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Morning quantity cannot be negative",
      });
    }

    if (
      defaultEveningQty !== undefined &&
      Number(defaultEveningQty) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Evening quantity cannot be negative",
      });
    }

    if (
      milkRate !== undefined &&
      Number(milkRate) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Milk rate must be greater than 0",
      });
    }

    if (
      deliveryStatus &&
      !["active", "paused", "inactive"].includes(
        deliveryStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status",
      });
    }

    const allowedUpdates = { ...req.body };

    // Do not allow ownership or identifiers to be changed
    delete allowedUpdates._id;
    delete allowedUpdates.ownerId;
    delete allowedUpdates.customerCode;

    const customer = await Customer.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId,
      },
      allowedUpdates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const ownerId = getOwnerId(req);
    const customerId = req.params.id;

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

    const receipts = await Receipt.find({
      ownerId,
      customerId,
    }).select("_id");

    const receiptIds = receipts.map((receipt) => receipt._id);

    await Promise.all([
      DailyMilkQty.deleteMany({
        ownerId,
        customerId,
      }),

      Payments.deleteMany({
        ownerId,
        customerId,
      }),

      Payments.deleteMany({
        receiptId: { $in: receiptIds },
      }),

      Receipt.deleteMany({
        ownerId,
        customerId,
      }),
    ]);

    await Customer.deleteOne({
      _id: customerId,
      ownerId,
    });

    res.status(200).json({
      success: true,
      message: "Customer and all related records deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};