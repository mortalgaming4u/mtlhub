import { useState, useMemo } from "react";
import { Search as SearchIcon, Filter, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import NovelCard from "@/components/NovelCard";
import { mockNovels } from "@/data/mockNovels";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("views");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [excludedGenres, setExcludedGenres] = useState<string[]>([]);
  const [minRating, setMinRating] = useState("");
  const [minChapters, setMinChapters] = useState("");
  const [minReviews, setMinReviews] = useState("");

  // Get all unique genres
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    mockNovels.forEach(novel => novel.genres.forEach(genre => genres.add(genre)));
    return Array.from(genres).sort();
  }, []);

  const statusOptions = ["Ongoing", "Completed", "Hiatus", "Dropped"];

  // Filter novels based on all criteria
  const filteredNovels = useMemo(() => {
    let filtered = mockNovels.filter(novel => {
      // Text search
      const matchesSearch = searchQuery === "" || 
        novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        novel.titleCn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        novel.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(novel.status);
      
      // Genre filters
      const hasRequiredGenres = selectedGenres.length === 0 || 
        selectedGenres.some(genre => novel.genres.includes(genre));
      const hasExcludedGenres = excludedGenres.some(genre => novel.genres.includes(genre));
      
      // Rating filter
      const matchesRating = minRating === "" || novel.rating >= parseFloat(minRating);
      
      // Chapters filter
      const matchesChapters = minChapters === "" || novel.chapters >= parseInt(minChapters);
      
      // Reviews filter
      const matchesReviews = minReviews === "" || novel.reviews >= parseInt(minReviews);
      
      return matchesSearch && matchesStatus && hasRequiredGenres && 
             !hasExcludedGenres && matchesRating && matchesChapters && matchesReviews;
    });

    // Sort novels
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "views":
          comparison = b.views - a.views;
          break;
        case "rating":
          comparison = b.rating - a.rating;
          break;
        case "chapters":
          comparison = b.chapters - a.chapters;
          break;
        case "readers":
          comparison = b.readers - a.readers;
          break;
        case "date":
          comparison = new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
          break;
        case "name":
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });

    return filtered;
  }, [searchQuery, sortBy, sortOrder, filterStatus, selectedGenres, excludedGenres, minRating, minChapters, minReviews]);

  const handleGenreToggle = (genre: string, type: "include" | "exclude") => {
    if (type === "include") {
      setSelectedGenres(prev => 
        prev.includes(genre) 
          ? prev.filter(g => g !== genre)
          : [...prev, genre]
      );
      setExcludedGenres(prev => prev.filter(g => g !== genre));
    } else {
      setExcludedGenres(prev => 
        prev.includes(genre) 
          ? prev.filter(g => g !== genre)
          : [...prev, genre]
      );
      setSelectedGenres(prev => prev.filter(g => g !== genre));
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSortBy("views");
    setSortOrder("desc");
    setFilterStatus([]);
    setSelectedGenres([]);
    setExcludedGenres([]);
    setMinRating("");
    setMinChapters("");
    setMinReviews("");
  };

  const hasActiveFilters = searchQuery || filterStatus.length > 0 || selectedGenres.length > 0 || 
                          excludedGenres.length > 0 || minRating || minChapters || minReviews;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <SearchIcon className="h-10 w-10 text-primary" />
            Advanced Novel Search
          </h1>
          <p className="text-muted-foreground text-lg">
            Find your perfect novel with our comprehensive filtering system
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <Card className="sticky top-24 bg-gradient-card border-0 shadow-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    Search Filters
                  </CardTitle>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Input */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Novel Search</Label>
                  <Input
                    placeholder="Title, author, or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Sort Options */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Sort & Order</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
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
                    <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Status</Label>
                  <div className="space-y-2">
                    {statusOptions.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={status}
                          checked={filterStatus.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterStatus(prev => [...prev, status]);
                            } else {
                              setFilterStatus(prev => prev.filter(s => s !== status));
                            }
                          }}
                        />
                        <Label htmlFor={status} className="text-sm">{status}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Numeric Filters */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Minimum Requirements</Label>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="minRating" className="text-xs text-muted-foreground">Rating</Label>
                      <Input
                        id="minRating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        placeholder="e.g., 4.0"
                        value={minRating}
                        onChange={(e) => setMinRating(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minChapters" className="text-xs text-muted-foreground">Chapters</Label>
                      <Input
                        id="minChapters"
                        type="number"
                        min="0"
                        placeholder="e.g., 100"
                        value={minChapters}
                        onChange={(e) => setMinChapters(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minReviews" className="text-xs text-muted-foreground">Reviews</Label>
                      <Input
                        id="minReviews"
                        type="number"
                        min="0"
                        placeholder="e.g., 50"
                        value={minReviews}
                        onChange={(e) => setMinReviews(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Genre Filters */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Genres</Label>
                  
                  {/* Include Genres */}
                  <div className="mb-4">
                    <Label className="text-xs text-emerald-600 mb-2 block">Include (at least one)</Label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {selectedGenres.map(genre => (
                        <Badge key={genre} variant="default" className="bg-emerald-100 text-emerald-800">
                          {genre}
                          <button 
                            onClick={() => handleGenreToggle(genre, "include")}
                            className="ml-1 hover:bg-emerald-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Select onValueChange={(value) => handleGenreToggle(value, "include")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add genre to include" />
                      </SelectTrigger>
                      <SelectContent>
                        {allGenres.filter(g => !selectedGenres.includes(g) && !excludedGenres.includes(g)).map(genre => (
                          <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Exclude Genres */}
                  <div>
                    <Label className="text-xs text-red-600 mb-2 block">Exclude</Label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {excludedGenres.map(genre => (
                        <Badge key={genre} variant="destructive">
                          {genre}
                          <button 
                            onClick={() => handleGenreToggle(genre, "exclude")}
                            className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Select onValueChange={(value) => handleGenreToggle(value, "exclude")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add genre to exclude" />
                      </SelectTrigger>
                      <SelectContent>
                        {allGenres.filter(g => !selectedGenres.includes(g) && !excludedGenres.includes(g)).map(genre => (
                          <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  Search Results ({filteredNovels.length})
                </h2>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
              
              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary">Search: "{searchQuery}"</Badge>
                  )}
                  {filterStatus.map(status => (
                    <Badge key={status} variant="secondary">Status: {status}</Badge>
                  ))}
                  {selectedGenres.map(genre => (
                    <Badge key={genre} className="bg-emerald-100 text-emerald-800">Include: {genre}</Badge>
                  ))}
                  {excludedGenres.map(genre => (
                    <Badge key={genre} variant="destructive">Exclude: {genre}</Badge>
                  ))}
                  {minRating && <Badge variant="secondary">Rating: {minRating}+</Badge>}
                  {minChapters && <Badge variant="secondary">Chapters: {minChapters}+</Badge>}
                  {minReviews && <Badge variant="secondary">Reviews: {minReviews}+</Badge>}
                </div>
              )}
            </div>

            {/* Results Grid */}
            {filteredNovels.length === 0 ? (
              <Card className="text-center p-12 bg-gradient-card border-0 shadow-card">
                <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No novels found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or clearing some filters.
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNovels.map((novel) => (
                  <NovelCard key={novel.id} novel={novel} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Search;