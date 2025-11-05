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
    const { documentContent, role, difficulty, fileName } = await req.json();
    
    if (!documentContent || !role || !difficulty) {
      throw new Error('Document content, role, and difficulty are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating questions from ${fileName} for ${role} at ${difficulty} level...`);

    const systemPrompt = `You are an expert interview question generator for SIZA, an AI interview coach platform. 

Your task is to analyze the provided document content and generate interview questions that:
1. Are relevant to the ${role} role
2. Match the ${difficulty} difficulty level
3. Cover key topics and concepts from the document
4. Mix document-specific questions with general interview questions
5. Include questions about practical application of the concepts

Generate 8 questions total:
- 2 warm-up questions (easier, about the candidate)
- 4 questions based on document content (varying difficulty)
- 2 general professional questions (like salary expectations, career goals)

Each question should be clear, concise, and interview-appropriate.

You must respond ONLY with valid JSON in this exact format:
{
  "questions": [
    "Question 1 text here",
    "Question 2 text here",
    ...8 questions total
  ],
  "categories": [
    "warm-up",
    "document-content",
    "document-content",
    "document-content",
    "document-content",
    "general",
    "general",
    "warm-up"
  ]
}

The categories array must match the order and length of the questions array.`;

    const userPrompt = `Document Content:
${documentContent.substring(0, 8000)} 

Role: ${role}
Difficulty: ${difficulty}

Please generate 8 interview questions with their categories as specified.`;

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
      throw new Error(`AI question generation error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '{}';
    
    console.log('Generated questions result:', content);

    // Parse the JSON response from AI
    let generatedData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      generatedData = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      // Fallback questions if AI didn't return valid JSON
      generatedData = {
        questions: [
          "Tell me about yourself and your background.",
          "What interests you most about this role?",
          "Can you explain a key concept from your studies that you find most important?",
          "How would you apply what you've learned to solve a real-world problem?",
          "Describe a challenging project you worked on recently.",
          "What are your salary expectations for this position?",
          "Where do you see yourself in 5 years?",
          "Why should we hire you for this role?"
        ],
        categories: [
          "warm-up",
          "warm-up", 
          "document-content",
          "document-content",
          "document-content",
          "general",
          "general",
          "document-content"
        ]
      };
    }

    return new Response(
      JSON.stringify(generatedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-interview-questions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate questions. Please try again.' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
