import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Activity, Users, RotateCcw, Zap, Target } from 'lucide-react';
import { BackgroundGrid } from '~/components/ui/BackgroundGrid';
import { Button } from '~/components/ui/Button';
import { Chip } from '~/components/ui/Chip';

export const Route = createFileRoute("/landing/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen relative">
      {/* Animated Background Grid */}
      <BackgroundGrid />
      
      {/* Main Content */}
      <div className="relative z-10">
        <main className="container mx-auto px-6 py-24">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Activity className="w-8 h-8 text-accent-cyan" />
                <h1 className="text-hero font-display font-bold text-text-bright">
                  Agent in the Loop
                </h1>
              </div>
              
              <p className="text-h3 text-text-muted max-w-2xl mx-auto">
                Multi-Agent Orchestrator with Continuous Feedback Loops
              </p>
              
              <p className="text-body text-text-muted max-w-3xl mx-auto">
                Experience the future of AI orchestration with infinite loop monitoring, 
                real-time feedback systems, and continuous agent coordination. 
                Stop false positives, start continuous verification.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 my-12">
              <div className="glass rounded-xl p-6 text-center">
                <Activity className="w-8 h-8 text-accent-cyan mx-auto mb-3" />
                <h3 className="text-body font-medium text-text-bright mb-2">Infinite Loop Monitoring</h3>
                <p className="text-caption text-text-muted">Continuous, never-ending monitoring cycles</p>
              </div>
              
              <div className="glass rounded-xl p-6 text-center">
                <RotateCcw className="w-8 h-8 text-accent-pink mx-auto mb-3" />
                <h3 className="text-body font-medium text-text-bright mb-2">Feedback Loops</h3>
                <p className="text-caption text-text-muted">Real-time learning and adaptation</p>
              </div>
              
              <div className="glass rounded-xl p-6 text-center">
                <Users className="w-8 h-8 text-accent-violet mx-auto mb-3" />
                <h3 className="text-body font-medium text-text-bright mb-2">Multi-Agent Coordination</h3>
                <p className="text-caption text-text-muted">Seamless orchestration of AI agents</p>
              </div>
              
              <div className="glass rounded-xl p-6 text-center">
                <Target className="w-8 h-8 text-success-lime mx-auto mb-3" />
                <h3 className="text-body font-medium text-text-bright mb-2">Zero False Positives</h3>
                <p className="text-caption text-text-muted">Continuous verification and validation</p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <Chip variant="running" size="sm">
                System: Online
              </Chip>
              <Chip variant="pass" size="sm">
                Loops: Active
              </Chip>
              <Chip variant="running" size="sm">
                Agents: Ready
              </Chip>
            </div>

            {/* Call to Action */}
            <div className="space-y-6">
              <div className="relative">
                <Link to="/dashboard">
                  <Button size="lg" className="flex items-center gap-2 px-8 py-4 text-lg font-semibold relative group">
                    <span className="relative z-10">Enter Dashboard</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
                    {/* Subtle background glow effect */}
                    <div className="absolute inset-0 bg-orchestrate rounded-xl opacity-20 blur-xl scale-110 group-hover:opacity-30 transition-opacity duration-200"></div>
                  </Button>
                </Link>
              </div>
              
              <p className="text-caption text-text-muted">
                Explore infinite loop orchestration and real-time agent monitoring
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="max-w-2xl mx-auto mt-24 text-center">
            <div className="glass rounded-xl p-8">
              <h3 className="text-h3 font-medium text-text-bright mb-4">
                What makes our loops truly infinite?
              </h3>
              <div className="space-y-3 text-body-sm text-text-muted text-left">
                <p>• <strong>Continuous Monitoring:</strong> Never-ending cycles that adapt and learn</p>
                <p>• <strong>Real-time Feedback:</strong> Instant responses and corrections</p>
                <p>• <strong>Self-optimizing:</strong> Loops that improve their own performance</p>
                <p>• <strong>Fault-tolerant:</strong> Automatic recovery and resilience</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
