import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      topic, 
      numQuestions = 10, 
      numChoices = 4, 
      difficulty = 7, 
      lang = "en", 
      questionType = "multiple-choice", 
      skillLevel = "intermediate", 
      jobRole = "Frontend Developer", 
      industry = "Software Development" 
    } = await req.json();
    
    if (!topic) {
      throw new Error('Topic is required');
    }

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    console.log('Generating interview questions for:', { topic, jobRole, industry, difficulty });

    // Call RapidAPI Generate Job Interview Questions endpoint
    const response = await fetch('https://generate-job-interview-questions-ai-quick-assess.p.rapidapi.com/generate?noguess=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'generate-job-interview-questions-ai-quick-assess.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY,
      },
      body: JSON.stringify({
        topic,
        numQuestions,
        numChoices,
        difficulty,
        lang,
        questionType,
        skillLevel,
        jobRole,
        industry
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RapidAPI error:', response.status, errorText);
      throw new Error(`Question generation API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Generated questions:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-interview-questions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
