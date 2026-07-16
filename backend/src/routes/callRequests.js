import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { v4 as uuidv4 } from "uuid";

export const callRequestRoutes = Router();
callRequestRoutes.use(authenticate);

// POST /api/call-requests — user submits a call request
callRequestRoutes.post("/", requireRole("USER"), async (req, res, next) => {
  try {
    const { callType, description } = req.body;
    const validTypes = ["RESUME_REVAMP", "JOB_MARKET_GUIDANCE", "MOCK_INTERVIEW"];
    if (!callType || !validTypes.includes(callType)) {
      return res.status(400).json({ error: "callType must be one of: " + validTypes.join(", ") });
    }

    // Check user doesn't have an active pending request for same type
    const existing = await prisma.callRequest.findFirst({
      where: { userId: req.userId, callType, status: { in: ["PENDING", "MATCHED"] } },
    });
    if (existing) {
      return res.status(409).json({ error: "You already have a pending request for this call type" });
    }

    const request = await prisma.callRequest.create({
      data: {
        id: uuidv4(),
        userId: req.userId,
        callType,
        description: description?.trim() || "",
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(request);
  } catch (e) { next(e); }
});

// GET /api/call-requests — user sees own; admin sees all
callRequestRoutes.get("/", async (req, res, next) => {
  try {
    const isAdmin = req.userRole === "ADMIN";
    const { status, callType } = req.query;

    const requests = await prisma.callRequest.findMany({
      where: {
        ...(isAdmin ? {} : { userId: req.userId }),
        ...(status && { status }),
        ...(callType && { callType }),
      },
      include: {
        user: { select: { id: true, name: true, email: true, userProfile: true } },
        booking: {
          include: {
            mentor: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(requests);
  } catch (e) { next(e); }
});

// GET /api/call-requests/:id
callRequestRoutes.get("/:id", async (req, res, next) => {
  try {
    const request = await prisma.callRequest.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, userProfile: true } },
        booking: {
          include: { mentor: { select: { id: true, name: true, email: true, mentorProfile: true } } },
        },
      },
    });
    if (!request) return res.status(404).json({ error: "Call request not found" });
    if (req.userRole !== "ADMIN" && request.userId !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(request);
  } catch (e) { next(e); }
});

// PATCH /api/call-requests/:id — user updates description
callRequestRoutes.patch("/:id", requireRole("USER"), async (req, res, next) => {
  try {
    const request = await prisma.callRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ error: "Not found" });
    if (request.userId !== req.userId) return res.status(403).json({ error: "Forbidden" });
    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Can only edit pending requests" });
    }
    const { description } = req.body;
    const updated = await prisma.callRequest.update({
      where: { id: req.params.id },
      data: { description: description?.trim() ?? request.description },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

// DELETE /api/call-requests/:id — user cancels pending request
callRequestRoutes.delete("/:id", requireRole("USER"), async (req, res, next) => {
  try {
    const request = await prisma.callRequest.findUnique({ where: { id: req.params.id } });
    if (!request) return res.status(404).json({ error: "Not found" });
    if (request.userId !== req.userId) return res.status(403).json({ error: "Forbidden" });
    if (!["PENDING", "MATCHED"].includes(request.status)) {
      return res.status(400).json({ error: "Can only cancel pending or matched requests" });
    }
    await prisma.callRequest.update({ where: { id: req.params.id }, data: { status: "CANCELLED" } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
