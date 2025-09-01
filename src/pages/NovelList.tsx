import { useState, useMemo } from "react";
import { Filter, Grid, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import NovelCard from "@/components/NovelCard";
import { mockNovels } from "@/data/mockNovels";

const NovelList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("views");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGenre, setFilterGenre] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get all unique genres
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    mockNovels.forEach(novel => novel.genres.forEach(genre => genres.add(genre)));
    return Array.from(genres).sort();
  }, []);

  // Filter and sort novels
  const filteredNovels = useMemo(() => {
    let filtered = mockNovels.filter(novel => {
      const matchesSearch = searchQuery === "" || 
        novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        novel.titleCn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        novel.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || novel.status === filterStatus;
      const matchesGenre = filterGenre === "all" || novel.genres.includes(filterGenre);
      
      return matchesSearch && matchesStatus && matchesGenre;
    });

    // Sort novels
    switch (sortBy) {
      case "views":
        return filtered.sort((a, b) => b.views - a.views);
      case "rating":
        return filtered.sort((a, b) => b.rating - a.rating);
      case "chapters":
        return filtered.sort((a, b) => b.chapters - a.chapters);
      case "readers":
        return filtered.sort((a, b) => b.readers - a.readers);
      case "date":
        return filtered.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
      case "name":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return filtered;
    }
  }, [mockNovels, searchQuery, sortBy, filterStatus, filterGenre]);

  const FilterControls = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Search</label>
        <Input
          placeholder="Search novels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Sort By</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="views">Views</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="chapters">Chapter Count</SelectItem>
            <SelectItem value="readers">Readers</SelectItem>
            <SelectItem value="date">Addition Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Status</label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Ongoing">Ongoing</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Hiatus">Hiatus</SelectItem>
            <SelectItem value="Dropped">Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Genre</label>
        <Select value={filterGenre} onValueChange={setFilterGenre}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {allGenres.map(genre => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          setSearchQuery("");
          setSortBy("views");
          setFilterStatus("all");
          setFilterGenre("all");
        }}
      >
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Novel Collection</h1>
          <p className="text-muted-foreground text-lg">
            Discover and explore our complete catalog of translated novels
          </p>
        </div>

        {/* Controls Bar */}
        <Card className="mb-8 bg-gradient-card border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="md:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filter Novels</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterControls />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Desktop Quick Filters */}
                <div className="hidden md:flex items-center gap-3 flex-1">
                  <Input
                    placeholder="Search novels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="views">Views</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                      <SelectItem value="chapters">Chapters</SelectItem>
                      <SelectItem value="readers">Readers</SelectItem>
                      <SelectItem value="date">Date Added</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* View Mode & Results Count */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {filteredNovels.length} novels
                </span>
                <div className="flex items-center border rounded-lg p-1">
                  <Button 
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-primary text-primary-foreground" : ""}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-primary text-primary-foreground" : ""}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || filterStatus !== "all" || filterGenre !== "all") && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                {searchQuery && (
                  <Badge variant="secondary">
                    Search: {searchQuery}
                  </Badge>
                )}
                {filterStatus !== "all" && (
                  <Badge variant="secondary">
                    Status: {filterStatus}
                  </Badge>
                )}
                {filterGenre !== "all" && (
                  <Badge variant="secondary">
                    Genre: {filterGenre}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <Card className="sticky top-24 bg-gradient-card border-0 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Filters</h3>
                </div>
                <FilterControls />
              </CardContent>
            </Card>
          </aside>

          {/* Novels Grid/List */}
          <main className="flex-1">
            {filteredNovels.length === 0 ? (
              <Card className="text-center p-12 bg-gradient-card border-0 shadow-card">
                <p className="text-lg text-muted-foreground mb-4">
                  No novels found matching your criteria
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                    setFilterGenre("all");
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {filteredNovels.map((novel) => (
                  <NovelCard 
                    key={novel.id} 
                    novel={novel} 
                    compact={viewMode === "list"}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default NovelList;