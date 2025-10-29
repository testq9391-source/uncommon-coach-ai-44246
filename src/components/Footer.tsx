import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border mt-auto">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-heading font-semibold text-lg">U</span>
              </div>
              <span className="font-heading text-lg font-semibold">Uncommon</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering young people to succeed in tech through AI-powered interview practice.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/interview-setup" className="text-muted-foreground hover:text-primary transition-colors">Practice</Link></li>
              <li><Link to="/progress" className="text-muted-foreground hover:text-primary transition-colors">Progress</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 Uncommon. Making tech accessible for everyone.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
