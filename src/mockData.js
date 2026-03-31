// ─── SKILLS CATALOG ───────────────────────────────────────────────────────────
export const skillsCatalog = [
  {
    id: "apm-foundations",
    title: "APM Foundations",
    subtitle: "Product Management Basics",
    icon: "📦",
    color: "#0A84FF",
    totalDays: 21,
    currentDay: 3,
    enrolled: true,
    tracking: true,
    description: "Master the fundamentals of product management through real Indian startup case studies.",
    competencies: ["Strategic Thinking", "Voice of Customer", "Fluency with Data", "UX Design Sense"],
  },
  {
    id: "sql-for-pms",
    title: "SQL for PMs",
    subtitle: "Data Querying Essentials",
    icon: "🗄️",
    color: "#30D158",
    totalDays: 14,
    currentDay: 0,
    enrolled: true,
    tracking: false,
    description: "Learn SQL from a product lens — write queries that answer real product questions.",
    competencies: ["Fluency with Data", "Analytical Thinking"],
  },
];

export const pendingSkillRequests = [
  {
    id: "req-001",
    title: "Growth Hacking for PMs",
    requestedAt: "2026-03-30",
    status: "pending_review",
    submittedOutput: "Day 1-7 roadmap focused on acquisition loops...",
  },
];

// ─── CURRENT DAY ──────────────────────────────────────────────────────────────
export const currentDay = 3;

