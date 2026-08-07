import mongoose from "mongoose";

const priceSchema = new mongoose.Schema({

    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    pricePerLiter: {
        type: Number,
        required: true
    },

    effectiveFrom: {
        type: Date,
        required: true
    },

    isActive: {
        type: Boolean,
        default: true
    }
},
    { timestamps: true }
);

export default mongoose.model("price", priceSchema);