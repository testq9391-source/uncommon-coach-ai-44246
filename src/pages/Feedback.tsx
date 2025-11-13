import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, Volume2, RefreshCw, Home, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Feedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const responses = location.state?.responses || [];
  const role = location.state?.role;
  const difficulty = location.state?.difficulty;
  const mode = location.state?.mode;
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  // Calculate scores from responses
  const calculateScores = () => {
    if (responses.length === 0) {
      return {
        confidence: 0,
        grammar: 0,
        relevance: 0,
        clarity: 0,
        overall: 0
      };
    }

    let totalConfidence = 0;
    let totalGrammar = 0;
    let totalRelevance = 0;
    let totalClarity = 0;

    responses.forEach((response: any) => {
      const scores = response.evaluation?.scores || {};
      totalConfidence += (scores.confidence || 0) * 10;
      totalGrammar += (scores.grammar || 0) * 10;
      totalRelevance += (scores.relevance || 0) * 10;
      totalClarity += (scores.clarity || 0) * 10;
    });

    const count = responses.length;
    const confidence = Math.round(totalConfidence / count);
    const grammar = Math.round(totalGrammar / count);
    const relevance = Math.round(totalRelevance / count);
    const clarity = Math.round(totalClarity / count);
    const overall = Math.round((confidence + grammar + relevance + clarity) / 4);

    return { confidence, grammar, relevance, clarity, overall };
  };

  const scores = calculateScores();

  // Aggregate feedback from all responses
  const aggregateFeedback = () => {
    const allStrengths: string[] = [];
    const allImprovements: string[] = [];

    responses.forEach((response: any) => {
      const evaluation = response.evaluation || {};
      if (evaluation.strengths) {
        allStrengths.push(...evaluation.strengths);
      }
      if (evaluation.improvements) {
        allImprovements.push(...evaluation.improvements);
      }
    });

    return [
      {
        title: "Strong Points",
        items: allStrengths.length > 0 ? allStrengths.slice(0, 5) : ["Complete an interview to see feedback"]
      },
      {
        title: "Areas for Improvement",
        items: allImprovements.length > 0 ? allImprovements.slice(0, 5) : ["Complete an interview to see feedback"]
      }
    ];
  };

  const feedback = aggregateFeedback();

  // Save session to database
  useEffect(() => {
    const saveSession = async () => {
      if (sessionSaved || responses.length === 0) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { error } = await supabase
          .from('interview_sessions')
          .insert({
            user_id: session.user.id,
            role: role || 'unknown',
            difficulty: difficulty || 'unknown',
            mode: mode || 'practice',
            overall_score: scores.overall,
            confidence_score: scores.confidence,
            grammar_score: scores.grammar,
            relevance_score: scores.relevance,
            clarity_score: scores.clarity,
            responses: responses
          });

        if (error) throw error;
        setSessionSaved(true);
      } catch (error) {
        console.error('Error saving session:', error);
      }
    };

    saveSession();
  }, [responses, sessionSaved, scores, role, difficulty, mode]);

  const generateFeedbackAudio = async () => {
    setIsGeneratingAudio(true);
    
    try {
      // Create comprehensive feedback text
      let feedbackText = `Here's your interview feedback. Your overall performance score is ${scores.overall} percent. `;
      feedbackText += `You scored ${scores.confidence} percent on confidence, ${scores.grammar} percent on grammar and clarity, `;
      feedbackText += `${scores.relevance} percent on content relevance, and ${scores.clarity} percent on clarity. `;
      
      if (responses.length > 0) {
        const firstEvaluation = responses[0].evaluation;
        if (firstEvaluation?.feedback) {
          feedbackText += firstEvaluation.feedback;
        }
      }

      // Call text-to-speech edge function
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: feedbackText,
          voice: 'Aria'
        }
      });

      if (error) throw error;

      // Convert base64 to audio URL
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Play audio automatically
      const audio = new Audio(url);
      audio.play();
      setIsPlayingAudio(true);
      
      audio.onended = () => {
        setIsPlayingAudio(false);
      };

      toast({
        title: "Playing Feedback",
        description: "Listen to your AI-generated voice feedback",
      });

    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "Audio Generation Failed",
        description: "Unable to generate voice feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const playFeedbackAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
      setIsPlayingAudio(true);
      audio.onended = () => {
        setIsPlayingAudio(false);
      };
    } else {
      generateFeedbackAudio();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-5xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-4">
              <Award className="w-10 h-10 text-accent" />
            </div>
            <h1 className="font-heading">Interview Complete!</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Great job! Here's your detailed performance analysis
            </p>
          </div>

          {/* Overall Score */}
          <Card className="p-8 text-center space-y-4 bg-gradient-to-br from-primary/5 to-secondary/5">
            <h2 className="font-heading text-2xl">Overall Performance</h2>
            <div className="relative inline-block">
              <div className="text-6xl font-bold text-primary">{scores.overall}%</div>
              <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl -z-10"></div>
            </div>
            <p className="text-muted-foreground">You're performing above average!</p>
          </Card>

          {/* Score Breakdown */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4 hover-lift">
              <div className="flex items-center justify-between">
                <h3 className="font-heading">Confidence</h3>
                <span className="text-2xl font-bold text-primary">{scores.confidence}%</span>
              </div>
              <Progress value={scores.confidence} className="h-3" />
              <p className="text-sm text-muted-foreground">
                Your delivery was confident and clear
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-lift">
              <div className="flex items-center justify-between">
                <h3 className="font-heading">Grammar & Clarity</h3>
                <span className="text-2xl font-bold text-secondary">{scores.grammar}%</span>
              </div>
              <Progress value={scores.grammar} className="h-3" />
              <p className="text-sm text-muted-foreground">
                Excellent communication skills
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-lift">
              <div className="flex items-center justify-between">
                <h3 className="font-heading">Content Relevance</h3>
                <span className="text-2xl font-bold text-accent">{scores.relevance}%</span>
              </div>
              <Progress value={scores.relevance} className="h-3" />
              <p className="text-sm text-muted-foreground">
                Good alignment with questions
              </p>
            </Card>
          </div>

          {/* Detailed Feedback */}
          <div className="grid md:grid-cols-2 gap-6">
            {feedback.map((section) => (
              <Card key={section.title} className="p-6 space-y-4">
                <h3 className="font-heading text-xl">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          {/* AI Feedback Audio */}
          <Card className="p-6 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg">AI Voice Feedback</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={playFeedbackAudio}
                disabled={isGeneratingAudio || isPlayingAudio || responses.length === 0}
              >
                {isGeneratingAudio ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4 mr-2" />
                )}
                {isGeneratingAudio ? "Generating..." : isPlayingAudio ? "Playing..." : "Play Feedback"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Listen to detailed feedback from our AI panel on your performance
            </p>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="hover-lift">
              <Link to="/interview-setup">
                <RefreshCw className="w-5 h-5 mr-2" />
                Practice Again
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="hover-lift">
              <Link to="/dashboard">
                <Home className="w-5 h-5 mr-2" />
                Return to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="hover-lift">
              <Link to="/progress">
                <TrendingUp className="w-5 h-5 mr-2" />
                View Progress
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Feedback;
