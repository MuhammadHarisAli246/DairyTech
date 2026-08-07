import cron from "node-cron";
import Customer from "../schemas/customer.js";
import DailyMilkQty from "../schemas/dailyMilkQty.js";

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const createSession = (baseQuantity, milkRate) => {
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

const buildRecord = (customer, date) => {
  const morning = createSession(
    customer.defaultMorningQty,
    customer.milkRate
  );

  const evening = createSession(
    customer.defaultEveningQty,
    customer.milkRate
  );

  return {
    ownerId: customer.ownerId,
    customerId: customer._id,
    date,
    morning,
    evening,
    totalQty: morning.deliveredQty + evening.deliveredQty,
    totalAmount: morning.amount + evening.amount,
  };
};

const backfillCustomer = async (customer, end) => {
  const existing = await DailyMilkQty.find(
    {
      ownerId: customer.ownerId,
      customerId: customer._id,
      date: { $lt: end },
    },
    { date: 1 }
  ).lean();

  const existingTimes = new Set(
    existing.map((record) => startOfDay(record.date).getTime())
  );

  let start;
  if (existingTimes.size > 0) {
    start = new Date(Math.min(...existingTimes));
  } else {
    start = startOfDay(customer.createdAt || new Date());
  }

  let created = 0;

  for (let day = start; day < end; day = addDays(day, 1)) {
    if (existingTimes.has(day.getTime())) {
      continue;
    }

    await DailyMilkQty.create(buildRecord(customer, new Date(day)));
    created += 1;
  }

  return created;
};

export const generateDailyMilkRecords = async () => {
  try {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    const customers = await Customer.find({
      ownerId: {
        $exists: true,
        $ne: null,
      },
      isActive: true,
      deliveryStatus: "active",
    });

    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const customer of customers) {
      try {
        const created = await backfillCustomer(customer, tomorrow);

        createdCount += created;

        if (created === 0) {
          skippedCount += 1;
        }
      } catch (customerError) {
        if (customerError?.code === 11000) {
          skippedCount += 1;
          continue;
        }

        failedCount += 1;

        console.error(
          `Milk generation failed for customer ${customer._id}:`,
          customerError.message
        );
      }
    }

    console.log(
      `Daily milk generation completed. Created: ${createdCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`
    );

    return {
      createdCount,
      skippedCount,
      failedCount,
    };
  } catch (error) {
    console.error("Daily milk generation error:", error.message);

    return {
      createdCount: 0,
      skippedCount: 0,
      failedCount: 1,
    };
  }
};

export const startDailyMilkJob = () => {
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("Running automatic daily milk generation...");
      await generateDailyMilkRecords();
    },
    {
      timezone: "Asia/Karachi",
    }
  );

  console.log(
    "Daily milk generation cron job started for Asia/Karachi"
  );
};
