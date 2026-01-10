import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/appStore";

export function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAppStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-lg text-foreground">Plainly</span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </a>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Log in
              </Button>
              <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
