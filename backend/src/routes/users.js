import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const usersRoutes = Router();
usersRoutes.use(authenticate);
usersRoutes.use(requireRole("ADMIN"));

// GET /api/users — list all users with profile + pending call requests
usersRoutes.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;
    const users = await prisma.user.findMany({
      where: {
        role: "USER",
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true, name: true, email: true, timezone: true, createdAt: true,
        userProfile: true,
        callRequests: {
          where: { status: { in: ["PENDING", "MATCHED"] } },
          select: { id: true, callType: true, status: true, createdAt: true, description: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json(users);
  } catch (e) { next(e); }
});

// GET /api/users/:id — single user with full detail
usersRoutes.get("/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id, role: "USER" },
      select: {
        id: true, name: true, email: true, timezone: true, createdAt: true,
        userProfile: true,
        callRequests: {
          select: {
            id: true, callType: true, status: true, description: true, createdAt: true,
            booking: {
              select: {
                id: true, scheduledAt: true, meetLink: true, status: true,
                mentor: { select: { id: true, name: true, email: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) { next(e); }
});
