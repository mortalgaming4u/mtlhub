import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Trophy, Award, Zap } from "lucide-react";

interface XPProgressProps {
  userId: string;
}

interface UserStats {
  level: number;
  xp: number;
  tickets: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  requirement: number;
  current: number;
  unlocked: boolean;
  xp_reward: number;
}

export const XPProgress = ({ userId }: XPProgressProps) => {
  const [stats, setStats] = useState<UserStats>({ level: 1, xp: 0, tickets: 0 });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
    fetchAchievements();
  }, [userId]);

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("level, xp, tickets")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      if (data) setStats(data);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const fetchAchievements = async () => {
    try {
      // Fetch reading stats
      const { data: readingStats } = await supabase
        .from("user_progress")
        .select("id")
        .eq("user_id", userId);

      const { data: contributions } = await supabase
        .from("contributions")
        .select("id, status")
        .eq("user_id", userId);

      const { data: requests } = await supabase
        .from("requests")
        .select("id")
        .eq("user_id", userId);

      const chaptersRead = readingStats?.length || 0;
      const contributionsCount = contributions?.length || 0;
      const approvedContributions = contributions?.filter(c => c.status === 'approved').length || 0;
      const requestsCount = requests?.length || 0;

      const achievementList: Achievement[] = [
        {
          id: "first_steps",
          name: "First Steps",
          description: "Read your first chapter",
          icon: Star,
          requirement: 1,
          current: chaptersRead,
          unlocked: chaptersRead >= 1,
          xp_reward: 50,
        },
        {
          id: "avid_reader",
          name: "Avid Reader",
          description: "Read 50 chapters",
          icon: Trophy,
          requirement: 50,
          current: chaptersRead,
          unlocked: chaptersRead >= 50,
          xp_reward: 200,
        },
        {
          id: "bookworm",
          name: "Bookworm",
          description: "Read 200 chapters",
          icon: Crown,
          requirement: 200,
          current: chaptersRead,
          unlocked: chaptersRead >= 200,
          xp_reward: 500,
        },
        {
          id: "contributor",
          name: "Contributor",
          description: "Make 5 contributions",
          icon: Award,
          requirement: 5,
          current: contributionsCount,
          unlocked: contributionsCount >= 5,
          xp_reward: 100,
        },
        {
          id: "approved_contributor",
          name: "Approved Contributor",
          description: "Get 10 contributions approved",
          icon: Zap,
          requirement: 10,
          current: approvedContributions,
          unlocked: approvedContributions >= 10,
          xp_reward: 300,
        },
      ];

      setAchievements(achievementList);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateXPForNextLevel = (level: number) => {
    return Math.pow(level, 2) * 100;
  };

  const xpForCurrentLevel = stats.level > 1 ? calculateXPForNextLevel(stats.level - 1) : 0;
  const xpForNextLevel = calculateXPForNextLevel(stats.level);
  const currentLevelXP = stats.xp - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = (currentLevelXP / xpNeededForNext) * 100;

  if (loading) {
    return <div className="text-center py-8">Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
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
              <div className="text-3xl font-bold text-primary">Level {stats.level}</div>
              <div className="text-sm text-muted-foreground">{stats.xp} total XP</div>
            </div>
            <Badge className="bg-accent text-accent-foreground px-3 py-2 text-lg font-bold">
              {stats.tickets} Tickets
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {stats.level + 1}</span>
              <span>{currentLevelXP} / {xpNeededForNext} XP</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {xpNeededForNext - currentLevelXP} XP until next level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="bg-gradient-card border-0 shadow-card">
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-smooth ${
                  achievement.unlocked
                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
                    : "bg-muted/30 border-muted"
                }`}
              >
                <div
                  className={`p-3 rounded-full ${
                    achievement.unlocked
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <achievement.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{achievement.name}</h4>
                    {achievement.unlocked && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-400">
                        +{achievement.xp_reward} XP
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {achievement.description}
                  </p>
                  {!achievement.unlocked && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{achievement.current} / {achievement.requirement}</span>
                      </div>
                      <Progress
                        value={(achievement.current / achievement.requirement) * 100}
                        className="h-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};