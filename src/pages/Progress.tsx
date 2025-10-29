import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, Award, Calendar } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Progress = () => {
  const sessions = [
    { date: "2024-01-15", role: "Software Development", level: "Expert", score: 85 },
    { date: "2024-01-12", role: "UX Design", level: "Intermediate", score: 78 },
    { date: "2024-01-10", role: "Software Development", level: "Expert", score: 82 },
    { date: "2024-01-08", role: "Digital Marketing", level: "Beginner", score: 71 },
    { date: "2024-01-05", role: "UX Design", level: "Intermediate", score: 75 },
  ];

  const stats = [
    { label: "Total Sessions", value: "24", icon: Calendar, color: "text-primary" },
    { label: "Average Score", value: "82%", icon: TrendingUp, color: "text-secondary" },
    { label: "Best Performance", value: "95%", icon: Award, color: "text-accent" },
  ];

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

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {stats.map((stat) => (
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
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-muted/30 rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
                    <div 
                      className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${session.score}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground">{session.date.split('-')[2]}</span>
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
                {sessions.map((session, index) => (
                  <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                    <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{session.role}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.level === 'Expert' ? 'bg-primary/10 text-primary' :
                        session.level === 'Intermediate' ? 'bg-secondary/10 text-secondary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {session.level}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{session.score}%</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.score >= 80 ? 'bg-accent/10 text-accent' :
                        session.score >= 70 ? 'bg-yellow-orange/10 text-yellow-orange' :
                        'bg-light-coral/10 text-light-coral'
                      }`}>
                        {session.score >= 80 ? 'Excellent' : session.score >= 70 ? 'Good' : 'Needs Work'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Growth Insights */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4 bg-accent/5 border-accent/20">
              <h3 className="font-heading text-xl">Strongest Area</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">Grammar & Clarity</span>
                <span className="text-3xl font-bold text-accent">92%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You consistently score high in communication clarity
              </p>
            </Card>

            <Card className="p-6 space-y-4 bg-yellow-orange/5 border-yellow-orange/20">
              <h3 className="font-heading text-xl">Focus Area</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">Content Depth</span>
                <span className="text-3xl font-bold text-yellow-orange">76%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Work on providing more detailed examples in your responses
              </p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Progress;
