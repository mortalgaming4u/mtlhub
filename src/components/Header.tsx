import { Link, useLocation } from "react-router-dom";
import {
  Book,
  Search,
  Trophy,
  Shuffle,
  Star,
  User,
  Menu,
  Terminal, // ✅ Added icon for Console
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const location = useLocation();

  const navigation = [
    { name: "Home", href: "/", icon: Book },
    { name: "Novel List", href: "/novel-list", icon: Book },
    { name: "Search", href: "/search", icon: Search },
    { name: "Ranking", href: "/ranking/daily", icon: Trophy },
    { name: "Random", href: "/random", icon: Shuffle },
    { name: "Recommendations", href: "/recommendations", icon: Star },
    { name: "Console", href: "/console", icon: Terminal }, // ✅ Console link added
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const NavItems = () => (
    <>
      {navigation.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth hover:bg-muted ${
            isActive(item.href)
              ? "bg-gradient-primary text-primary-foreground shadow-elegant"
              : "text-foreground hover:text-primary"
          }`}
        >
          <item.icon className="h-4 w-4" />
          <span className="font-medium">{item.name}</span>
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-smooth"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-hero rounded-xl shadow-elegant">
              <Book className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                NovelHub
              </h1>
              <p className="text-xs text-muted-foreground">
                MTL Translation Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavItems />
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/profile">
                <User className="h-4 w-4" /> Profile
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="flex flex-col gap-4 pt-6">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-hero rounded-xl shadow-elegant">
                      <Book className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold bg-gradient-primary bg-clip-text text-transparent">
                        NovelHub
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        MTL Translation
                      </p>
                    </div>
                  </div>
                  <nav className="flex flex-col gap-2">
                    <NavItems />
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth hover:bg-muted text-foreground hover:text-primary"
                    >
                      <User className="h-4 w-4" />
                      <span className="font-medium">Profile</span>
                    </Link>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
