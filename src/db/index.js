import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB= async ()=>{
    
    console.log("DB_NAME:", DB_NAME);
    try {
       const connectionInstance = await mongoose.connect(
        `${process.env.MONGODB_URI}/${DB_NAME}`
    
    );

       console.log(`Connection Establish !! ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("connection error" ,error)
        process.exit(1)
    }
};

export default connectDB