// ─── ROADMAP DAYS ─────────────────────────────────────────────────────────────
export const roadmapDays = [
  { day: 1, week: 1, theme: "APM Foundations — The PM Role", competenciesCovered: ["Strategic Thinking", "Product Intuition"], completed: true, assessmentScore: 7, competencyLevel: "On Track" },
  { day: 2, week: 1, theme: "Understanding Your Users", competenciesCovered: ["Voice of Customer", "Empathy Mapping"], completed: true, assessmentScore: 8, competencyLevel: "Outperform" },
  { day: 3, week: 1, theme: "User Thinking — Personas + JTBD", competenciesCovered: ["Voice of Customer", "UX Design Sense"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 4, week: 1, theme: "Metrics That Matter", competenciesCovered: ["Fluency with Data", "Goal Setting"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 5, week: 1, theme: "Prioritisation Frameworks", competenciesCovered: ["Strategic Thinking", "Stakeholder Alignment"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 6, week: 1, theme: "Writing PRDs", competenciesCovered: ["Communication", "Product Intuition"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 7, week: 1, theme: "Week 1 Review + Reflection", competenciesCovered: ["Strategic Thinking", "Voice of Customer"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 8, week: 2, theme: "Working with Engineering", competenciesCovered: ["Technical Credibility", "Execution"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 9, week: 2, theme: "Working with Design", competenciesCovered: ["UX Design Sense", "Collaboration"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 10, week: 2, theme: "Data-Driven Decisions", competenciesCovered: ["Fluency with Data", "Analytical Thinking"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 11, week: 2, theme: "OKRs and Goal Frameworks", competenciesCovered: ["Goal Setting", "Strategic Thinking"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 12, week: 2, theme: "Roadmapping", competenciesCovered: ["Product Intuition", "Stakeholder Alignment"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 13, week: 2, theme: "Competitive Analysis", competenciesCovered: ["Strategic Thinking", "Market Awareness"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 14, week: 2, theme: "Week 2 Review + Reflection", competenciesCovered: ["Execution", "Communication"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 15, week: 3, theme: "Growth and Retention", competenciesCovered: ["Fluency with Data", "Product Intuition"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 16, week: 3, theme: "Monetisation Strategies", competenciesCovered: ["Strategic Thinking", "Market Awareness"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 17, week: 3, theme: "Go-To-Market Planning", competenciesCovered: ["Communication", "Stakeholder Alignment"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 18, week: 3, theme: "Launch and Post-Launch", competenciesCovered: ["Execution", "Analytical Thinking"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 19, week: 3, theme: "Stakeholder Management", competenciesCovered: ["Stakeholder Alignment", "Communication"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 20, week: 3, theme: "Case Study: Scaling a Feature", competenciesCovered: ["Strategic Thinking", "Execution"], completed: false, assessmentScore: null, competencyLevel: null },
  { day: 21, week: 3, theme: "Final Capstone + Reflection", competenciesCovered: ["All Competencies"], completed: false, assessmentScore: null, competencyLevel: null },
];

// ─── DAY DATA ─────────────────────────────────────────────────────────────────
export const dayData = {
  day: 3,
  week: 1,
  theme: "User Thinking — Personas + JTBD",
  competenciesCovered: ["Voice of Customer", "UX Design Sense"],
  teamContext: "Today's focus team: Design + Research",
  objective: "Write a specific user persona and identify the Job To Be Done behind a real Indian app complaint",
  realWorldAnchor: {
    company: "CRED",
    example: "CRED's decision to only allow users with credit scores above 750 — a deliberate persona-driven product choice",
  },
  tasks: [
    {
      id: "d3t1",
      type: "read",
      title: "The Jobs To Be Done Framework",
      url: "https://review.firstround.com/build-products-that-solve-real-problems-with-this-lightweight-jtbd-framework",
      summary: "Jobs To Be Done (JTBD) is a framework for understanding why customers buy or use products. Instead of focusing on demographics, it asks: what 'job' is the user hiring this product to do? This lens leads to far better product decisions than persona-only thinking.",
      keyTakeaways: [
        "Users don't buy products — they hire them to do a job in their life",
        "The same product can be hired for very different jobs by different users",
        "Identifying the core job unlocks better positioning, features, and messaging",
        "JTBD pairs powerfully with personas to create a complete user picture",
      ],
      minutes: 25,
      completed: false,
      locked: false,
      carriedOver: false,
    },
    {
      id: "d3t2",
      type: "read",
      title: "How to Write User Personas That Actually Work",
      url: "https://productschool.com/blog/product-management/user-persona",
      summary: "Most personas are useless because they're full of demographic fluff. This article explains how to write actionable personas grounded in real user behaviour, motivations, and frustrations — the kind that actually inform product decisions.",
      keyTakeaways: [
        "A persona must include a specific frustration, not just an age and job title",
        "Good personas come from user interviews, not assumptions",
        "One strong persona beats five weak ones",
        "Always anchor personas to a real product decision you need to make",
      ],
      minutes: 20,
      completed: false,
      locked: false,
      carriedOver: false,
    },
    {
      id: "d3t3",
      type: "search",
      keyword: "JTBD framework product manager real examples India",
      whyItMatters: "Most JTBD examples online are American SaaS products. You need to find Indian consumer app examples — Swiggy, Zepto, PhonePe, Meesho — to build the muscle of applying this framework in your actual market context.",
      whatToLearn: [
        "How Indian PMs talk about user jobs in blog posts or Twitter threads",
        "Any teardowns of Indian super-apps using JTBD thinking",
        "How functional vs emotional vs social jobs differ in Indian consumer behaviour",
        "Examples where an Indian app changed based on understanding user jobs",
      ],
      minutes: 15,
      completed: false,
      locked: false,
      carriedOver: false,
    },
    {
      id: "d3t4",
      type: "activity",
      title: "Identify the Job Being Hired",
      promptTitle: "Identify the Job Being Hired",
      claudePrompt: `You are a PM coach running a live coaching session with an APM candidate named Pranav.

Today's topic is Jobs To Be Done (JTBD).

Start by asking Pranav to pick ONE Indian app he uses daily (e.g. Zepto, PhonePe, Swiggy, Meesho, etc.) and describe ONE specific moment when he used it.

Then guide him through these questions one at a time — wait for his response before asking the next:
1. "What were you doing or feeling just before you opened this app?"
2. "What did you actually want to accomplish — not the feature, but the underlying goal?"
3. "Is that goal functional (get something done), emotional (feel something), or social (be seen a certain way)?"
4. "Could you have hired a different product or solution to do this same job? What would you have used before this app existed?"
5. "Now write a JTBD statement in this format: When [situation], I want to [motivation], so I can [outcome]."

After he gives the JTBD statement, give him specific feedback:
- Is the situation specific enough?
- Is the motivation a real underlying desire (not just a feature)?
- Is the outcome measurable or observable?

End with a 1–10 score on how well he understands JTBD, with one clear improvement suggestion.`,
      minutes: 20,
      completed: false,
      locked: true,
      carriedOver: false,
    },
  ],
  bonusTasks: [
    {
      id: "d3b1",
      type: "read",
      title: "Why Dunzo Failed — A JTBD Analysis",
      url: "https://entrackr.com/2024/02/how-dunzo-lost-the-plot/",
      summary: "Dunzo built a beloved product but failed to stay aligned with the job users were hiring it for. As Zepto and Blinkit redefined the job to 'get groceries in 10 minutes', Dunzo's identity became unclear.",
      keyTakeaways: [
        "Being first to a job doesn't mean you keep it — faster competitors can steal the hire",
        "Expanding into too many jobs at once dilutes your core value",
        "Unit economics matter more when users have identical alternatives",
      ],
      minutes: 20,
    },
    {
      id: "d3b2",
      type: "read",
      title: "PhonePe vs Google Pay — Competing for the Same Job",
      url: "https://the-ken.com/blog/phonpe-vs-googlepay/",
      summary: "Two apps, same functional job (send money), wildly different emotional and social jobs.",
      keyTakeaways: [
        "Same functional job can be won or lost on emotional and social jobs",
        "Distribution partnerships define which users hire you",
        "Interface design signals which 'type' of user you're built for",
      ],
      minutes: 18,
    },
  ],
  assessmentTask: {
    taskDescription: "Persona + JTBD exercise using real Zepto complaints",
    rawMaterial: `Here are 5 real-style Zepto app store reviews from Indian users:

Review 1 (⭐⭐): "Ordered 4 items. They delivered 3 and said the 4th was out of stock — AFTER I already paid. Why show it in stock at all? This happens every second order. I'm switching to Blinkit."

Review 2 (⭐): "The delivery guy called me 6 times in 2 minutes while I was in a meeting. I had to step out. There should be a 'do not call' option or at least a doorbell note option."

Review 3 (⭐⭐⭐): "Good for quick top-ups but I've stopped using it for monthly grocery runs. The pricing is way higher than what I'd pay at a kirana store for the same items. I only use it when I'm desperate."

Review 4 (⭐⭐): "Why is the app so pushy about Zepto Cafe? Every time I open it, there's a huge Cafe banner covering my grocery list. I came to buy vegetables. Stop cross-selling before I've even added one item."

Review 5 (⭐⭐⭐⭐): "Honestly impressive for last-minute needs. I use it mostly for when I forget to buy something while cooking. It's faster than stepping out. But please fix the search — typing 'atta' shows 10 branded options before showing loose flour."`,
    outputFormat: `Your answer should contain exactly three things:
1. ONE specific user persona (name, age, living situation, one core frustration, one goal)
2. ONE JTBD statement: "When [situation], I want to [motivation], so I can [outcome]"
3. ONE feature recommendation that directly addresses the JTBD (with a 1-sentence rationale)`,
    claudePrompt: `You are a senior PM at a top Indian consumer startup, reviewing the Day 3 assessment of an APM candidate named Pranav.

He has been given 5 Zepto app store reviews (pasted below) and asked to:
1. Write one specific user persona
2. Write one JTBD statement
3. Recommend one feature

His submission is pasted below. Evaluate it with the following structure:

**What I Got Right** — what did he get correct about the persona, JTBD, or feature logic?
**What Needs Correction** — what is factually wrong, too vague, or misapplied?
**Blind Spots** — what did he miss entirely that a strong candidate would have caught?
**India-Specific Note** — is his answer grounded in Indian user behaviour, or is it too generic / Western?
**Open Points for Tomorrow** — one question he should keep in mind going into Day 4.

End with:
- Score: X/10
- Reforge Level: Needs Focus / On Track / Outperform

Be direct. No fluff. Speak like a real PM mentor would in a coaching session, not like a chatbot.`,
    minutes: 20,
  },
  assessmentUnlocked: false,
};

// ─── MOCK API ─────────────────────────────────────────────────────────────────
export const mockApiResponse = {
  getDayData: () => Promise.resolve({ data: dayData }),
  getRoadmap: () => Promise.resolve({ data: roadmapDays }),
  completeTask: (taskId) => Promise.resolve({ data: { success: true, taskId } }),
  submitAssessment: (feedback) =>
    Promise.resolve({
      data: {
        success: true,
        parsedFeedback: {
          gotRight: "You correctly identified that the core user frustration is around reliability, not speed. The persona name and age felt grounded.",
          needsCorrection: "Your JTBD statement confused the situation with the motivation. 'When I need groceries' is too broad — it doesn't capture the trigger moment.",
          blindSpots: "You missed the emotional job entirely. The user isn't just trying to get groceries — they're trying to avoid the anxiety of running out of something mid-cooking.",
          indiaNote: "Your feature recommendation (silent delivery mode) is strong for metro users, but tier-2 cities may have very different delivery infrastructure constraints.",
          openPoints: "Tomorrow when you look at metrics — ask yourself: what would Zepto track to know if they're solving the right job?",
          score: 7,
          competencyLevel: "On Track",
        },
      },
    }),
};

// ─── ADD NEW SKILL PROMPT ─────────────────────────────────────────────────────
export const addSkillPrompt = `You are a curriculum designer for SkillForge, a platform that helps ambitious professionals build specific skills through structured 21-day programs.

I want to design a new skill track for the platform. Please help me define it by asking me questions one at a time. Cover:

1. What skill or domain do I want to build? (e.g. SQL, Public Speaking, Excel for PMs)
2. What is my current level in this area? (complete beginner / some exposure / intermediate)
3. How much time can I dedicate per day? (20 min / 45 min / 1 hour)
4. What is my end goal — what should I be able to DO after completing this track?
5. Any specific tools, companies, or contexts I want examples from? (e.g. Indian startups, B2B SaaS, finance)

After gathering my answers, generate a structured JSON output in this exact format:

{
  "skillId": "kebab-case-id",
  "title": "Skill Title",
  "subtitle": "One line description",
  "icon": "single emoji",
  "color": "#hexcolor",
  "totalDays": 14,
  "description": "2-3 sentence overview",
  "competencies": ["competency1", "competency2", "competency3"],
  "weeklyThemes": [
    { "week": 1, "theme": "Week 1 theme", "days": ["Day 1 theme", "Day 2 theme", ...] }
  ]
}

Be specific. Base examples on real Indian products and companies where possible.`;
