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
import { uxDesignBeginnerQuestions } from "@/data/uxDesignQuestions";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const InterviewSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state || { role: 'Software Development', difficulty: 'Expert', mode: 'practice' };
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [userAnswer, setUserAnswer] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { 
    isRecording, 
    isProcessing: isVoiceProcessing, 
    recordingDuration,
    audioUrl,
    hasRecording,
    startRecording, 
    stopRecording, 
    transcribeAudio,
    cancelRecording 
  } = useVoiceRecorder();
  
  // Determine which questions to use based on configuration
  const useUXQuestions = config.role === 'ux-design' && 
                         config.difficulty === 'beginner' && 
                         (config.mode === 'practice' || config.mode === 'test');

  const questionSet = useUXQuestions 
    ? uxDesignBeginnerQuestions.map(q => q.question)
    : [
        "Can you walk me through your process for debugging a complex issue in a production environment?",
        "How do you stay updated with the latest technologies and best practices in your field?",
        "Describe a challenging project you've worked on and how you overcame the obstacles.",
        "How do you approach working with cross-functional teams?",
        "What's your experience with agile methodologies?",
        "How do you prioritize tasks when working on multiple projects?",
        "Can you explain a technical concept to someone non-technical?",
        "What are your career goals for the next 3-5 years?"
      ];

  const totalQuestions = questionSet.length;
  const progress = (currentQuestion / totalQuestions) * 100;

  useEffect(() => {
    // Start timer
    timerRef.current = window.setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    // Play introduction when session starts
    if (!hasPlayedIntro) {
      playIntroduction();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playIntroduction = async () => {
    const introText = `Hello! I'm Sarah, and I'll be conducting your ${config.difficulty} level ${config.role} interview today. I'm excited to learn more about your experience and skills. Let's begin with the first question. Feel free to take your time and answer either by typing or using voice recording.`;
    
    await playAudio(introText);
    setHasPlayedIntro(true);
  };

  const playAudio = async (text: string) => {
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
          voice: 'Charlotte' // Using Charlotte for warm, professional tone
        }
      });

      if (error) throw error;
      if (!data?.audioContent) throw new Error('No audio content received');

      // Convert base64 to audio blob
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
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
      };

      await audio.play();

    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      toast({
        title: "Audio Error",
        description: "Failed to generate audio. Please try again.",
        variant: "destructive",
      });
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
          difficulty: config.difficulty
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

      toast({
        title: "Success!",
        description: "Your response has been evaluated.",
      });

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

  const handleVoiceRecord = async () => {
    if (isRecording) {
      try {
        await stopRecording();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    } else {
      await startRecording();
    }
  };

  const handleTranscribe = async () => {
    try {
      const transcription = await transcribeAudio();
      setUserAnswer(transcription);
    } catch (error) {
      console.error('Error transcribing:', error);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(prev => prev + 1);
      setUserAnswer("");
      setInputMode('text');
    }
  };

  const handleFinish = () => {
    // Navigate to feedback with responses data
    navigate('/feedback', { state: { responses } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-semibold">U</span>
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
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">Sarah asks:</span>
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
                      disabled={isRecording || isVoiceProcessing || responses.some(r => r.questionNumber === currentQuestion)}
                    >
                      Text
                    </Button>
                    <Button
                      variant={inputMode === 'voice' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInputMode('voice')}
                      disabled={isRecording || isVoiceProcessing || responses.some(r => r.questionNumber === currentQuestion)}
                    >
                      Voice
                    </Button>
                  </div>
                </div>

                {inputMode === 'text' ? (
                  <Textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="min-h-[120px] resize-none"
                    disabled={isProcessing || responses.some(r => r.questionNumber === currentQuestion)}
                  />
                ) : (
                  <div className="min-h-[120px] border rounded-lg flex flex-col items-center justify-center gap-4 p-6 bg-muted/30">
                    {!isRecording && !isVoiceProcessing && !hasRecording && (
                      <div className="text-center space-y-2">
                        <Mic className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click below to start recording your answer</p>
                        <p className="text-xs text-muted-foreground">Speak clearly and at a normal pace</p>
                      </div>
                    )}
                    {isRecording && (
                      <div className="text-center space-y-3">
                        <div className="relative">
                          <div className="w-16 h-16 mx-auto bg-destructive rounded-full flex items-center justify-center animate-pulse">
                            <Mic className="w-8 h-8 text-destructive-foreground" />
                          </div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-destructive animate-pulse" style={{ width: '100%' }}></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-bold text-destructive tabular-nums">{formatRecordingTime(recordingDuration)}</p>
                          <p className="text-sm font-medium">Recording in progress...</p>
                          <p className="text-xs text-muted-foreground">Click stop when finished</p>
                        </div>
                      </div>
                    )}
                    {hasRecording && !isVoiceProcessing && !userAnswer && (
                      <div className="text-center space-y-3 w-full">
                        <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                          <Mic className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-green-600">✓ Recording saved ({formatRecordingTime(recordingDuration)})</p>
                          <p className="text-xs text-muted-foreground">Review your recording below</p>
                        </div>
                        {audioUrl && (
                          <audio 
                            controls 
                            src={audioUrl} 
                            className="w-full max-w-xs mx-auto"
                            preload="metadata"
                          />
                        )}
                      </div>
                    )}
                    {isVoiceProcessing && (
                      <div className="text-center space-y-2">
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                        <p className="text-sm font-medium">Transcribing your audio...</p>
                        <p className="text-xs text-muted-foreground">This may take a moment</p>
                      </div>
                    )}
                  </div>
                )}

                {inputMode === 'voice' && !responses.some(r => r.questionNumber === currentQuestion) && (
                  <div className="space-y-2">
                    {!hasRecording ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleVoiceRecord}
                          disabled={isVoiceProcessing}
                          className="flex-1"
                          size="lg"
                          variant={isRecording ? 'destructive' : 'default'}
                        >
                          {isRecording ? (
                            <>
                              <StopCircle className="w-5 h-5 mr-2" />
                              Stop Recording
                            </>
                          ) : (
                            <>
                              <Mic className="w-5 h-5 mr-2" />
                              Start Recording
                            </>
                          )}
                        </Button>
                        {isRecording && (
                          <Button
                            onClick={cancelRecording}
                            variant="outline"
                            size="lg"
                          >
                            <MicOff className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleTranscribe}
                          disabled={isVoiceProcessing || !!userAnswer}
                          className="flex-1"
                          size="lg"
                        >
                          {isVoiceProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Transcribing...
                            </>
                          ) : userAnswer ? (
                            '✓ Transcribed'
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Transcribe Audio
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={cancelRecording}
                          variant="outline"
                          size="lg"
                          disabled={isVoiceProcessing}
                        >
                          <MicOff className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
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

                {!isProcessing && !isVoiceProcessing && !responses.some(r => r.questionNumber === currentQuestion) && inputMode === 'text' && (
                  <p className="text-center text-sm text-muted-foreground">
                    Type your answer or switch to voice mode
                  </p>
                )}
              </div>
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
                  <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
                  <p className="text-xs text-muted-foreground">Time elapsed</p>
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
              <Button 
                className="w-full" 
                onClick={handleNextQuestion}
                disabled={currentQuestion === totalQuestions || isProcessing || !responses.some(r => r.questionNumber === currentQuestion)}
              >
                Next Question
              </Button>
              <Button 
                onClick={handleFinish}
                variant="outline" 
                className="w-full"
                disabled={responses.length === 0}
              >
                Finish & View Feedback
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewSession;
