import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Trophy, TrendingUp, Clock, Star, Medal, Award, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NovelCard from "@/components/NovelCard";
import { mockNovels } from "@/data/mockNovels";

const Ranking = () => {
  const { type = "daily" } = useParams();
  const [selectedType, setSelectedType] = useState(type);

  // Simulate different ranking periods with slight variations
  const getRankedNovels = (period: string) => {
    let novels = [...mockNovels];
    
    switch (period) {
      case "daily":
        // Sort by views with some randomization for daily
        return novels.sort((a, b) => b.views - a.views);
      case "weekly":
        // Sort by combination of views and readers
        return novels.sort((a, b) => (b.views * 0.7 + b.readers * 0.3) - (a.views * 0.7 + a.readers * 0.3));
      case "monthly":
        // Sort by rating weighted with views
        return novels.sort((a, b) => (b.rating * b.views) - (a.rating * a.views));
      case "all-time":
        // Sort by total engagement (views + readers + reviews)
        return novels.sort((a, b) => (b.views + b.readers + b.reviews) - (a.views + a.readers + a.reviews));
      default:
        return novels;
    }
  };

  const rankedNovels = useMemo(() => getRankedNovels(selectedType), [selectedType]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-2xl font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
    if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
    if (rank <= 10) return "bg-gradient-primary text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  const periodInfo = {
    daily: {
      title: "Daily Rankings",
      description: "Most popular novels in the last 24 hours",
      icon: Clock,
      color: "text-blue-500"
    },
    weekly: {
      title: "Weekly Rankings", 
      description: "Top performers over the past week",
      icon: TrendingUp,
      color: "text-green-500"
    },
    monthly: {
      title: "Monthly Rankings",
      description: "Best novels of the month",
      icon: Star,
      color: "text-purple-500"
    },
    "all-time": {
      title: "All-Time Rankings",
      description: "The ultimate hall of fame",
      icon: Trophy,
      color: "text-yellow-500"
    }
  };

  const currentInfo = periodInfo[selectedType as keyof typeof periodInfo] || periodInfo.daily;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <currentInfo.icon className={`h-12 w-12 ${currentInfo.color}`} />
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {currentInfo.title}
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {currentInfo.description}
          </p>
        </div>

        {/* Period Selector */}
        <Card className="mb-8 bg-gradient-card border-0 shadow-card">
          <CardContent className="p-6">
            <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                <TabsTrigger 
                  value="daily" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
                >
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Daily</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="weekly"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Weekly</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="monthly"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
                >
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">Monthly</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="all-time"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground"
                >
                  <Trophy className="h-4 w-4" />
                  <span className="hidden sm:inline">All-Time</span>
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                {/* Top 3 Podium */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {rankedNovels.slice(0, 3).map((novel, index) => {
                    const rank = index + 1;
                    return (
                      <Card 
                        key={novel.id} 
                        className={`relative overflow-hidden bg-gradient-card border-0 shadow-elegant ${
                          rank === 1 ? 'md:order-2 transform md:scale-110' : 
                          rank === 2 ? 'md:order-1' : 'md:order-3'
                        }`}
                      >
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className={`${getRankBadgeColor(rank)} font-bold px-3 py-1`}>
                            #{rank}
                          </Badge>
                        </div>
                        <div className="absolute top-4 left-4 z-10">
                          {getRankIcon(rank)}
                        </div>
                        <CardContent className="p-0">
                          <NovelCard novel={novel} />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Rankings 4+ */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                    <Target className="h-6 w-6 text-primary" />
                    Complete Rankings
                  </h2>
                  
                  {rankedNovels.slice(3).map((novel, index) => {
                    const rank = index + 4;
                    return (
                      <Card key={novel.id} className="bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-smooth">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-6">
                            {/* Rank */}
                            <div className="flex-shrink-0 w-16 text-center">
                              <Badge className={`${getRankBadgeColor(rank)} font-bold text-lg px-3 py-2`}>
                                #{rank}
                              </Badge>
                            </div>

                            {/* Novel Info */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                              <div>
                                <Link 
                                  to={`/novel/${novel.id}`}
                                  className="block hover:text-primary transition-smooth"
                                >
                                  <h3 className="font-bold text-lg leading-tight line-clamp-2">
                                    {novel.title}
                                  </h3>
                                  {novel.titleCn && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {novel.titleCn}
                                    </p>
                                  )}
                                </Link>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {novel.genres.slice(0, 2).map((genre) => (
                                    <Badge key={genre} variant="secondary" className="text-xs">
                                      {genre}
                                    </Badge>
                                  ))}
                                  <Badge className={`text-xs ${
                                    novel.status === 'Ongoing' ? 'bg-emerald-100 text-emerald-800' :
                                    novel.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {novel.status}
                                  </Badge>
                                </div>
                              </div>

                              <div className="text-center">
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <div className="font-semibold text-primary">
                                      {(novel.views / 1000).toFixed(0)}K
                                    </div>
                                    <div className="text-xs text-muted-foreground">Views</div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-primary">
                                      ★{novel.rating.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Rating</div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-primary">
                                      {novel.chapters}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Chapters</div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <Button variant="default" size="sm" asChild className="bg-gradient-primary hover:shadow-glow transition-smooth">
                                  <Link to={`/novel/${novel.id}`}>
                                    Read Now
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Ranking;