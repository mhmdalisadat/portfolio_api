import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import { landingRoutes } from "./routes/landingRoutes";
import {
  blogRoutes,
  catalogRoutes,
  contactRoutes,
  worksRoutes,
} from "./routes";
import { telegramRoutes } from "./routes/telgramRoutes";
import connectDB from "./config/database";

const app = express();
const port = process.env.PORT || 3004;
const serverUrl = process.env.SERVER_URL || "http://127.0.0.1:3004";

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.use((req: Request, res: Response, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/api", landingRoutes);
app.use("/api", catalogRoutes);
app.use("/api", blogRoutes);
app.use("/api", worksRoutes);
app.use("/api", telegramRoutes);
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// اتصال به دیتابیس
connectDB()
  .then(() => {
    console.log("✅ Database setup completed");
  })
  .catch((err) => {
    console.error("❌ Database setup failed:", err);
  });

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
