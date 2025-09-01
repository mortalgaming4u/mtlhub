import { Link } from "react-router-dom";
import { Star, Eye, Users, BookOpen, Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface Novel {
  id: string;
  title: string;
  titleCn?: string;
  status: "Ongoing" | "Completed" | "Hiatus" | "Dropped";
  views: number;
  readers: number;
  chapters: number;
  rating: number;
  reviews: number;
  genres: string[];
  synopsis: string;
  cover?: string;
  addedDate: string;
  author: string;
}

interface NovelCardProps {
  novel: Novel;
  compact?: boolean;
}

const NovelCard = ({ novel, compact = false }: NovelCardProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statusColors = {
    Ongoing: "bg-emerald-100 text-emerald-800",
    Completed: "bg-blue-100 text-blue-800", 
    Hiatus: "bg-amber-100 text-amber-800",
    Dropped: "bg-gray-100 text-gray-800",
  };

  return (
    <Card className="group hover:shadow-elegant transition-smooth bg-gradient-card border-0 overflow-hidden">
      <CardContent className="p-0">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-subtle overflow-hidden">
          {novel.cover ? (
            <img 
              src={novel.cover} 
              alt={novel.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
              <BookOpen className="h-12 w-12 text-primary-foreground opacity-60" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge className={`${statusColors[novel.status]} text-xs font-medium`}>
              {novel.status}
            </Badge>
          </div>
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-black/20 text-white border-0 backdrop-blur-sm">
              ★ {novel.rating.toFixed(1)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <Link 
              to={`/novel/${novel.id}`}
              className="block hover:text-primary transition-smooth"
            >
              <h3 className="font-bold text-lg line-clamp-2 leading-tight">
                {novel.title}
              </h3>
              {novel.titleCn && (
                <p className="text-sm text-muted-foreground mt-1">
                  {novel.titleCn}
                </p>
              )}
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{formatNumber(novel.views)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{formatNumber(novel.readers)}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{novel.chapters}</span>
            </div>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-1">
            {novel.genres.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="secondary" className="text-xs px-2 py-0.5">
                {genre}
              </Badge>
            ))}
            {novel.genres.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                +{novel.genres.length - 3}
              </Badge>
            )}
          </div>

          {/* Synopsis */}
          {!compact && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {novel.synopsis}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="default" size="sm" asChild className="flex-1 bg-gradient-primary hover:shadow-glow transition-smooth">
          <Link to={`/novel/${novel.id}`}>
            <BookOpen className="h-4 w-4 mr-2" />
            Read Now
          </Link>
        </Button>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Heart className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NovelCard;