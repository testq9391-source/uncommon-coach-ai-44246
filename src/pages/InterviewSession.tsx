import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Volume2, Clock, Loader2, Send, Mic, MicOff, StopCircle, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import aiPanelImage from "@/assets/ai-panel.jpg";
import { generateInterviewQuestions } from "@/data/interviewQuestions";
import { useWebSpeech } from "@/hooks/useWebSpeech";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const InterviewSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state || { role: 'Software Development', difficulty: 'Expert', mode: 'practice', customQuestions: null };
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [userAnswer, setUserAnswer] = useState("");
  const [remainingTime, setRemainingTime] = useState(30 * 60); // 30 minutes in seconds
  const [responses, setResponses] = useState<any[]>([]);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('voice');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(true);
  const [questionSet] = useState(() => {
    // Use custom questions from uploaded document if available, otherwise generate default questions
    if (config.customQuestions && Array.isArray(config.customQuestions) && config.customQuestions.length > 0) {
      return config.customQuestions;
    }
    return generateInterviewQuestions(config.role, config.difficulty, 8);
  });
  
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { 
    isListening, 
    transcription,
    interimTranscript,
    fullTranscript,
    isSupported,
    startListening, 
    stopListening, 
    clearTranscription
  } = useWebSpeech();

  const totalQuestions = questionSet.length;
  const progress = (currentQuestion / totalQuestions) * 100;

  useEffect(() => {
    // Start countdown timer
    timerRef.current = window.setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 0) {
          clearInterval(timerRef.current!);
          toast({
            title: "Time's Up!",
            description: "Your interview session has ended.",
            variant: "destructive",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Play introduction and first question when session starts
    if (!hasPlayedIntro) {
      playIntroductionAndQuestion();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Auto-play question when it changes (but not on first load)
  useEffect(() => {
    if (hasPlayedIntro && currentQuestion > 1) {
      // Small delay to let UI update
      setTimeout(() => {
        playAudio(questionSet[currentQuestion - 1]);
      }, 500);
    }
  }, [currentQuestion, hasPlayedIntro]);

  const playIntroductionAndQuestion = async () => {
    setIsLoadingAudio(true);
    
    const introText = `Hello! I'm Sarah, and I'll be conducting your ${config.difficulty} level ${config.role} interview today. I'm excited to learn more about your experience and skills. Let's begin with the first question.`;
    
    await playAudio(introText);
    
    // Brief pause then play the first question
    await new Promise(resolve => setTimeout(resolve, 800));
    await playAudio(questionSet[0]);
    
    setHasPlayedIntro(true);
    setIsLoadingAudio(false);
  };

  const playAudio = async (text: string): Promise<void> => {
    if (isPlayingAudio) {
      // Stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voice: 'nova' // OpenAI TTS voice (nova has a warm, professional tone)
        }
      });

      if (error) {
        console.error('TTS API error:', error);
        throw new Error(`TTS service error: ${error.message || 'Unknown error'}`);
      }
      if (!data?.audioContent) throw new Error('No audio content received');

      // Convert base64 to audio blob
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Return a promise that resolves when audio finishes
      return new Promise<void>((resolve, reject) => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          resolve();
        };

        audio.onerror = () => {
          setIsPlayingAudio(false);
          toast({
            title: "Audio Error",
            description: "Failed to play audio. Please try again.",
            variant: "destructive",
          });
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          reject(new Error('Audio playback failed'));
        };

        audio.play().catch(reject);
      });

    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      
      // Check if it's a quota error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('429');
      
      toast({
        title: "TTS Unavailable",
        description: isQuotaError 
          ? "TTS API quota exceeded. Continuing in text-only mode." 
          : "Audio unavailable. Continuing in text-only mode.",
        variant: "default",
      });
      
      // Don't throw - allow interview to continue without audio
      return Promise.resolve();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast({
        title: "No Answer",
        description: "Please type your answer first.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Evaluate the answer
      toast({
        title: "Analyzing",
        description: "AI is evaluating your response...",
      });

  const { data: evaluation, error: evaluationError } = await supabase.functions.invoke('evaluate-answer', {
    body: {
      question: questionSet[currentQuestion - 1],
      answer: userAnswer,
      role: config.role,
      difficulty: config.difficulty,
      questionNumber: currentQuestion,
      totalQuestions: totalQuestions,
      inputMode: inputMode // Pass input mode to determine evaluation type
    }
  });

      if (evaluationError) throw evaluationError;

      // Store the response
      const response = {
        question: questionSet[currentQuestion - 1],
        transcript: userAnswer,
        evaluation: evaluation,
        questionNumber: currentQuestion
      };

      setResponses(prev => [...prev, response]);

      // Auto-advance to next question, or finish if last question
      if (currentQuestion < totalQuestions) {
        setTimeout(() => {
          handleNextQuestion();
        }, 500);
      } else {
        // Last question - navigate to feedback after short delay
        setTimeout(() => {
          handleFinish();
        }, 1000);
      }

    } catch (error) {
      console.error('Error processing answer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze your response. Please try again.';
      toast({
        title: "Analysis Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      stopListening();
    } else {
      clearTranscription();
      await startListening();
    }
  };

  // Automatically update userAnswer when transcription changes
  useEffect(() => {
    if (inputMode === 'voice') {
      setUserAnswer(fullTranscript);
    }
  }, [fullTranscript, inputMode]);

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(prev => prev + 1);
      setUserAnswer("");
      setInputMode('voice');
      if (isListening) {
        stopListening();
      }
      clearTranscription();
    }
  };

  const handleFinish = () => {
    // Navigate to feedback with responses data
    navigate('/feedback', { 
      state: { 
        responses,
        role: config.role,
        difficulty: config.difficulty,
        mode: config.mode
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-semibold">S</span>
              </div>
              <div>
                <h2 className="font-heading text-lg">{config.role} Interview</h2>
                <p className="text-sm text-muted-foreground">{config.difficulty} Level • {config.mode === 'practice' ? 'Practice' : 'Test'} Mode</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to="/dashboard">End Session</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Interview Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Panel - Compact & Collapsible */}
            <Card className="p-4">
              <button 
                onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
              >
                <h3 className="font-heading text-lg">Interview Panel</h3>
                {isPanelCollapsed ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </button>
              
              {!isPanelCollapsed && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg overflow-hidden max-h-32">
                    <img 
                      src={aiPanelImage} 
                      alt="AI Interview Panel" 
                      className="w-full h-32 object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="font-semibold">Sarah</p>
                      <p className="text-xs text-muted-foreground">Friendly</p>
                    </div>
                    <div>
                      <p className="font-semibold">Marcus</p>
                      <p className="text-xs text-muted-foreground">Neutral</p>
                    </div>
                    <div>
                      <p className="font-semibold">Elena</p>
                      <p className="text-xs text-muted-foreground">Analytical</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Question Card */}
            <Card className="p-8 space-y-6 bg-primary/5 border-primary/20">
              {isLoadingAudio ? (
                <div className="flex items-center justify-center py-12 space-x-3">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-lg text-muted-foreground">Preparing interview audio...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-primary">Sarah asks:</span>
                        {currentQuestion === totalQuestions && (
                          <span className="ml-2 px-2 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded">
                            Last Question
                          </span>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => playAudio(questionSet[currentQuestion - 1])}
                          disabled={isPlayingAudio}
                        >
                          <Volume2 className={`w-4 h-4 mr-1 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                          {isPlayingAudio ? 'Playing...' : 'Play Audio'}
                        </Button>
                      </div>
                      <p className="text-lg font-medium leading-relaxed">
                        {questionSet[currentQuestion - 1]}
                      </p>
                    </div>
                  </div>

                  {/* Answer Input Interface */}
                  <div className="space-y-4">
                {/* Input Mode Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Your Answer:</label>
                  <div className="flex gap-2">
                    <Button
                      variant={inputMode === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode('text')}
                      disabled={isListening || responses.some(r => r.questionNumber === currentQuestion)}
                    >
                      Text
                    </Button>
                    <Button
                      variant={inputMode === 'voice' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode('voice')}
                      disabled={isListening || responses.some(r => r.questionNumber === currentQuestion)}
                    >
                      Voice
                    </Button>
                  </div>
                </div>

                {inputMode === 'text' ? (
                  <Textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onCopy={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    placeholder="Type your answer here..."
                    className="min-h-[120px] resize-none"
                    disabled={isProcessing || responses.some(r => r.questionNumber === currentQuestion)}
                  />
                ) : (
                  <div className="min-h-[120px] border rounded-lg flex flex-col items-center justify-center gap-4 p-6 bg-muted/30">
                    {!isSupported ? (
                      <div className="text-center space-y-2">
                        <MicOff className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Voice input not supported in this browser</p>
                        <p className="text-xs text-muted-foreground">Please use Chrome, Edge, or Safari</p>
                      </div>
                    ) : !isListening ? (
                      <div className="text-center space-y-2">
                        <Mic className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click the microphone button below to start speaking</p>
                        <p className="text-xs text-muted-foreground">Your speech will be transcribed in real-time</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-3 w-full">
                        <div className="relative">
                          <div className="w-16 h-16 mx-auto bg-destructive rounded-full flex items-center justify-center animate-pulse">
                            <Mic className="w-8 h-8 text-destructive-foreground" />
                          </div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-destructive animate-pulse" style={{ width: '100%' }}></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-destructive">Listening...</p>
                          <p className="text-xs text-muted-foreground">Speak your answer now</p>
                        </div>
                        {fullTranscript && (
                          <div className="mt-4 p-3 bg-background rounded-lg text-left">
                            <p className="text-sm">
                              {transcription}
                              {interimTranscript && (
                                <span className="text-muted-foreground italic"> {interimTranscript}</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {inputMode === 'voice' && !responses.some(r => r.questionNumber === currentQuestion) && isSupported && (
                  <div className="space-y-2">
                    <Button
                      onClick={handleVoiceToggle}
                      disabled={isProcessing}
                      className="w-full"
                      size="lg"
                      variant={isListening ? 'destructive' : 'default'}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop Listening
                        </>
                      ) : (
                        <>
                          <Mic className="w-5 h-5 mr-2" />
                          Start Speaking
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {inputMode === 'text' && (
                  <Button 
                    onClick={handleSubmitAnswer}
                    disabled={isProcessing || !userAnswer.trim() || responses.some(r => r.questionNumber === currentQuestion)}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Answer
                      </>
                    )}
                  </Button>
                )}

                {inputMode === 'voice' && userAnswer && !responses.some(r => r.questionNumber === currentQuestion) && (
                  <div className="space-y-3">
                    <div className="p-4 bg-background rounded-lg border border-border">
                      <p className="text-xs text-muted-foreground mb-2">Transcribed text:</p>
                      <p className="text-sm">{userAnswer}</p>
                    </div>
                    <Button 
                      onClick={handleSubmitAnswer}
                      disabled={isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Submit Answer
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {responses.some(r => r.questionNumber === currentQuestion) && (
                  <div className="p-4 bg-background rounded-lg border border-border space-y-3">
                    <p className="text-sm font-semibold text-green-600">✓ Answer submitted successfully!</p>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Your response:</p>
                      <p className="text-sm">{responses.find(r => r.questionNumber === currentQuestion)?.transcript}</p>
                    </div>
                  </div>
                )}

                {!isProcessing && !responses.some(r => r.questionNumber === currentQuestion) && inputMode === 'text' && (
                  <p className="text-center text-sm text-muted-foreground">
                    Type your answer or switch to voice mode
                  </p>
                )}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg">Progress</h3>
                <span className="text-sm font-semibold text-primary">
                  {currentQuestion} / {totalQuestions}
                </span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground">
                Questions completed
              </p>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className={`text-2xl font-bold ${remainingTime < 60 ? 'text-red-600' : remainingTime < 300 ? 'text-yellow-600' : ''}`}>
                    {formatTime(remainingTime)}
                  </p>
                  <p className="text-xs text-muted-foreground">Time remaining</p>
                </div>
              </div>
            </Card>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full" size="lg">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Quick Tips
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <h3 className="font-heading text-lg">Interview Tips</h3>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Structure your answer clearly with beginning, middle, and end</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Use specific examples from your experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Show your thought process and reasoning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Ask for clarification if you need it</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>Take a breath before answering to collect your thoughts</span>
                    </li>
                  </ul>
                </div>
              </PopoverContent>
            </Popover>

            <div className="space-y-3">
              {currentQuestion < totalQuestions && (
                <Button 
                  className="w-full" 
                  onClick={handleNextQuestion}
                  disabled={isProcessing || !responses.some(r => r.questionNumber === currentQuestion)}
                >
                  Next Question
                </Button>
              )}
              {currentQuestion === totalQuestions && responses.some(r => r.questionNumber === currentQuestion) && (
                <Button 
                  onClick={handleFinish}
                  className="w-full"
                  size="lg"
                >
                  Submit & View Results
                </Button>
              )}
              {currentQuestion < totalQuestions && (
                <Button 
                  onClick={handleFinish}
                  variant="outline" 
                  className="w-full"
                  disabled={responses.length === 0}
                >
                  Finish Early & View Feedback
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewSession;
