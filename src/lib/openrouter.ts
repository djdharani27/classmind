const OPENROUTER_KEY = process.env.API || "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

export async function analyzeMisconception(
  question: string,
  correctAnswer: string,
  studentAnswer: string,
  topic: string,
  concept: string
): Promise<{ misconception: string; reason: string; reinforcementConcept: string }> {
  if (!OPENROUTER_KEY) {
    return {
      misconception: "API key not configured",
      reason: "Set API= in .env for AI analysis",
      reinforcementConcept: concept,
    };
  }

  const prompt = `You are an educational assessment expert.

Question: ${question}
Correct Answer: ${correctAnswer}
Student Answer: ${studentAnswer}
Topic: ${topic}
Concept: ${concept}

Analyze:
1. Why is the answer wrong?
2. What misconception might the student have?
3. What concept needs reinforcement?

Return ONLY valid JSON:
{
  "misconception": "brief description of the specific misconception",
  "reason": "why the student's answer reveals this misconception",
  "reinforcementConcept": "exact concept name that needs review"
}`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ClassMind",
      },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], max_tokens: 500, temperature: 0.3 }),
    });

    if (!res.ok) {
      return { misconception: "Analysis unavailable", reason: `API error (${res.status})`, reinforcementConcept: concept };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      misconception: parsed.misconception || "Unknown",
      reason: parsed.reason || "No reason provided",
      reinforcementConcept: parsed.reinforcementConcept || concept,
    };
  } catch {
    return { misconception: "Analysis failed", reason: "Could not reach AI service", reinforcementConcept: concept };
  }
}

export async function generateAdaptiveAssessment(
  studentName: string,
  weakConcepts: string[],
  misconceptions: string[],
  incorrectEvidence: { questionText: string; studentAnswer: string; correctAnswer: string; topic: string; concept: string }[]
): Promise<{ questions: { question: string; type: "mcq" | "short_answer"; options?: string[]; answer: string; subject: string; topic: string; concept: string; difficulty: string; rationale: string }[]; rationale: string }> {
  if (!OPENROUTER_KEY) {
    return { questions: [], rationale: "API key required to generate assessments." };
  }

  if (weakConcepts.length === 0 && misconceptions.length === 0) {
    return { questions: [], rationale: "No weaknesses or misconceptions to target." };
  }

  const mistakes = incorrectEvidence
    .slice(0, 5)
    .map(e => `- Q: "${e.questionText}" | Student: "${e.studentAnswer}" | Correct: "${e.correctAnswer}" | Concept: ${e.concept}`)
    .join("\n");

  const prompt = `Generate a personalized assessment for a student targeting their specific misconceptions.

Student: ${studentName}
Weak Concepts: ${weakConcepts.join(", ")}
Misconceptions: ${misconceptions.join(", ")}

Recent mistakes:
${mistakes}

Generate 10 questions that directly target these weak concepts and misconceptions.
Each question must include a "rationale" explaining which misconception it addresses.

Return ONLY valid JSON:
{
  "rationale": "Overall strategy for this student",
  "questions": [
    {
      "question": "Solve 3x - 7 = 20",
      "type": "mcq",
      "options": ["7", "9", "5", "27"],
      "answer": "9",
      "subject": "Math",
      "topic": "Algebra",
      "concept": "Linear Equations",
      "difficulty": "medium",
      "rationale": "Targets misconception about moving constants across equation"
    }
  ]
}`;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ClassMind",
      },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], max_tokens: 2000, temperature: 0.7 }),
    });

    if (!res.ok) {
      return { questions: [], rationale: `API error (${res.status}). Try again.` };
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      questions: (parsed.questions || []).map((q: Record<string, unknown>) => ({
        question: String(q.question || ""),
        type: String(q.type || "mcq"),
        options: Array.isArray(q.options) ? q.options.map(String) : undefined,
        answer: String(q.answer || ""),
        subject: String(q.subject || "General"),
        topic: String(q.topic || "General"),
        concept: String(q.concept || "General"),
        difficulty: String(q.difficulty || "medium"),
        rationale: String(q.rationale || ""),
      })),
      rationale: parsed.rationale || "Personalized assessment.",
    };
  } catch {
    return { questions: [], rationale: "Could not reach AI service." };
  }
}
