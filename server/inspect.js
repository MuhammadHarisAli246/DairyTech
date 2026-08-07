import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "E:/haris/Web Development/Full Stack/DairyTech/server/.env" });

const connect = await mongoose.connect(process.env.MONGO_URL);

const User = mongoose.connection.db.collection("users");
const Customer = mongoose.connection.db.collection("customers");
const Milk = mongoose.connection.db.collection("dailyMilkQty");

const user = await User.findOne({ email: "hafizharisali7@gmail.com" });
console.log("USER:", user ? { _id: user._id, email: user.email, name: user.name } : "NOT FOUND");
if (!user) process.exit(0);

const customers = await Customer.find({ ownerId: user._id }).toArray();
console.log("CUSTOMERS:", customers.map((c) => ({ _id: c._id, name: c.name, createdAt: c.createdAt, defaultMorningQty: c.defaultMorningQty, defaultEveningQty: c.defaultEveningQty, isActive: c.isActive, deliveryStatus: c.deliveryStatus })));

for (const c of customers) {
  const milk = await Milk.find({ ownerId: user._id, customerId: c._id }).sort({ date: 1 }).toArray();
  console.log(`MILK for ${c.name}: count=${milk.length}`);
  for (const m of milk) {
    console.log("  ", m.date.toISOString().slice(0, 10), "morning:", m.morning?.deliveredQty, "/", m.morning?.status, "evening:", m.evening?.deliveredQty, "/", m.evening?.status, "created:", m.createdAt?.toISOString());
  }
}

await mongoose.disconnect();
