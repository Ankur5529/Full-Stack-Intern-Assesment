import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { getRecommendations } from "../services/recommendationService.js";

export const recommendationRoutes = Router();
recommendationRoutes.use(authenticate);
recommendationRoutes.use(requireRole("ADMIN"));

// GET /api/recommendations/:callRequestId
// Returns top mentor recommendations with reasoning + availability overlap
recommendationRoutes.get("/:callRequestId", async (req, res, next) => {
  try {
    const { callRequestId } = req.params;
    const { weekStart } = req.query;

    const callRequest = await prisma.callRequest.findUnique({
      where: { id: callRequestId },
      include: {
        user: {
          select: { id: true, name: true, email: true, timezone: true, userProfile: true },
        },
      },
    });
    if (!callRequest) return res.status(404).json({ error: "Call request not found" });

    const mentors = await prisma.user.findMany({
      where: { role: "MENTOR" },
      select: {
        id: true, name: true, email: true, timezone: true,
        mentorProfile: true,
      },
    });

    const recommendations = await getRecommendations(callRequest, mentors, weekStart);
    res.json({ callRequest, recommendations });
  } catch (e) { next(e); }
});
