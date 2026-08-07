import Customer from "../schemas/customer.js";
import DailyMilkQty from "../schemas/dailyMilkQty.js";

const getOwnerId = (req) =>
  req.userId || req.user?.id;

const getDayRange = (dateValue = new Date()) => {
  let start;

  if (
    typeof dateValue === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
  ) {
    // Interpret YYYY-MM-DD as local server date.
    start = new Date(`${dateValue}T00:00:00`);
  } else {
    start = new Date(dateValue);
  }

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const calculateSession = (sessionData, milkRate) => {
  const baseQty = Math.max(
    Number(sessionData?.baseQty) || 0,
    0
  );

  const extraQty = Math.max(
    Number(sessionData?.extraQty) || 0,
    0
  );

  const status =
    sessionData?.status || "pending";

  let deliveredQty = 0;

if (status === "delivered") {
  deliveredQty = baseQty + extraQty;
}

  const amount =
    deliveredQty * (Number(milkRate) || 0);

  return {
    baseQty,
    extraQty,
    deliveredQty,
    amount,
    status,
  };
};

const recalculateRecord = (
  record,
  milkRate
) => {
  const morning = calculateSession(
    record.morning,
    milkRate
  );

  const evening = calculateSession(
    record.evening,
    milkRate
  );

  return {
    morning,
    evening,
    totalQty:
      morning.deliveredQty +
      evening.deliveredQty,
    totalAmount:
      morning.amount + evening.amount,
  };
};

const enrichMilkRecords = async (
  records,
  ownerId
) => {
  if (!records.length) {
    return [];
  }

  const customerIds = [
    ...new Set(
      records.map((record) => record.customerId)
    ),
  ];

  const customers = await Customer.find({
    ownerId,
    _id: {
      $in: customerIds,
    },
  }).lean();

  const customerMap = {};

  customers.forEach((customer) => {
    customerMap[customer._id] = {
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      milkRate: customer.milkRate,
    };
  });

  return records.map((record) => ({
    ...record,
    customer:
      customerMap[record.customerId] || null,
  }));
};

// GET /api/milk/today
export const getTodayMilk = async (
  req,
  res
) => {
  try {
    const ownerId = getOwnerId(req);
    const range = getDayRange();

    const records = await DailyMilkQty.find({
      ownerId,
      date: {
        $gte: range.start,
        $lt: range.end,
      },
    })
      .sort({
        customerId: 1,
      })
      .lean();

    const enrichedRecords =
      await enrichMilkRecords(records, ownerId);

    res.status(200).json({
      success: true,
      count: enrichedRecords.length,
      data: enrichedRecords,
    });
  } catch (error) {
    console.error(
      "Get today milk error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// GET /api/milk?date=YYYY-MM-DD
export const getAllMilk = async (
  req,
  res
) => {
  try {
    const ownerId = getOwnerId(req);
    const { date } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const skip = (page - 1) * limit;

    const filter = {
      ownerId,
    };

    if (date) {
      const range = getDayRange(date);

      if (!range) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid date. Use YYYY-MM-DD format",
        });
      }

      filter.date = {
        $gte: range.start,
        $lt: range.end,
      };
    }

    const [records, total] = await Promise.all([
      DailyMilkQty.find(filter)
        .sort({ date: -1, customerId: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DailyMilkQty.countDocuments(filter),
    ]);

    const enrichedRecords =
      await enrichMilkRecords(records, ownerId);

    res.status(200).json({
      success: true,
      count: enrichedRecords.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: enrichedRecords,
    });
  } catch (error) {
    console.error(
      "Get all milk error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// GET /api/milk/customer/:customerId
export const getMilkByCustomer = async (
  req,
  res
) => {
  try {
    const ownerId = getOwnerId(req);
    const { customerId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
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

    const [records, total] = await Promise.all([
      DailyMilkQty.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DailyMilkQty.countDocuments(filter),
    ]);

    const enrichedRecords =
      await enrichMilkRecords(records, ownerId);

    res.status(200).json({
      success: true,
      count: enrichedRecords.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: enrichedRecords,
    });
  } catch (error) {
    console.error(
      "Get customer milk error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// PATCH /api/milk/:id/morning
export const updateMorningMilk = async (
  req,
  res
) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = req.params;
    const { extraQty, status } = req.body;

    const record =
      await DailyMilkQty.findOne({
        _id: id,
        ownerId,
      });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Milk record not found",
      });
    }

    const customer = await Customer.findOne({
      _id: record.customerId,
      ownerId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (extraQty !== undefined) {
      record.morning.extraQty =
        Number(extraQty);
    }

    if (status !== undefined) {
      record.morning.status = status;
    }

    const totals = recalculateRecord(
      record,
      customer.milkRate
    );

    record.morning = totals.morning;
    record.evening = totals.evening;
    record.totalQty = totals.totalQty;
    record.totalAmount =
      totals.totalAmount;

    await record.save();

    res.status(200).json({
      success: true,
      message:
        "Morning milk updated successfully",
      data: record,
    });
  } catch (error) {
    console.error(
      "Update morning milk error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// PATCH /api/milk/:id/evening
export const updateEveningMilk = async (
  req,
  res
) => {
  try {
    const ownerId = getOwnerId(req);
    const { id } = req.params;
    const { extraQty, status } = req.body;

    const record =
      await DailyMilkQty.findOne({
        _id: id,
        ownerId,
      });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Milk record not found",
      });
    }

    const customer = await Customer.findOne({
      _id: record.customerId,
      ownerId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (extraQty !== undefined) {
      record.evening.extraQty =
        Number(extraQty);
    }

    if (status !== undefined) {
      record.evening.status = status;
    }

    const totals = recalculateRecord(
      record,
      customer.milkRate
    );

    record.morning = totals.morning;
    record.evening = totals.evening;
    record.totalQty = totals.totalQty;
    record.totalAmount =
      totals.totalAmount;

    await record.save();

    res.status(200).json({
      success: true,
      message:
        "Evening milk updated successfully",
      data: record,
    });
  } catch (error) {
    console.error(
      "Update evening milk error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// DELETE /api/milk/:id
export const deleteMilk = async (
  req,
  res
) => {
  try {
    const ownerId = getOwnerId(req);

    const record =
      await DailyMilkQty.findOneAndDelete({
        _id: req.params.id,
        ownerId,
      });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Milk record not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Milk record deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete milk error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};