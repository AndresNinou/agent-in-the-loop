import { createFileRoute } from "@tanstack/react-router";
import { useState } from 'react';
import { Eye, Activity } from 'lucide-react';
import { BackgroundGrid } from '~/components/ui/BackgroundGrid';
import { Hero } from '~/components/sections/Hero';
import { StatsHeader } from '~/components/sections/StatsHeader';
import { SuccessCriteria } from '~/components/sections/SuccessCriteria';
import { ParallelLanes } from '~/components/sections/ParallelLanes';
import { SwarmControls } from '~/components/sections/SwarmControls';
import { EvidenceDrawer } from '~/components/sections/EvidenceDrawer';
import { LoopMonitor } from '~/components/sections/LoopMonitor';
import { Button } from '~/components/ui/Button';
import { Chip } from '~/components/ui/Chip';

export const Route = createFileRoute("/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [selectedLaneId, setSelectedLaneId] = useState<string>();
  const [activeView, setActiveView] = useState<'overview' | 'loops' | 'lanes'>('overview');

  const openEvidenceDrawer = (laneId?: string) => {
    setSelectedLaneId(laneId);
    setIsEvidenceDrawerOpen(true);
  };

  const closeEvidenceDrawer = () => {
    setIsEvidenceDrawerOpen(false);
    setSelectedLaneId(undefined);
  };

  return (
    <div className="min-h-screen relative">
      {/* Animated Background Grid */}
      <BackgroundGrid />
      
      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-hairline bg-control-bg/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-h3 font-display font-bold text-text-bright">
                  Agent in the Loop Dashboard
                </h1>
                <p className="text-caption text-text-muted">Infinite Loop Orchestration with Continuous Feedback</p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* View Switcher */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={activeView === 'overview' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('overview')}
                  >
                    Overview
                  </Button>
                  <Button
                    variant={activeView === 'loops' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('loops')}
                  >
                    <Activity className="w-3 h-3" />
                    Infinite Loops
                  </Button>
                  <Button
                    variant={activeView === 'lanes' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('lanes')}
                  >
                    Parallel Lanes
                  </Button>
                </div>
                
                <div className="h-4 w-px bg-hairline" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEvidenceDrawer()}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Evidence Panel
                </Button>
              </div>
            </div>
            
            {/* Loop Status Indicator */}
            <div className="flex items-center gap-2 mt-2">
              <Chip variant="running" size="sm">
                Infinite Loops: Active
              </Chip>
              <Chip variant="pass" size="sm">
                Orchestration: Continuous
              </Chip>
              <Chip variant="running" size="sm">
                Feedback: Never-ending
              </Chip>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="container mx-auto px-6 py-12 space-y-24">
          {/* Always show stats header */}
          <section>
            <StatsHeader />
          </section>

          {/* Conditional Content Based on Active View */}
          {activeView === 'overview' && (
            <>
              {/* Hero Section */}
              <section>
                <Hero />
              </section>

              {/* Success Criteria */}
              <section>
                <SuccessCriteria />
              </section>

              {/* Swarm Controls */}
              <section>
                <SwarmControls />
              </section>

              {/* Loop Overview */}
              <section className="text-center py-16">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="w-20 h-20 bg-accent-cyan/10 rounded-3xl flex items-center justify-center mx-auto">
                    <Activity className="w-10 h-10 text-accent-cyan" />
                  </div>
                  <h3 className="text-h2 font-display font-semibold text-text-bright">
                    Infinite Loop Orchestration
                  </h3>
                  <p className="text-body text-text-muted">
                    Experience truly infinite feedback loops, never-ending monitoring cycles, and continuous orchestration.
                    These loops run perpetually, adapting and learning without interruption.
                    Switch to <strong>Infinite Loops</strong> to see detailed metrics and controls.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <Button 
                      variant="primary" 
                      onClick={() => setActiveView('loops')}
                      className="flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      View Infinite Loops
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setActiveView('lanes')}
                    >
                      View Parallel Lanes
                    </Button>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeView === 'loops' && (
            <>
              {/* Loop Monitor - The centerpiece of infinite loop visualization */}
              <section>
                <LoopMonitor />
              </section>
              
              {/* Quick Access to Other Views */}
              <section className="text-center py-8">
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setActiveView('lanes')}
                  >
                    View Parallel Lanes
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setActiveView('overview')}
                  >
                    Back to Overview
                  </Button>
                </div>
              </section>
            </>
          )}

          {activeView === 'lanes' && (
            <>
              {/* Parallel Lanes with Enhanced Loop Features */}
              <section>
                <ParallelLanes onLaneClick={openEvidenceDrawer} />
              </section>
              
              {/* Loop Context Information */}
              <section className="text-center py-8">
                <div className="max-w-xl mx-auto space-y-4">
                  <h3 className="text-h3 font-medium text-text-bright">
                    Infinite Lane Loop Integration
                  </h3>
                  <p className="text-body-sm text-text-muted">
                    Each lane runs in its own infinite monitoring loop with perpetual feedback, 
                    continuous orchestration coordination, and never-ending quality gates.
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveView('loops')}
                    >
                      View Loop Details
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveView('overview')}
                    >
                      Back to Overview
                    </Button>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-hairline bg-control-bg/50 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center text-caption text-text-muted">
              <p>
                Built with infinite feedback loops, perpetual orchestration, and continuous monitoring.
                <br />
                Experience true loop-based agent collaboration — infinite cycles, zero downtime, continuous verification.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        isOpen={isEvidenceDrawerOpen}
        onClose={closeEvidenceDrawer}
        laneId={selectedLaneId}
      />
    </div>
  );
}
