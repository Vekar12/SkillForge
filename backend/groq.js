const Groq = require('groq-sdk');

// Adjust tomorrow's plan based on today's assessment
async function adjustTomorrowsPlan(openPoints, score, competencyLevel, tomorrowContent, competenciesCovered, apiKey) {
  const groq = new Groq({ apiKey });

  const prompt = `You are adjusting a skill development plan for an APM learner.

Today's score: ${score}/10
Competency assessed: ${competencyLevel}
Open points from today: ${openPoints.join('; ')}
Tomorrow's planned competencies: ${(competenciesCovered || []).join(', ')}
Tomorrow's tasks: ${(tomorrowContent?.tasks || []).map(t => t.title).join(', ')}

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
  const result = JSON.parse(text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''));

  // Validate required fields so callers don't silently store incomplete data.
  // If the LLM omits a field the downstream code would write undefined to Sheets.
  const required = ['priorityNote', 'emphasizeKeywords', 'suggestReviewDay'];
  for (const field of required) {
    if (!(field in result)) throw new Error(`adjustTomorrowsPlan: LLM response missing field '${field}'`);
  }
  return result;
}

// Generate a skill roadmap spec for admin review
async function generateSkillSpec(skillTitle, description, apiKey) {
  const groq = new Groq({ apiKey });

  const prompt = `You are generating a structured learning roadmap spec for a new skill.

Skill title: "${skillTitle}"
Description: "${description}"

Return ONLY valid JSON matching this structure:
{
  "skill": "${skillTitle}",
  "totalDays": 21,
  "summary": "2-3 sentence overview of what the learner will achieve",
  "competencies": ["competency1", "competency2", "competency3"],
  "sampleDay": {
    "day": 1,
    "title": "Day 1 title",
    "competenciesCovered": ["competency1"],
    "tasks": [
      { "id": "d1_read_1", "type": "READ", "title": "Read: ...", "isBonus": false },
      { "id": "d1_search_1", "type": "SEARCH", "title": "Search: ...", "isBonus": false },
      { "id": "d1_activity_1", "type": "ACTIVITY", "title": "Activity: ...", "isBonus": false }
    ]
  }
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 600,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.choices[0].message.content.trim();
  const spec = JSON.parse(text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''));

  // Validate required fields before returning to the caller. Storing a spec
  // with missing fields would silently corrupt the roadmap for that skill.
  const required = ['skill', 'totalDays', 'summary', 'competencies', 'sampleDay'];
  for (const field of required) {
    if (!(field in spec)) throw new Error(`generateSkillSpec: LLM response missing field '${field}'`);
  }
  return spec;
}

module.exports = { adjustTomorrowsPlan, generateSkillSpec };
