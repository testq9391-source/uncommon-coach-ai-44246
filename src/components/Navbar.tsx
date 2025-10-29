import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-semibold text-lg">U</span>
            </div>
            <span className="font-heading text-xl font-semibold">Uncommon Coach AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link to="/progress" className="text-sm font-medium hover:text-primary transition-colors">
              Progress
            </Link>
            <Link to="/auth" className="text-sm font-medium hover:text-primary transition-colors">
              Login
            </Link>
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
            <Link to="/auth" className="block text-sm font-medium hover:text-primary transition-colors">
              Login
            </Link>
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
