import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const InterviewSetup = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [mode, setMode] = useState("");

  const isReady = role && difficulty && mode;

  const handleStartInterview = () => {
    if (isReady) {
      navigate('/interview-session', { 
        state: { role, difficulty, mode } 
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl space-y-8">
          <div className="text-center space-y-4">
            <h1 className="font-heading">Setup Your Interview</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Configure your practice session to match your needs. Our AI will adapt to your selections.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Interview Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ux-design">UX Design</SelectItem>
                      <SelectItem value="graphic-design">Graphic Design</SelectItem>
                      <SelectItem value="software-dev">Software Development</SelectItem>
                      <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode">Interview Mode</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger id="mode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practice">Practice Mode</SelectItem>
                      <SelectItem value="test">Test Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleStartInterview}
                  className="w-full" 
                  size="lg" 
                  disabled={!isReady}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Interview
                </Button>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6 space-y-4 bg-accent/5 border-accent/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-heading text-lg">How It Works</h3>
                    <p className="text-sm text-muted-foreground">
                      You'll be interviewed by our AI panel of three interviewers with different personalities. Answer questions via voice or text, and receive instant feedback.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4 bg-secondary/5 border-secondary/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-heading text-lg">Tips for Success</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Find a quiet space with minimal background noise</li>
                      <li>• Speak clearly and at a moderate pace</li>
                      <li>• Take your time to think before answering</li>
                      <li>• Practice mode gives you hints and tips</li>
                      <li>• Test mode simulates a real interview</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h3 className="font-heading text-lg">What You'll Get</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span>Confidence score analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <span>Grammar and clarity feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    <span>Content relevance evaluation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-orange"></div>
                    <span>Detailed improvement suggestions</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InterviewSetup;
