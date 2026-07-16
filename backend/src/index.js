import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRoutes } from "./routes/auth.js";
import { availabilityRoutes } from "./routes/availability.js";
import { adminRoutes } from "./routes/admin.js";
import { usersRoutes } from "./routes/users.js";
import { mentorsRoutes } from "./routes/mentors.js";
import { callRequestRoutes } from "./routes/callRequests.js";
import { bookingRoutes } from "./routes/bookings.js";
import { recommendationRoutes } from "./routes/recommendations.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://availabilitytrackerfrontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Cache-control for auth routes
app.use("/api/auth", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/mentors", mentorsRoutes);
app.use("/api/call-requests", callRequestRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.get("/health", (_, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Mentorque server running on port ${PORT}`);
});