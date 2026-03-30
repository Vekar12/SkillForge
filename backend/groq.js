const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function adjustTomorrowsPlan(
  openPoints,
  score,
  competencyLevel,
  tomorrowContent,
  competenciesCovered
) {
  const tomorrowTaskTitles = (tomorrowContent?.tasks || []).map(t => t.title).join(', ');
  const tomorrowCompetencies = (competenciesCovered || []).join(', ');

  const prompt = `You are adjusting a skill development plan for an APM learner.

Today's score: ${score}/10
Competency assessed: ${competencyLevel}
Open points from today: ${openPoints.join('; ')}
Tomorrow's planned competencies: ${tomorrowCompetencies}
Tomorrow's tasks: ${tomorrowTaskTitles}

Return ONLY valid JSON:
{
  "priorityNote": "one sentence for Pranav — what to focus on first tomorrow",
  "emphasizeKeywords": ["keyword1", "keyword2"],
  "suggestReviewDay": null
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 300,
    temperature: 0.1,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.choices[0].message.content.trim();

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(cleaned);
}

module.exports = { adjustTomorrowsPlan };
