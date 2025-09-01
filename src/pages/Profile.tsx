import { Link, Navigate } from "react-router-dom";
import { User, Star, BookOpen, Award, FileText, LogOut, Settings, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LibraryManager } from "@/components/LibraryManager";

interface UserProfile {
  username: string | null;
  display_name: string | null;
  email: string;
  level: number;
  xp: number;
  tickets: number;
  weekly_requests_used: number;
  created_at: string;
}

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      
      setProfile({
        ...data,
        email: user!.email || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading || profileLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return <div className="text-center py-8">Error loading profile</div>;
  }

  const calculateXPForNextLevel = (level: number) => {
    return Math.pow(level, 2) * 100;
  };

  const xpForCurrentLevel = profile.level > 1 ? calculateXPForNextLevel(profile.level - 1) : 0;
  const xpForNextLevel = calculateXPForNextLevel(profile.level);
  const currentLevelXP = profile.xp - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = (currentLevelXP / xpNeededForNext) * 100;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <User className="h-10 w-10 text-primary" />
            Profile Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your account and track your reading journey
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-24 bg-gradient-card border-0 shadow-card">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{profile.display_name || profile.username || "User"}</h3>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <nav className="space-y-2">
                  <Button variant="default" size="sm" asChild className="w-full justify-start bg-gradient-primary">
                    <Link to="/profile">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                    <Link to="/profile/perks">
                      <Crown className="h-4 w-4 mr-2" />
                      Perks & Levels
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                    <Link to="/profile/request-serie">
                      <FileText className="h-4 w-4 mr-2" />
                      My Novel Requests
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                    <Link to="/profile/reports">
                      <Settings className="h-4 w-4 mr-2" />
                      My Reports
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                    <Link to="/profile/contributions">
                      <Award className="h-4 w-4 mr-2" />
                      Contributions
                    </Link>
                  </Button>
                </nav>
                
                <Separator />
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-2 space-y-8">
            {/* Level & XP Card */}
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-accent" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-primary">Level {profile.level}</div>
                    <div className="text-sm text-muted-foreground">
                      Member since {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge className="bg-accent text-accent-foreground px-3 py-2 text-lg font-bold">
                    {profile.tickets} Tickets
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress to Level {profile.level + 1}</span>
                    <span>{currentLevelXP} / {xpNeededForNext} XP</span>
                  </div>
                  <Progress value={xpProgress} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {xpNeededForNext - currentLevelXP} XP until level {profile.level + 1}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Quota */}
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle>Weekly Request Quota</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {profile.weekly_requests_used} / 3 Used
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Resets every Sunday. Additional requests cost tickets.
                    </p>
                  </div>
                  <Button asChild>
                    <Link to="/profile/request-serie">
                      Request Novel
                    </Link>
                  </Button>
                </div>
                <Progress 
                  value={(profile.weekly_requests_used / 3) * 100} 
                  className="h-2" 
                />
              </CardContent>
            </Card>

            {/* Library Management */}
            <LibraryManager userId={user.id} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;