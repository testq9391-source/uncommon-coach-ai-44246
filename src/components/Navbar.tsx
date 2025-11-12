import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import sizaLogo from "@/assets/siza-logo.jpg";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userAlias, setUserAlias] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserAlias(null);
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={sizaLogo} alt="SIZA Logo" className="h-10" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link to="/progress" className="text-sm font-medium hover:text-primary transition-colors">
              Progress
            </Link>
            {userAlias ? (
              <>
                <span className="text-sm font-medium text-muted-foreground">
                  Hi, {userAlias}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth" className="text-sm font-medium hover:text-primary transition-colors">
                Login
              </Link>
            )}
            <Button asChild>
              <Link to="/interview-setup">Start Practicing</Link>
            </Button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link to="/dashboard" className="block text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link to="/progress" className="block text-sm font-medium hover:text-primary transition-colors">
              Progress
            </Link>
            {userAlias ? (
              <>
                <span className="block text-sm font-medium text-muted-foreground">
                  Hi, {userAlias}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth" className="block text-sm font-medium hover:text-primary transition-colors">
                Login
              </Link>
            )}
            <Button asChild className="w-full">
              <Link to="/interview-setup">Start Practicing</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
