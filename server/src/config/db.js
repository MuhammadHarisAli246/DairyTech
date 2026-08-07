import mongoose from "mongoose";

const connectDb = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB connected successfully: ${conn.connection.host} / DB: ${conn.connection.name}`);
    } catch (error) {
        console.error("MongoDB connection FAILED:", error.message);
        process.exit(1);
    }
}

export default connectDb;
