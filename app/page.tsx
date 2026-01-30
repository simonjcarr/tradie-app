import Header from '@/components/Header';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Hammer, ClipboardList, Users, DollarSign, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block mb-6">
                <div className="bg-secondary/20 backdrop-blur-sm border-2 border-secondary rounded-2xl px-6 py-2">
                  <span className="text-accent font-bold text-sm uppercase tracking-wider">Built by Tradies, For Tradies</span>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 tracking-tight">
                RUN YOUR BUSINESS
                <br />
                <span className="text-secondary">LIKE A BOSS</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
                No BS, just the tools you need. Jobs, quotes, invoices, payments—sorted.
                Because you've got better things to do than wrestle with paperwork.
              </p>

              <SignedOut>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" variant="secondary" className="text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                    Let's Go - It's Free
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-2 border-white/30">
                    Show Me How
                  </Button>
                </div>
              </SignedOut>

              <SignedIn>
                <Card className="bg-white/10 backdrop-blur-sm border-2 border-accent max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary-foreground">Alright Boss!</CardTitle>
                    <CardDescription className="text-primary-foreground/80">Time to crack on, yeah?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="lg" variant="secondary" className="w-full text-lg shadow-xl hover:shadow-2xl">
                      Let's Get Stuck In
                    </Button>
                  </CardContent>
                </Card>
              </SignedIn>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display font-bold text-foreground mb-4">
                ALL THE GEAR, NO IDEA? NAH MATE
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need, nothing you don't. Simple as.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Feature Cards */}
              <Card className="border-2 hover:border-secondary transition-all hover:shadow-lg group">
                <CardHeader>
                  <div className="bg-secondary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                    <ClipboardList className="h-7 w-7 text-secondary" />
                  </div>
                  <CardTitle className="font-display">JOB TRACKING</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Keep your jobs sorted. Track what's done, what's coming, and what materials you need. No more "where did I put that job sheet?" moments.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-secondary transition-all hover:shadow-lg group">
                <CardHeader>
                  <div className="bg-secondary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                    <Users className="h-7 w-7 text-secondary" />
                  </div>
                  <CardTitle className="font-display">CLIENT MANAGEMENT</CardTitle>
                  <CardDescription className="leading-relaxed">
                    All your clients in one spot. Who owes you, who paid up, who's a pain in the arse—everything you need to know.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-secondary transition-all hover:shadow-lg group">
                <CardHeader>
                  <div className="bg-secondary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                    <DollarSign className="h-7 w-7 text-secondary" />
                  </div>
                  <CardTitle className="font-display">GET PAID FASTER</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Bang out invoices in seconds, not hours. Track who's paid and who's "forgot their wallet." Get your coin, on time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-secondary transition-all hover:shadow-lg group">
                <CardHeader>
                  <div className="bg-secondary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                    <Hammer className="h-7 w-7 text-secondary" />
                  </div>
                  <CardTitle className="font-display">QUOTE BUILDER</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Whip up quotes faster than you can say "she'll be right." Look professional, win the job, crack on.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-secondary transition-all hover:shadow-lg group">
                <CardHeader>
                  <div className="bg-secondary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                    <Zap className="h-7 w-7 text-secondary" />
                  </div>
                  <CardTitle className="font-display">MOBILE READY</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Works on your phone, on-site, in the van, wherever. Update jobs while you're grabbing a bacon sarnie from Greggs.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-secondary transition-all hover:shadow-lg group">
                <CardHeader>
                  <div className="bg-secondary/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                    <Shield className="h-7 w-7 text-secondary" />
                  </div>
                  <CardTitle className="font-display">SECURE & RELIABLE</CardTitle>
                  <CardDescription className="leading-relaxed">
                    Your data's locked down tighter than your toolbox. Backed up, encrypted, safe as houses. You focus on the work, we'll handle the rest.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Color Palette Showcase */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                TOUGH AS NAILS
              </h2>
              <p className="text-muted-foreground">Hi-vis colors that mean business</p>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="border-2">
                <CardContent className="p-0">
                  <div className="bg-primary h-24 rounded-t-xl"></div>
                  <div className="p-4 text-center">
                    <p className="font-bold text-sm">Deep Charcoal</p>
                    <p className="text-xs text-muted-foreground">Primary</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-0">
                  <div className="bg-secondary h-24 rounded-t-xl"></div>
                  <div className="p-4 text-center">
                    <p className="font-bold text-sm">Safety Orange</p>
                    <p className="text-xs text-muted-foreground">Secondary</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-0">
                  <div className="bg-accent h-24 rounded-t-xl"></div>
                  <div className="p-4 text-center">
                    <p className="font-bold text-sm">Safety Yellow</p>
                    <p className="text-xs text-muted-foreground">Accent</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-0">
                  <div className="bg-muted h-24 rounded-t-xl"></div>
                  <div className="p-4 text-center">
                    <p className="font-bold text-sm">Concrete Gray</p>
                    <p className="text-xs text-muted-foreground">Muted</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground border-t-4 border-secondary py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-80">&copy; 2026 Tradie App. Built by tradies, for tradies. No suits involved.</p>
        </div>
      </footer>
    </div>
  );
}
