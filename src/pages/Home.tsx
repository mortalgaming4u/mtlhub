import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Clock, Star, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import NovelCard from "@/components/NovelCard";
import { getMostViewedNovels, getRecentNovels, getTopRatedNovels } from "@/data/mockNovels";

const Home = () => {
  console.log("Home component rendering...");
  
  const mostViewed = getMostViewedNovels(4);
  const recentNovels = getRecentNovels(4);
  const topRated = getTopRatedNovels(4);

  console.log("Home data loaded:", { mostViewed: mostViewed?.length, recentNovels: recentNovels?.length, topRated: topRated?.length });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="relative container mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Discover Amazing
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Web Novels
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              Experience thousands of translated novels with our advanced MTL system. 
              Faster releases, better quality, infinite stories.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-3 p-2 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                  <Input 
                    placeholder="Search novels, authors, genres..." 
                    className="pl-12 bg-transparent border-0 text-white placeholder:text-white/60 text-lg h-12 focus-visible:ring-0"
                  />
                </div>
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 h-12">
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button variant="outline" size="lg" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                <Link to="/novel-list">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse All Novels
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                <Link to="/ranking/daily">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  View Rankings
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                <Link to="/random">
                  <Star className="h-5 w-5 mr-2" />
                  Random Novel
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="text-center bg-gradient-card border-0 shadow-card">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">12,450+</div>
                <div className="text-sm text-muted-foreground">Total Novels</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-card border-0 shadow-card">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">2.8M+</div>
                <div className="text-sm text-muted-foreground">Active Readers</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-card border-0 shadow-card">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">150+</div>
                <div className="text-sm text-muted-foreground">Daily Updates</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-card border-0 shadow-card">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">MTL Service</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Most Viewed Novels */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Trending Now</h2>
            </div>
            <Button variant="ghost" asChild className="text-primary hover:text-primary/80">
              <Link to="/ranking/daily" className="flex items-center gap-2">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mostViewed.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Additions */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Recently Added</h2>
            </div>
            <Button variant="ghost" asChild className="text-primary hover:text-primary/80">
              <Link to="/novel-list?sort=date" className="flex items-center gap-2">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentNovels.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Highest Rated</h2>
            </div>
            <Button variant="ghost" asChild className="text-primary hover:text-primary/80">
              <Link to="/novel-list?sort=rating" className="flex items-center gap-2">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topRated.map((novel) => (
              <NovelCard key={novel.id} novel={novel} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Start Your Reading Journey Today
            </h2>
            <p className="text-xl text-white/90">
              Join millions of readers discovering new worlds through our advanced translation technology.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold px-8" asChild>
                <Link to="/novel-list">
                  Browse Novels
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm" asChild>
                <Link to="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;