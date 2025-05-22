
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // Assuming you might create a shared CORS helper

// Define types for request payload and quiz structure
interface GenerateQuizPayload {
  planId: string;
  topics: string[];
  learnerLevel: 'struggling' | 'on-track' | 'advanced';
  numQuestions: number;
}

interface QuizQuestion {
  question: string;
  choices: string[];
  answer: string;
}

// Placeholder for LLM call - replace with actual implementation
async function callLlmForQuiz(
  payload: GenerateQuizPayload
): Promise<QuizQuestion[]> {
  console.log("Mock LLM call with payload:", payload);
  // Simulate LLM response
  return Array.from({ length: payload.numQuestions }).map((_, i) => ({
    question: `Sample Question ${i + 1} on ${payload.topics.join(', ')} for ${payload.learnerLevel} learners? Generated at ${new Date().toISOString()}`,
    choices: [`Option A${i}`, `Option B${i}`, `Correct Answer C${i}`, `Option D${i}`],
    answer: `Correct Answer C${i}`,
  }));
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as GenerateQuizPayload;
    console.log("generate-quiz function invoked with body:", body);

    const { planId, topics, learnerLevel, numQuestions } = body;

    if (!planId || !topics || topics.length === 0 || !learnerLevel || !numQuestions) {
      return new Response(JSON.stringify({ error: 'Missing required fields or empty topics array.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (numQuestions < 1 || numQuestions > 20) { // Example validation
        return new Response(JSON.stringify({ error: 'Number of questions must be between 1 and 20.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 1. Call LLM to generate quiz content (mocked here)
    const quizQuestions = await callLlmForQuiz(body);

    // 2. Store the generated quiz in the 'quizzes' table
    // Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Edge Function environment variables
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: newQuiz, error: dbError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        plan_id: planId,
        content: quizQuestions, // Stored as JSONB
        parameters: { topics, learnerLevel, numQuestions }, // Store generation parameters
      })
      .select('id, content') // Select id and content of the newly inserted quiz
      .single();

    if (dbError) {
      console.error('Error saving quiz to DB:', dbError);
      return new Response(JSON.stringify({ error: `Database error: ${dbError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!newQuiz) {
      console.error('Quiz data was not returned after insert.');
      return new Response(JSON.stringify({ error: 'Failed to save quiz or retrieve it after saving.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log("Quiz stored successfully with ID:", newQuiz.id);

    return new Response(
      JSON.stringify({
        quizId: newQuiz.id,
        content: newQuiz.content, // Content from the DB
        planId: planId, // Echo back planId for client use
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-quiz function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate quiz' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

