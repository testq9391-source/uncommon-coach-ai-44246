// AI Evaluation System for SIZA
// Scoring weights and evaluation criteria

export const EVALUATION_WEIGHTS = {
  confidence: 0.30,
  grammar: 0.25,
  content: 0.30,
  structure: 0.15,
} as const;

export const EVALUATION_CRITERIA = {
  confidence: "Measures tone, energy, pace, and steadiness.",
  grammar: "Checks sentence flow, filler words, and coherence.",
  content: "Evaluates how directly and insightfully the answer addresses the question.",
  structure: "Assesses logical flow (introduction → context → action → result).",
} as const;

export interface EvaluationResult {
  confidence: number;
  grammar: number;
  content: number;
  structure: number;
  overall: number;
  feedback_summary: string;
  strength: string;
  improvement: string;
}

export interface EvaluationInput {
  question: string;
  answerTranscript: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'expert';
  category: 'UX Design' | 'Graphic Design' | 'Software Development' | 'Digital Marketing';
}

export const EVALUATION_SYSTEM_PROMPT = `The interview context is a practice session for tech bootcamp students (roles include UX Design, Graphic Design, Software Development, or Digital Marketing).

Your job is to evaluate the quality of the student's answer across four core metrics:
- Confidence & Delivery
- Grammar & Clarity
- Content Relevance
- Communication Structure

Then, provide a brief, constructive feedback summary in a friendly and motivating tone that matches SIZA's brand — inspirational and inclusive.

Evaluation Criteria (weights and descriptions):

Metric | Weight | Description
Confidence & Delivery | 30% | Measures tone, energy, pace, and steadiness.
Grammar & Clarity | 25% | Checks sentence flow, filler words, and coherence.
Content Relevance | 30% | Evaluates how directly and insightfully the answer addresses the question.
Communication Structure | 15% | Assesses logical flow (introduction → context → action → result).

Instructions for Scoring:
- Score each metric from 0 to 100.
- Compute an overall score as a weighted average.
- Write a one-paragraph summary (100–150 words max) explaining the feedback.
- Keep tone constructive, encouraging, and growth-focused — never judgmental.
- Suggest one clear improvement point and one strength to celebrate.

Output Format (JSON only):
{
  "confidence": 0-100,
  "grammar": 0-100,
  "content": 0-100,
  "structure": 0-100,
  "overall": 0-100,
  "feedback_summary": "string, friendly and motivational",
  "strength": "string, one positive highlight",
  "improvement": "string, one actionable suggestion"
}`;

export const buildEvaluationPrompt = (input: EvaluationInput): string => {
  return `${EVALUATION_SYSTEM_PROMPT}

Question: "${input.question}"
Answer Transcript: "${input.answerTranscript}"
Difficulty Level: ${input.difficultyLevel}
Category: ${input.category}

Please evaluate this answer and return the JSON response.`;
};

export const calculateOverallScore = (scores: Pick<EvaluationResult, 'confidence' | 'grammar' | 'content' | 'structure'>): number => {
  return Math.round(
    scores.confidence * EVALUATION_WEIGHTS.confidence +
    scores.grammar * EVALUATION_WEIGHTS.grammar +
    scores.content * EVALUATION_WEIGHTS.content +
    scores.structure * EVALUATION_WEIGHTS.structure
  );
};
