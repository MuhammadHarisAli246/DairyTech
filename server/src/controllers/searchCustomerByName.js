import DailyMilkQty from "../schemas/dailyMilkQty.js";
import Customers from "../schemas/customer.js";

export const searchCustomerByName = async (req, res) => {
    try {
        const { name } = req.query;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Search name is required" });
        }

        const foundCustomers = await Customers.find({
            name: { $regex: name, $options: "i" }
        }).lean();

        if (!foundCustomers.length) {
            return res.status(404).json({ message: "No Customer Found" });
        }

        const customerIds = foundCustomers.map(c => c._id);

        const customerMap = {};
        foundCustomers.forEach(c => {
            customerMap[c._id] = { _id: c._id, name: c.name };
        });

        const records = await DailyMilkQty.find({
            customerId: { $in: customerIds }
        })
            .sort({ date: -1 })
            .lean();

        const enrichedRecords = records.map(record => ({
            ...record,
            customerId: customerMap[record.customerId] || record.customerId
        }));

        res.json(enrichedRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};