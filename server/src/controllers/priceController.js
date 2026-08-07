import Price from "../schemas/priceSchema.js";

const getOwnerId = (req) => req.userId || req.user?.id;

export const setPrice = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        if (req.body.isActive !== false) {
            await Price.updateMany({ ownerId }, { isActive: false });
        }
        
        const savedPrice = await Price.create({ ...req.body, ownerId });
        res.status(201).json(savedPrice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getLatestPrice = async (req, res) => {
    try {
        const ownerId = getOwnerId(req);

        const price = await Price.findOne({ ownerId, isActive: true })
            .sort({ effectiveFrom: -1 });
        res.json(price);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};