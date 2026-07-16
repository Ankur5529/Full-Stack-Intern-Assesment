import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { v4 as uuidv4 } from "uuid";

export const bookingRoutes = Router();
bookingRoutes.use(authenticate);

function generateMeetLink() {
  const chars = "abcdefghijkmnpqrstuvwxyz";
  const rand = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `https://meet.google.com/${rand(3)}-${rand(4)}-${rand(3)}`;
}

async function sendBookingNotification(booking, user, mentor) {
  // Stub: log to console. Wire up SendGrid/Resend here.
  console.log(`📧 [Email stub] Booking confirmed:`);
  console.log(`   To: ${user.email} (${user.name})`);
  console.log(`   To: ${mentor.email} (${mentor.name})`);
  console.log(`   Call type: ${booking.callType}`);
  console.log(`   Scheduled: ${booking.scheduledAt.toISOString()}`);
  console.log(`   Meet link: ${booking.meetLink}`);
}

// POST /api/bookings — admin books a call
bookingRoutes.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { callRequestId, mentorId, scheduledAt, durationMins = 60, notes } = req.body;

    if (!callRequestId || !mentorId || !scheduledAt) {
      return res.status(400).json({ error: "callRequestId, mentorId, and scheduledAt are required" });
    }

    const callRequest = await prisma.callRequest.findUnique({
      where: { id: callRequestId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!callRequest) return res.status(404).json({ error: "Call request not found" });
    if (!["PENDING", "MATCHED"].includes(callRequest.status)) {
      return res.status(400).json({ error: "Call request is not in a bookable state" });
    }

    const mentor = await prisma.user.findUnique({
      where: { id: mentorId, role: "MENTOR" },
      select: { id: true, name: true, email: true },
    });
    if (!mentor) return res.status(404).json({ error: "Mentor not found" });

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: "Invalid scheduledAt datetime" });
    }
    if (scheduledDate < new Date()) {
      return res.status(400).json({ error: "Cannot schedule in the past" });
    }

    const meetLink = generateMeetLink();

    // Transaction: create booking + update call request status
    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          id: uuidv4(),
          callRequestId,
          userId: callRequest.userId,
          mentorId,
          callType: callRequest.callType,
          scheduledAt: scheduledDate,
          durationMins: parseInt(durationMins),
          meetLink,
          notes: notes?.trim() || null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          mentor: { select: { id: true, name: true, email: true } },
          callRequest: true,
        },
      });
      await tx.callRequest.update({
        where: { id: callRequestId },
        data: { status: "BOOKED" },
      });
      return b;
    });

    // Fire-and-forget email notification
    sendBookingNotification(booking, booking.user, booking.mentor).catch(console.error);

    res.status(201).json(booking);
  } catch (e) { next(e); }
});

// GET /api/bookings — admin sees all; user/mentor sees own
bookingRoutes.get("/", async (req, res, next) => {
  try {
    const { status, callType, fromDate, toDate } = req.query;
    const isAdmin = req.userRole === "ADMIN";

    const bookings = await prisma.booking.findMany({
      where: {
        ...(isAdmin ? {} : req.userRole === "MENTOR"
          ? { mentorId: req.userId }
          : { userId: req.userId }),
        ...(status && { status }),
        ...(callType && { callType }),
        ...(fromDate || toDate ? {
          scheduledAt: {
            ...(fromDate && { gte: new Date(fromDate) }),
            ...(toDate && { lte: new Date(toDate) }),
          },
        } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        mentor: { select: { id: true, name: true, email: true, mentorProfile: true } },
        callRequest: { select: { id: true, callType: true, description: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
    res.json(bookings);
  } catch (e) { next(e); }
});

// GET /api/bookings/:id
bookingRoutes.get("/:id", async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        mentor: { select: { id: true, name: true, email: true, mentorProfile: true } },
        callRequest: true,
      },
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (req.userRole !== "ADMIN" && booking.userId !== req.userId && booking.mentorId !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(booking);
  } catch (e) { next(e); }
});

// PATCH /api/bookings/:id/status — admin updates booking status
bookingRoutes.patch("/:id/status", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ["SCHEDULED", "COMPLETED", "CANCELLED"];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: "status must be one of: " + valid.join(", ") });
    }
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(booking);
  } catch (e) { next(e); }
});
