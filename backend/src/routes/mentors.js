import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

export const mentorsRoutes = Router();
mentorsRoutes.use(authenticate);

// GET /api/mentors — list all mentors (admin only)
mentorsRoutes.get("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const mentors = await prisma.user.findMany({
      where: { role: "MENTOR" },
      select: {
        id: true, name: true, email: true, timezone: true, createdAt: true,
        mentorProfile: true,
        bookingsAsMentor: {
          where: { status: "SCHEDULED" },
          select: { id: true, scheduledAt: true, callType: true },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json(mentors);
  } catch (e) { next(e); }
});

// GET /api/mentors/me — mentor's own profile
mentorsRoutes.get("/me", requireRole("MENTOR"), async (req, res, next) => {
  try {
    const mentor = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, timezone: true, mentorProfile: true },
    });
    if (!mentor) return res.status(404).json({ error: "Not found" });
    res.json(mentor);
  } catch (e) { next(e); }
});

// PUT /api/mentors/:id/profile — admin updates mentor profile
mentorsRoutes.put("/:id/profile", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { isTech, bigCompany, country, seniorDev, goodComm, description } = req.body;
    const mentor = await prisma.user.findUnique({ where: { id: req.params.id, role: "MENTOR" } });
    if (!mentor) return res.status(404).json({ error: "Mentor not found" });

    const profile = await prisma.mentorProfile.upsert({
      where: { mentorId: req.params.id },
      update: {
        ...(isTech !== undefined && { isTech }),
        ...(bigCompany !== undefined && { bigCompany }),
        ...(country !== undefined && { country }),
        ...(seniorDev !== undefined && { seniorDev }),
        ...(goodComm !== undefined && { goodComm }),
        ...(description !== undefined && { description }),
      },
      create: {
        id: (await import("uuid")).v4(),
        mentorId: req.params.id,
        isTech: isTech ?? false,
        bigCompany: bigCompany ?? false,
        country: country ?? "",
        seniorDev: seniorDev ?? false,
        goodComm: goodComm ?? false,
        description: description ?? "",
      },
    });
    res.json(profile);
  } catch (e) { next(e); }
});
