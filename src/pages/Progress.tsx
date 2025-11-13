import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, Award, Calendar, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

interface Session {
  id: string;
  created_at: string;
  role: string;
  difficulty: string;
  mode: string;
  overall_score: number;
  confidence_score: number;
  grammar_score: number;
  relevance_score: number;
  clarity_score: number;
}

const Progress = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchSessions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Authentication Required",
          description: "Please sign up to view your progress",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSessions(data || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load your progress data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchSessions();
  }, [navigate]);

  const calculateStats = () => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        bestScore: 0
      };
    }

    const totalScore = sessions.reduce((sum, s) => sum + s.overall_score, 0);
    const bestScore = Math.max(...sessions.map(s => s.overall_score));

    return {
      totalSessions: sessions.length,
      averageScore: Math.round(totalScore / sessions.length),
      bestScore
    };
  };

  const calculateGrowthInsights = () => {
    if (sessions.length === 0) {
      return { strongest: null, focus: null };
    }

    const avgConfidence = sessions.reduce((sum, s) => sum + s.confidence_score, 0) / sessions.length;
    const avgGrammar = sessions.reduce((sum, s) => sum + s.grammar_score, 0) / sessions.length;
    const avgRelevance = sessions.reduce((sum, s) => sum + s.relevance_score, 0) / sessions.length;
    const avgClarity = sessions.reduce((sum, s) => sum + s.clarity_score, 0) / sessions.length;

    const scores = [
      { name: 'Confidence', score: avgConfidence },
      { name: 'Grammar & Clarity', score: avgGrammar },
      { name: 'Content Relevance', score: avgRelevance },
      { name: 'Clarity', score: avgClarity }
    ];

    scores.sort((a, b) => b.score - a.score);

    return {
      strongest: { name: scores[0].name, score: Math.round(scores[0].score) },
      focus: { name: scores[scores.length - 1].name, score: Math.round(scores[scores.length - 1].score) }
    };
  };

  const stats = calculateStats();
  const growth = calculateGrowthInsights();

  const statsDisplay = [
    { label: "Total Sessions", value: stats.totalSessions.toString(), icon: Calendar, color: "text-primary" },
    { label: "Average Score", value: `${stats.averageScore}%`, icon: TrendingUp, color: "text-secondary" },
    { label: "Best Performance", value: `${stats.bestScore}%`, icon: Award, color: "text-accent" },
  ];

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      'ux-design': 'UX Design',
      'graphic-design': 'Graphic Design',
      'software-dev': 'Software Development',
      'digital-marketing': 'Digital Marketing'
    };
    return roleMap[role] || role;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-20 px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-7xl space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="font-heading">Your Progress</h1>
              <p className="text-muted-foreground">Track your improvement over time</p>
            </div>
            <Button variant="outline" className="hover-lift">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          {sessions.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <h2 className="font-heading text-2xl">No Sessions Yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start practicing to see your progress and track your improvement over time
              </p>
              <Button onClick={() => navigate('/interview-setup')} className="mt-4">
                Start Your First Session
              </Button>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {statsDisplay.map((stat) => (
                  <Card key={stat.label} className="p-6 hover-lift">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Performance Chart */}
              <Card className="p-8 space-y-6">
                <h2 className="font-heading text-2xl">Performance Over Time</h2>
                <div className="h-64 flex items-end justify-between gap-2">
                  {sessions.slice(0, 10).reverse().map((session, index) => (
                    <div key={session.id} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-muted/30 rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
                        <div 
                          className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all hover:opacity-80"
                          style={{ height: `${session.overall_score}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-8 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary"></div>
                    <span className="text-muted-foreground">Score</span>
                  </div>
                </div>
              </Card>

              {/* Session History */}
              <Card className="p-8 space-y-6">
                <h2 className="font-heading text-2xl">Session History</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>{new Date(session.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{getRoleName(session.role)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.difficulty === 'expert' ? 'bg-primary/10 text-primary' :
                            session.difficulty === 'intermediate' ? 'bg-secondary/10 text-secondary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{session.overall_score}%</span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.overall_score >= 80 ? 'bg-accent/10 text-accent' :
                            session.overall_score >= 70 ? 'bg-yellow-orange/10 text-yellow-orange' :
                            'bg-light-coral/10 text-light-coral'
                          }`}>
                            {session.overall_score >= 80 ? 'Excellent' : session.overall_score >= 70 ? 'Good' : 'Needs Work'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* Growth Insights */}
              {growth.strongest && growth.focus && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6 space-y-4 bg-accent/5 border-accent/20">
                    <h3 className="font-heading text-xl">Strongest Area</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{growth.strongest.name}</span>
                      <span className="text-3xl font-bold text-accent">{growth.strongest.score}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You consistently perform well in this area
                    </p>
                  </Card>

                  <Card className="p-6 space-y-4 bg-yellow-orange/5 border-yellow-orange/20">
                    <h3 className="font-heading text-xl">Focus Area</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{growth.focus.name}</span>
                      <span className="text-3xl font-bold text-yellow-orange">{growth.focus.score}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Focus on improving in this area for better results
                    </p>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Progress;