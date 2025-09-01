import { Link } from "react-router-dom";
import { Mail, Book, Zap, Globe, Users, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  const features = [
    {
      icon: Zap,
      title: "Lightning Fast Releases",
      description: "Our advanced MTL system delivers new chapters faster than traditional translation methods, ensuring you never have to wait long for the next part of your favorite story."
    },
    {
      icon: Globe,
      title: "Vast Library",
      description: "Access thousands of novels across multiple genres, from cultivation and fantasy to romance and sci-fi. Our constantly growing collection ensures there's always something new to discover."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join a thriving community of novel enthusiasts. Rate novels, leave reviews, and discover new favorites through our recommendation system."
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "While we use machine translation for speed, our quality control processes ensure readable and enjoyable content that maintains the essence of the original work."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-hero text-white overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <Book className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About NovelHub
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed opacity-90">
            Revolutionizing web novel translation with cutting-edge MTL technology, 
            bringing you unlimited stories at unprecedented speed.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Card className="max-w-4xl mx-auto bg-gradient-card border-0 shadow-elegant">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-primary mb-4">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-lg leading-relaxed">
              <p>
                <strong>NovelHub</strong> was created to address a critical gap in the web novel community: 
                the scarcity and slow release pace of manually translated novels. While human translation 
                offers unparalleled quality, it simply cannot keep up with the vast amount of amazing 
                content being produced.
              </p>
              <p>
                Our advanced Machine Translation (MTL) system bridges this gap by delivering readable, 
                engaging translations at lightning speed. We believe that every great story deserves 
                to reach its global audience, regardless of language barriers.
              </p>
              <p>
                We encourage readers to embrace MTL as a powerful alternative that opens doors to 
                thousands of untranslated novels. While the style may be different from human translation, 
                the stories, characters, and worlds remain just as captivating.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose NovelHub?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the advantages of our innovative approach to web novel translation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-smooth">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-primary rounded-xl">
                      <feature.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">By the Numbers</h2>
            <p className="text-xl text-muted-foreground">
              The impact of our translation platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center bg-gradient-card border-0 shadow-card">
              <CardContent className="pt-8 pb-6">
                <div className="text-4xl font-bold text-primary mb-2">12,450+</div>
                <div className="text-muted-foreground">Novels Translated</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-card border-0 shadow-card">
              <CardContent className="pt-8 pb-6">
                <div className="text-4xl font-bold text-primary mb-2">2.8M+</div>
                <div className="text-muted-foreground">Active Readers</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-card border-0 shadow-card">
              <CardContent className="pt-8 pb-6">
                <div className="text-4xl font-bold text-primary mb-2">150+</div>
                <div className="text-muted-foreground">Daily Chapters</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-card border-0 shadow-card">
              <CardContent className="pt-8 pb-6">
                <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-muted-foreground">Uptime</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <Card className="max-w-2xl mx-auto bg-gradient-card border-0 shadow-elegant">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-primary mb-4">Get In Touch</CardTitle>
              <p className="text-muted-foreground">
                Have questions, suggestions, or want to report an issue? We'd love to hear from you.
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="flex items-center justify-center gap-3 text-lg">
                <Mail className="h-5 w-5 text-primary" />
                <a 
                  href="mailto:admin@novelhub.com" 
                  className="text-primary hover:text-primary/80 transition-smooth font-medium"
                >
                  admin@novelhub.com
                </a>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button variant="default" size="lg" asChild className="bg-gradient-primary hover:shadow-glow transition-smooth">
                  <Link to="/novel-list">
                    <Book className="h-5 w-5 mr-2" />
                    Start Reading
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/profile/request-serie">
                    Request Novel
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/contact" className="hover:text-accent transition-smooth">Contact</Link>
            <Link to="/changelog" className="hover:text-accent transition-smooth">Changelog</Link>
            <Link to="/dmca" className="hover:text-accent transition-smooth">DMCA</Link>
            <Link to="/cookies" className="hover:text-accent transition-smooth">Cookie Policy</Link>
            <Link to="/privacy" className="hover:text-accent transition-smooth">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-accent transition-smooth">Terms of Use</Link>
            <Link to="/stats" className="hover:text-accent transition-smooth">Stats</Link>
          </div>
          <div className="text-center mt-4 text-sm opacity-75">
            <p>&copy; 2024 NovelHub. All rights reserved. | Version 1.10.2</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;