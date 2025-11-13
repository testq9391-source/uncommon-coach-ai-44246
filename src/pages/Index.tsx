import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Brain, TrendingUp, Users, Zap, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-interview.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();

  const handleStartPracticing = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign up to start practicing",
      });
      navigate('/auth');
    } else {
      navigate('/interview-setup');
    }
  };
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 dust-texture relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <h1 className="font-heading">
                Practice real interviews. <br />
                <span className="text-primary">Get AI-powered feedback.</span><br />
                Improve your confidence.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Master your interview skills with our AI-powered coaching platform. Experience realistic interview scenarios, receive instant feedback, and track your progress.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="hover-lift" onClick={handleStartPracticing}>
                  Start Practicing
                </Button>
                <Button asChild variant="outline" size="lg" className="hover-lift">
                  <Link to="/dashboard">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="relative animate-fade-in">
              <div className="rounded-2xl overflow-hidden shadow-strong">
                <img 
                  src={heroImage} 
                  alt="Diverse professionals in interview setting" 
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent rounded-full blur-3xl opacity-20"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-secondary rounded-full blur-3xl opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-heading">Why Choose SIZA?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform provides everything you need to ace your next interview
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 hover-lift space-y-4 bg-card border-border">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mic className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading text-xl">AI Interview Panel</h3>
              <p className="text-muted-foreground">
                Practice with our friendly yet realistic AI interview panel. Experience different interviewer personalities and styles.
              </p>
            </Card>

            <Card className="p-8 hover-lift space-y-4 bg-card border-border">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Brain className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="font-heading text-xl">Adaptive Difficulty</h3>
              <p className="text-muted-foreground">
                Questions evolve as you improve. Our AI adapts to your skill level, ensuring optimal learning progress.
              </p>
            </Card>

            <Card className="p-8 hover-lift space-y-4 bg-card border-border">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-heading text-xl">Smart Feedback & Tracking</h3>
              <p className="text-muted-foreground">
                Get detailed feedback on your performance. Track confidence, grammar, and content relevance over time.
              </p>
            </Card>

            <Card className="p-8 hover-lift space-y-4 bg-card border-border">
              <div className="w-14 h-14 rounded-xl bg-yellow-orange/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-yellow-orange" />
              </div>
              <h3 className="font-heading text-xl">Multiple Disciplines</h3>
              <p className="text-muted-foreground">
                Practice for UX Design, Graphic Design, Software Development, and Digital Marketing roles.
              </p>
            </Card>

            <Card className="p-8 hover-lift space-y-4 bg-card border-border">
              <div className="w-14 h-14 rounded-xl bg-light-coral/10 flex items-center justify-center">
                <Zap className="w-7 h-7 text-light-coral" />
              </div>
              <h3 className="font-heading text-xl">Instant Analysis</h3>
              <p className="text-muted-foreground">
                Receive immediate AI-powered analysis of your responses. Learn what works and what needs improvement.
              </p>
            </Card>

            <Card className="p-8 hover-lift space-y-4 bg-card border-border">
              <div className="w-14 h-14 rounded-xl bg-turquoise/10 flex items-center justify-center">
                <Award className="w-7 h-7 text-turquoise" />
              </div>
              <h3 className="font-heading text-xl">Build Confidence</h3>
              <p className="text-muted-foreground">
                Practice in a safe environment. Build the confidence you need to succeed in real interviews.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 dust-texture opacity-50"></div>
        <div className="container mx-auto text-center relative z-10 space-y-8">
          <h2 className="font-heading text-white">Ready to ace your next interview?</h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Join thousands of students who have improved their interview skills with SIZA
          </p>
          <Button size="lg" variant="secondary" className="hover-lift" onClick={handleStartPracticing}>
            Get Started Free
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
