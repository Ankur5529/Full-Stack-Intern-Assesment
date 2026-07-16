import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Mentorque database...");

  // ─── Clean up existing data ──────────────────────────────────────────────
  await prisma.booking.deleteMany();
  await prisma.callRequest.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.availabilityException.deleteMany();
  await prisma.availabilityWeekMeta.deleteMany();
  await prisma.availabilityTemplate.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.meetingParticipant.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.user.deleteMany();

  const hash = (p) => bcrypt.hash(p, 12);

  // ─── Admin ───────────────────────────────────────────────────────────────
  const adminId = uuidv4();
  const admin = await prisma.user.create({
    data: {
      id: adminId,
      name: process.env.ADMIN_NAME || "Admin User",
      email: process.env.ADMIN_EMAIL || "admin@mentorque.com",
      password: await hash(process.env.ADMIN_PASSWORD || "admin123456"),
      role: "ADMIN",
      timezone: "UTC",
    },
  });
  console.log("✅ Admin created:", admin.email);

  // ─── Mentors ─────────────────────────────────────────────────────────────
  const mentorData = [
    {
      name: "Priya Sharma",
      email: "priya@mentorque.com",
      isTech: true,
      bigCompany: true,
      country: "India",
      seniorDev: true,
      goodComm: true,
      description:
        "Senior Software Engineer at Google with 10+ years in backend systems, distributed systems, and system design. Worked on large-scale infrastructure serving billions of users. Passionate about helping candidates crack FAANG interviews. Expert in Java, Go, and distributed systems.",
    },
    {
      name: "Conor Murphy",
      email: "conor@mentorque.com",
      isTech: true,
      bigCompany: false,
      country: "Ireland",
      seniorDev: true,
      goodComm: true,
      description:
        "Staff Engineer at a Series B fintech startup in Dublin. 8 years in the industry, specializing in frontend architecture with React/TypeScript, performance engineering, and startup scaling. Expert at resume crafting for startup and mid-size company roles. Excellent communicator known for clear technical mentoring.",
    },
    {
      name: "Anjali Iyer",
      email: "anjali@mentorque.com",
      isTech: false,
      bigCompany: true,
      country: "India",
      seniorDev: false,
      goodComm: true,
      description:
        "Senior Product Manager at Microsoft with background in product strategy, market research, and MBA. Specializes in non-technical career transitions, PM interviews, and navigating the job market during hiring freezes. Known for excellent communication and structured guidance.",
    },
    {
      name: "Declan O'Brien",
      email: "declan@mentorque.com",
      isTech: true,
      bigCompany: true,
      country: "Ireland",
      seniorDev: true,
      goodComm: false,
      description:
        "Principal Engineer at Amazon Web Services (AWS) Dublin. 12+ years in cloud infrastructure, DevOps, and platform engineering. Expert at mock technical interviews for SRE, DevOps, and cloud architect roles. Strong background in AWS, Kubernetes, and Terraform.",
    },
    {
      name: "Rahul Verma",
      email: "rahul@mentorque.com",
      isTech: true,
      bigCompany: false,
      country: "India",
      seniorDev: false,
      goodComm: true,
      description:
        "Full-stack developer at a product startup in Bangalore. 4 years of experience in React, Node.js, and PostgreSQL. Recently cracked interviews at mid-size companies and startups. Great at helping early-career engineers navigate the job market, craft resumes for startup roles, and prepare for technical assessments.",
    },
  ];

  const mentors = [];
  for (const m of mentorData) {
    const mentorId = uuidv4();
    const mentor = await prisma.user.create({
      data: {
        id: mentorId,
        name: m.name,
        email: m.email,
        password: await hash("mentor123456"),
        role: "MENTOR",
        timezone: m.country === "Ireland" ? "Europe/Dublin" : "Asia/Kolkata",
        mentorProfile: {
          create: {
            id: uuidv4(),
            isTech: m.isTech,
            bigCompany: m.bigCompany,
            country: m.country,
            seniorDev: m.seniorDev,
            goodComm: m.goodComm,
            description: m.description,
          },
        },
      },
    });
    mentors.push(mentor);
  }
  console.log(`✅ ${mentors.length} mentors created`);

  // ─── Users ────────────────────────────────────────────────────────────────
  const userData = [
    {
      name: "Arjun Nair",
      email: "arjun@mentorque.com",
      isTech: true,
      goodComm: true,
      asksQuestions: false,
      description:
        "Backend engineer with 3 years of experience in Python and Django. Looking to transition to a FAANG or big tech company. Strong in data structures and algorithms but needs help with system design and resume tailoring for big tech.",
    },
    {
      name: "Saoirse Kelly",
      email: "saoirse@mentorque.com",
      isTech: false,
      goodComm: true,
      asksQuestions: true,
      description:
        "Recent MBA graduate exploring product management roles at large tech companies. Has strong analytical skills and stakeholder management experience. Needs guidance on PM interview preparation and understanding the job market landscape.",
    },
    {
      name: "Vikram Singh",
      email: "vikram@mentorque.com",
      isTech: true,
      goodComm: false,
      asksQuestions: true,
      description:
        "Frontend developer with 2 years of experience in React and TypeScript. Actively applying to mid-size companies and startups. Needs resume revamp and mock interview practice for frontend roles.",
    },
    {
      name: "Fionnuala Byrne",
      email: "fionnuala@mentorque.com",
      isTech: true,
      goodComm: true,
      asksQuestions: false,
      description:
        "DevOps engineer with AWS experience looking for SRE roles at scale-up companies. Has worked with Kubernetes and Terraform. Needs mock interview practice and understanding of what big tech SRE teams look for.",
    },
    {
      name: "Meera Reddy",
      email: "meera@mentorque.com",
      isTech: false,
      goodComm: true,
      asksQuestions: true,
      description:
        "Marketing professional transitioning to product management. Has experience in go-to-market strategy and customer research. Needs guidance on positioning herself for PM roles at tech companies and navigating a competitive job market.",
    },
    {
      name: "Aditya Kumar",
      email: "aditya@mentorque.com",
      isTech: true,
      goodComm: false,
      asksQuestions: false,
      description:
        "Full-stack developer with 4 years of experience in Node.js and React. Recently laid off and looking for new opportunities. Needs help updating resume for the current market, identifying target companies, and practicing system design interviews.",
    },
    {
      name: "Ciara Walsh",
      email: "ciara@mentorque.com",
      isTech: false,
      goodComm: true,
      asksQuestions: true,
      description:
        "HR professional with 5 years of experience now targeting people analytics and HR tech roles. Curious about the tech industry job market. Needs resume revamp and guidance on how to position non-technical skills for tech companies.",
    },
    {
      name: "Rohan Mehta",
      email: "rohan@mentorque.com",
      isTech: true,
      goodComm: true,
      asksQuestions: true,
      description:
        "Machine learning engineer with expertise in Python, PyTorch, and NLP. Targeting AI research and applied ML roles at big tech companies and AI labs. Needs help with research-style resumes and understanding the interview process for ML roles.",
    },
    {
      name: "Aoife Gallagher",
      email: "aoife@mentorque.com",
      isTech: true,
      goodComm: false,
      asksQuestions: false,
      description:
        "Junior software engineer in Dublin with 1.5 years of experience in Java and Spring Boot. Looking to level up to mid-level roles at larger companies. Needs mock interview preparation and resume help tailored for the Irish and European tech market.",
    },
    {
      name: "Suresh Patel",
      email: "suresh@mentorque.com",
      isTech: true,
      goodComm: true,
      asksQuestions: true,
      description:
        "Data engineer with 5 years of experience in Apache Spark, Python, and SQL. Looking to move into big tech data engineering roles. Needs resume review, understanding of job market for data roles, and technical mock interviews.",
    },
  ];

  const users = [];
  for (const u of userData) {
    const userId = uuidv4();
    const user = await prisma.user.create({
      data: {
        id: userId,
        name: u.name,
        email: u.email,
        password: await hash("user123456"),
        role: "USER",
        timezone: "UTC",
        userProfile: {
          create: {
            id: uuidv4(),
            isTech: u.isTech,
            goodComm: u.goodComm,
            asksQuestions: u.asksQuestions,
            description: u.description,
          },
        },
      },
    });
    users.push(user);
  }
  console.log(`✅ ${users.length} users created`);

  // ─── Sample Call Requests ─────────────────────────────────────────────────
  const callRequestSamples = [
    { userId: users[0].id, callType: "MOCK_INTERVIEW", description: userData[0].description },
    { userId: users[1].id, callType: "JOB_MARKET_GUIDANCE", description: userData[1].description },
    { userId: users[2].id, callType: "RESUME_REVAMP", description: userData[2].description },
    { userId: users[3].id, callType: "MOCK_INTERVIEW", description: userData[3].description },
    { userId: users[4].id, callType: "JOB_MARKET_GUIDANCE", description: userData[4].description },
  ];

  for (const cr of callRequestSamples) {
    await prisma.callRequest.create({
      data: { id: uuidv4(), ...cr },
    });
  }
  console.log(`✅ ${callRequestSamples.length} sample call requests created`);

  console.log("\n🎉 Seed complete! Credentials:");
  console.log(`   Admin: ${process.env.ADMIN_EMAIL || "admin@mentorque.com"} / ${process.env.ADMIN_PASSWORD || "admin123456"}`);
  console.log("   Users: <email> / user123456");
  console.log("   Mentors: <email> / mentor123456");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
