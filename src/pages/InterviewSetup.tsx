import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Play, Upload, FileText, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const InterviewSetup = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [mode, setMode] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[] | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);

  const isReady = role && difficulty && mode;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type (allow PDF, DOCX, TXT)
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOCX, or TXT file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    toast({
      title: "File Uploaded",
      description: `${file.name} will be used to generate custom interview questions`,
    });
  };

  const handleStartInterview = async () => {
    if (!isReady) return;

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign up to start practicing",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    navigate('/interview-session', { 
      state: { 
        role, 
        difficulty, 
        mode,
        customQuestions: generatedQuestions // Pass custom questions if available
      } 
    });
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setGeneratedQuestions(null);
    setShowQuestions(false);
  };

  const handleGenerateQuestions = async () => {
    if (!uploadedFile || !role || !difficulty) return;

    setIsProcessingFile(true);
    try {
      const fileContent = await uploadedFile.text();
      
      const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
        body: {
          documentContent: fileContent,
          role,
          difficulty,
          fileName: uploadedFile.name
        }
      });

      if (error) throw error;

      setGeneratedQuestions(data.questions);
      setShowQuestions(true);
      
      toast({
        title: "Questions Generated",
        description: `Created ${data.questions.length} custom questions from your document`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Processing Error",
        description: "Could not process the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
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

                <div className="space-y-2">
                  <Label htmlFor="curriculum">Upload Curriculum (Optional)</Label>
                  <div className="space-y-2">
                    {!uploadedFile ? (
                      <label 
                        htmlFor="file-upload" 
                        className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                      >
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Upload PDF, DOCX, or TXT (Max 10MB)
                        </span>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex items-center gap-2 p-4 border border-border rounded-lg bg-muted/30">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-sm flex-1 truncate">{uploadedFile.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                     <p className="text-xs text-muted-foreground">
                      Upload a curriculum document to generate custom questions based on the content
                    </p>
                  </div>
                </div>

                {uploadedFile && !generatedQuestions && (
                  <Button
                    onClick={handleGenerateQuestions}
                    variant="outline"
                    className="w-full"
                    disabled={isProcessingFile || !role || !difficulty}
                  >
                    {isProcessingFile ? (
                      <>
                        <Upload className="w-5 h-5 mr-2 animate-pulse" />
                        Generating Questions...
                      </>
                    ) : (
                      'Generate Questions from Document'
                    )}
                  </Button>
                )}

                {showQuestions && generatedQuestions && (
                  <div className="space-y-2 p-4 border border-border rounded-lg bg-muted/20">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Generated Questions ({generatedQuestions.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {generatedQuestions.map((question, idx) => (
                        <div key={idx} className="text-xs p-2 bg-background/50 rounded border border-border/50">
                          {idx + 1}. {question}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleStartInterview}
                  className="w-full" 
                  size="lg" 
                  disabled={!isReady || isProcessingFile}
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
