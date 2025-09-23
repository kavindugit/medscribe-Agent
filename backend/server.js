//backend/server.js
import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRouter.js";
import casesRouter from "./routes/casesRoutes.js";
import indexRouter from "./routes/indexRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
const app = express();
const PORT = process.env.PORT || 4000;
connectDB();

const allowedOrigins =['http://localhost:5173']
app.use(express.json())
app.use(cookieParser())
app.use(cors({origin:allowedOrigins , credentials: true}))

app.use('/api/auth',authRouter );
app.use('/api/user',userRouter);
app.use('/api/cases', casesRouter);
app.use('/api/index', indexRouter);
app.use('/api/chat', chatRouter);

app.listen(PORT,()=> console.log(`Server is running on port ${PORT}`));

