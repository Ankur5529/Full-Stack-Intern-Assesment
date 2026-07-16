import { prisma } from "../lib/prisma.js";
import { loadWeeklyAvailability } from "./availabilityWeek.js";
import { getWeekStart, getWeekDates } from "../utils/time.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Call the Gemini API to rank mentors for a call request.
 */
async function rankMentorsWithLLM(callRequest, mentors) {
  if (!GEMINI_API_KEY) {
    console.warn("[recommendation] GEMINI_API_KEY not set, using rule-based fallback");
    return ruleBasedRanking(callRequest, mentors);
  }

  const callTypeLabels = {
    RESUME_REVAMP: "Resume Revamp",
    JOB_MARKET_GUIDANCE: "Job Market Guidance",
    MOCK_INTERVIEW: "Mock Interview",
  };

  const mentorList = mentors.map((m, i) => {
    const p = m.mentorProfile;
    return `Mentor ${i + 1}: ${m.name}
  - Country: ${p?.country || "Unknown"}
  - Tech background: ${p?.isTech ? "Yes" : "No"}
  - Big company experience: ${p?.bigCompany ? "Yes" : "No"}
  - Senior developer: ${p?.seniorDev ? "Yes" : "No"}
  - Good communicator: ${p?.goodComm ? "Yes" : "No"}
  - Description: ${p?.description || "No description"}`;
  }).join("\n\n");

  const userProfile = callRequest.user?.userProfile;
  const userInfo = `Name: ${callRequest.user?.name}
Tech background: ${userProfile?.isTech ? "Yes" : "No"}
Good communicator: ${userProfile?.goodComm ? "Yes" : "No"}
Asks questions often: ${userProfile?.asksQuestions ? "Yes" : "No"}
Description: ${callRequest.description || userProfile?.description || "No description"}`;

  const prompt = `You are a mentoring platform matching engine. A user needs a ${callTypeLabels[callRequest.callType]} session.

USER PROFILE:
${userInfo}

AVAILABLE MENTORS:
${mentorList}

MATCHING CRITERIA for ${callTypeLabels[callRequest.callType]}:
${callRequest.callType === "RESUME_REVAMP" ? "Prioritize mentors with big company / FAANG experience, as they know what top companies look for in resumes." : ""}
${callRequest.callType === "JOB_MARKET_GUIDANCE" ? "Prioritize mentors with excellent communication skills who can provide clear, structured job market advice." : ""}
${callRequest.callType === "MOCK_INTERVIEW" ? "Prioritize mentors from the same technical domain as the user, who can conduct realistic domain-specific mock interviews." : ""}

Rank the top 3 most suitable mentors from the list above. Return a JSON array (no markdown, raw JSON only) with this exact shape:
[
  {
    "mentorIndex": <1-based index from the list above>,
    "score": <0-100 integer>,
    "reasoning": "<2-3 sentence explanation of why this mentor is a good fit>"
  }
]
Only return the JSON array, nothing else.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      console.error("[recommendation] Gemini API error:", response.status, await response.text());
      return ruleBasedRanking(callRequest, mentors);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[recommendation] Could not parse LLM response:", text);
      return ruleBasedRanking(callRequest, mentors);
    }

    const ranked = JSON.parse(jsonMatch[0]);
    return ranked.map((r) => ({
      mentor: mentors[r.mentorIndex - 1],
      score: r.score,
      reasoning: r.reasoning,
    })).filter((r) => r.mentor);
  } catch (err) {
    console.error("[recommendation] LLM call failed:", err.message);
    return ruleBasedRanking(callRequest, mentors);
  }
}

/**
 * Simple rule-based fallback ranking (no LLM required)
 */
function ruleBasedRanking(callRequest, mentors) {
  const userProfile = callRequest.user?.userProfile;
  const userDesc = (callRequest.description || userProfile?.description || "").toLowerCase();

  const scored = mentors.map((m) => {
    const p = m.mentorProfile;
    if (!p) return { mentor: m, score: 30, reasoning: "No mentor profile available for detailed matching." };

    let score = 30;
    let reasons = [];

    if (callRequest.callType === "RESUME_REVAMP") {
      if (p.bigCompany) { score += 35; reasons.push("Has big company experience — knows what top employers look for in resumes."); }
      if (p.seniorDev) { score += 15; reasons.push("Senior developer with broad industry perspective."); }
      if (p.goodComm) { score += 10; reasons.push("Excellent communicator — can give clear, actionable resume feedback."); }
    } else if (callRequest.callType === "JOB_MARKET_GUIDANCE") {
      if (p.goodComm) { score += 35; reasons.push("Highly rated for communication — key for clear career guidance."); }
      if (p.bigCompany) { score += 15; reasons.push("Insider knowledge of hiring at top companies."); }
      if (!p.isTech && !userProfile?.isTech) { score += 10; reasons.push("Non-tech background matches the user's profile."); }
    } else if (callRequest.callType === "MOCK_INTERVIEW") {
      const mentorDesc = (p.description || "").toLowerCase();
      const commonDomains = ["backend", "frontend", "fullstack", "data", "ml", "cloud", "devops", "product", "aws"];
      let domainMatch = false;
      for (const domain of commonDomains) {
        if (userDesc.includes(domain) && mentorDesc.includes(domain)) {
          score += 30; domainMatch = true;
          reasons.push(`Domain overlap in ${domain} engineering — ideal for realistic mock interviews.`);
          break;
        }
      }
      if (!domainMatch && p.isTech === userProfile?.isTech) { score += 15; reasons.push("Similar tech/non-tech background."); }
      if (p.seniorDev) { score += 15; reasons.push("Senior-level experience for rigorous mock interview practice."); }
    }

    const reasoning = reasons.length > 0
      ? reasons.join(" ")
      : "General fit based on profile compatibility.";

    return { mentor: m, score: Math.min(score, 100), reasoning };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * Load availability overlap between user and mentor for the coming week.
 */
async function getAvailabilityOverlap(userId, mentorId, weekStartInput) {
  const weekStart = weekStartInput ? new Date(weekStartInput) : getWeekStart(new Date());

  const [userAvail, mentorAvail] = await Promise.all([
    loadWeeklyAvailability({ userId, mentorId: null, role: "USER" }, weekStart),
    loadWeeklyAvailability({ userId: null, mentorId, role: "MENTOR" }, weekStart),
  ]);

  // Find overlapping slots
  const userSlots = new Set();
  if (userAvail.availability) {
    for (const slots of Object.values(userAvail.availability)) {
      for (const slot of slots) {
        userSlots.add(slot.startTime);
      }
    }
  }

  const overlap = [];
  if (mentorAvail.availability) {
    for (const [date, slots] of Object.entries(mentorAvail.availability)) {
      for (const slot of slots) {
        if (userSlots.has(slot.startTime)) {
          overlap.push({
            date,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      }
    }
  }

  return { overlap, weekStart: weekStart.toISOString().slice(0, 10) };
}

/**
 * Main recommendation function called by the route.
 */
export async function getRecommendations(callRequest, mentors, weekStart) {
  // Get LLM (or rule-based) rankings
  const ranked = await rankMentorsWithLLM(callRequest, mentors);

  // For each recommended mentor, fetch availability overlap
  const withOverlap = await Promise.all(
    ranked.map(async ({ mentor, score, reasoning }) => {
      const { overlap, weekStart: ws } = await getAvailabilityOverlap(
        callRequest.userId,
        mentor.id,
        weekStart
      );
      return {
        mentor: {
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          timezone: mentor.timezone,
          profile: mentor.mentorProfile,
        },
        score,
        reasoning,
        availabilityOverlap: overlap,
        weekStart: ws,
      };
    })
  );

  return withOverlap;
}
