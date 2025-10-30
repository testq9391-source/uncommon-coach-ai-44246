import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, answer, role, difficulty, questionNumber, totalQuestions } = await req.json();
    
    if (!question || !answer) {
      throw new Error('Question and answer are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Evaluating answer for question ${questionNumber || 1} of ${totalQuestions || 'N/A'} with Lovable AI...`);
    console.log(`Role: ${role}, Difficulty: ${difficulty}`);

    const systemPrompt = `You are an expert interview coach evaluating interview responses. You must respond ONLY with valid JSON in this exact format:
{
  "scores": {
    "clarity": number (0-10),
    "confidence": number (0-10),
    "relevance": number (0-10),
    "depth": number (0-10),
    "professionalism": number (0-10)
  },
  "strengths": [string, string, string],
  "improvements": [string, string, string],
  "feedback": "string (3-4 sentences with specific, actionable advice)"
}

Provide a thorough evaluation based on:
- Clarity: How clear, organized, and well-structured is the answer?
- Confidence: How confident and assured does the response sound? Does it demonstrate self-awareness?
- Relevance: How directly and comprehensively does it address the question?
- Depth: How much detail, insight, and expertise is demonstrated? Are examples provided?
- Professionalism: Quality of language, grammar, tone, and communication style.

Provide 3 specific strengths highlighting what the candidate did well.
Provide 3 specific, actionable areas for improvement with concrete suggestions.
Give constructive feedback that encourages growth while being honest about performance.`;

    const userPrompt = `Role: ${role || 'General'}
Difficulty Level: ${difficulty || 'Intermediate'}
Question ${questionNumber || 1} of ${totalQuestions || 'several'}

Question: ${question}

Candidate's Answer: ${answer}

Please provide a thorough evaluation in the JSON format specified. Be specific, constructive, and actionable in your feedback.`;

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error(`AI evaluation error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '{}';
    
    console.log('Evaluation result:', content);

    // Parse the JSON response from AI
    let evaluation;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      evaluation = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Fallback response if AI didn't return valid JSON
      evaluation = {
        scores: {
          clarity: 7,
          confidence: 7,
          relevance: 7,
          depth: 6,
          professionalism: 8
        },
        strengths: [
          'Good attempt at answering the question',
          'Demonstrated understanding of the topic',
          'Clear communication style'
        ],
        improvements: [
          'Could provide more specific examples from your experience',
          'Consider structuring your answer with a clear beginning, middle, and end',
          'Add more depth by explaining the "why" behind your approaches'
        ],
        feedback: 'Your response shows a solid understanding of the topic and good communication skills. To elevate your answer, incorporate specific examples from your experience and provide more context about your decision-making process. Structure your response to guide the interviewer through your thinking step-by-step.'
      };
    }

    return new Response(
      JSON.stringify(evaluation),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in evaluate-answer function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to analyze your response. Please try again.' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
