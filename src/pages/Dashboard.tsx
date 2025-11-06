import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, TrendingUp, Award, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [userAlias, setUserAlias] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("alias")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          setUserAlias(profile.alias);
        }
      }
    };

    fetchUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const categories = [
    { name: "UX Design", progress: 65, sessions: 8 },
    { name: "Graphic Design", progress: 45, sessions: 5 },
    { name: "Software Development", progress: 80, sessions: 12 },
    { name: "Digital Marketing", progress: 30, sessions: 3 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-7xl space-y-8">
          {/* Welcome Section */}
          <div className="space-y-4">
            <h1 className="font-heading">Welcome back{userAlias ? `, ${userAlias}` : ''}! 👋</h1>
            <p className="text-lg text-muted-foreground">
              Ready to continue your interview practice journey?
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 space-y-6 bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-strong">
              <div className="space-y-2">
                <h2 className="font-heading text-2xl text-white">Start New Interview</h2>
                <p className="text-primary-foreground/90">
                  Choose your role and begin practicing with our AI panel
                </p>
              </div>
              <Button asChild size="lg" variant="secondary" className="hover-lift">
                <Link to="/interview-setup">
                  <Play className="w-5 h-5 mr-2" />
                  Start Interview
                </Link>
              </Button>
            </Card>

            <Card className="p-8 space-y-4 hover-lift">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-heading text-xl">Last Session Performance</h3>
                  <p className="text-sm text-muted-foreground">Software Development - Expert</p>
                </div>
                <Award className="w-8 h-8 text-accent" />
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Confidence</span>
                    <span className="font-semibold">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Grammar & Clarity</span>
                    <span className="font-semibold">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Content Relevance</span>
                    <span className="font-semibold">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </div>
            </Card>
          </div>

          {/* Practice by Category */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-3xl">Practice by Category</h2>
              <Button asChild variant="outline">
                <Link to="/progress">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Progress
                </Link>
              </Button>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Categories</TabsTrigger>
                <TabsTrigger value="recent">Recently Practiced</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {categories.map((category) => (
                    <Card key={category.name} className="p-6 space-y-4 hover-lift">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-heading text-lg">{category.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{category.sessions} sessions completed</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{category.progress}%</div>
                          <div className="text-xs text-muted-foreground">Progress</div>
                        </div>
                      </div>
                      <Progress value={category.progress} className="h-2" />
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/interview-setup">Practice {category.name}</Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recent" className="space-y-4 mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {categories.slice(0, 2).map((category) => (
                    <Card key={category.name} className="p-6 space-y-4 hover-lift">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-heading text-lg">{category.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{category.sessions} sessions completed</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{category.progress}%</div>
                          <div className="text-xs text-muted-foreground">Progress</div>
                        </div>
                      </div>
                      <Progress value={category.progress} className="h-2" />
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/interview-setup">Practice {category.name}</Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
