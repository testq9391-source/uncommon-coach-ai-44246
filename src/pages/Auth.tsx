import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [alias, setAlias] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  const handleQuickStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Sign in anonymously
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) throw error;

      if (data.user) {
        // Create profile with alias
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            alias: alias.trim(),
          });

        if (profileError) throw profileError;

        toast({
          title: "Welcome to SIZA!",
          description: `Let's get started, ${alias}`,
        });

        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        if (data.user) {
          const aliasName = formData.get("name") as string;
          await supabase.from("profiles").insert({
            id: data.user.id,
            alias: aliasName || email.split("@")[0],
          });
        }

        toast({
          title: "Success",
          description: "Account created successfully!",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Signed in successfully",
        });
      }

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-20 dust-texture bg-gradient-to-b from-muted/20 to-transparent">
        <Card className="w-full max-w-md p-8 space-y-6 shadow-strong">
          <div className="text-center space-y-2">
            <h1 className="font-heading text-3xl">Welcome to SIZA</h1>
            <p className="text-muted-foreground">Start practicing interviews in seconds</p>
          </div>

          {/* Quick Start with Alias */}
          <form onSubmit={handleQuickStart} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alias">Your Name</Label>
              <Input 
                id="alias" 
                type="text" 
                placeholder="Enter your name"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                required 
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                No email or password needed - just enter your name to start
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Starting..." : "Quick Start"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or use email</span>
            </div>
          </div>

          {/* Traditional Email/Password Auth */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={(e) => handleEmailAuth(e, false)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder="you@example.com"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={(e) => handleEmailAuth(e, true)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name"
                    type="text" 
                    placeholder="John Doe"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    name="email"
                    type="email" 
                    placeholder="you@example.com"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password" 
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required 
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
