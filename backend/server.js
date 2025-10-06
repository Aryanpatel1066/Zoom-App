import express from "express"
import  dotenv from "dotenv"
import connectDB from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import cors from "cors"
import cookieParser from "cookie-parser"; // <--- import

// step1: connect the database
dotenv.config()
connectDB();


const app = express()
app.use(cors({
    origin:"http://localhost:5173",
    credentials: true,
     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))
//middleware
app.use(cookieParser()); // <--- add this before routes
app.use(express.json())

//routes
app.use("/zoom/api/v1/auth",authRoutes)


//step2: start the server
const PORT = process.env.PORT || 1066
app.listen(PORT,()=>console.log(`🚀 Server running on port ${PORT}`))