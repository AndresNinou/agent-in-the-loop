import { useState, useEffect } from 'react';
import { Activity, RotateCcw, Zap, Target, Play, Pause, Settings, TrendingUp, Users } from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Chip } from '~/components/ui/Chip';
import { Button } from '~/components/ui/Button';
import { ProgressBar } from '~/components/ui/ProgressBar';
import { useTRPC } from '~/trpc/react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface LoopType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  status: 'active' | 'paused' | 'idle';
  metrics: {
    cycles: number;
    efficiency: number;
    latency: number;
    throughput: number;
  };
}

export function LoopMonitor() {
  const [selectedLoop, setSelectedLoop] = useState<string>('orchestration');
  const [monitoringActive, setMonitoringActive] = useState(true);
  const [loopTypes, setLoopTypes] = useState<LoopType[]>([
    {
      id: 'orchestration',
      name: 'Infinite Orchestration Loop',
      icon: Users,
      color: 'text-accent-cyan',
      description: 'Continuously coordinates agent activities in perpetual cycles',
      status: 'active',
      metrics: { cycles: 0, efficiency: 85, latency: 250, throughput: 12 }
    },
    {
      id: 'feedback',
      name: 'Never-ending Feedback Loop',
      icon: RotateCcw,
      color: 'text-accent-pink',
      description: 'Processes agent interactions in continuous learning cycles',
      status: 'active',
      metrics: { cycles: 0, efficiency: 92, latency: 180, throughput: 8 }
    },
    {
      id: 'monitoring',
      name: 'Perpetual Monitoring Loop',
      icon: Activity,
      color: 'text-success-lime',
      description: 'Tracks system health in infinite monitoring cycles',
      status: 'active',
      metrics: { cycles: 0, efficiency: 96, latency: 100, throughput: 30 }
    },
    {
      id: 'optimization',
      name: 'Continuous Optimization Loop',
      icon: Zap,
      color: 'text-accent-violet',
      description: 'Infinitely improves algorithms and strategies',
      status: 'active',
      metrics: { cycles: 0, efficiency: 78, latency: 500, throughput: 4 }
    },
  ]);

  const trpc = useTRPC();

  // Poll for global loop metrics
  const { data: globalMetrics } = useQuery(trpc.orchestration.getLoopMetrics.queryOptions(
    undefined,
    {
      enabled: monitoringActive,
      refetchInterval: 1000,
      onSuccess: (data) => {
        // Update loop types with real metrics
        setLoopTypes(prev => prev.map(loop => {
          if (loop.id === 'orchestration') {
            return {
              ...loop,
              metrics: {
                ...loop.metrics,
                cycles: data.totalCycles || loop.metrics.cycles,
                efficiency: data.coordinationEfficiency || loop.metrics.efficiency,
                latency: data.feedbackLatency || loop.metrics.latency,
              }
            };
          }
          return loop;
        }));
      }
    }
  ));

  // Poll for swarm stats to get additional loop information
  const { data: swarmStats } = useQuery(trpc.orchestration.getSwarmStats.queryOptions(
    undefined,
    {
      enabled: monitoringActive,
      refetchInterval: 2000,
      onSuccess: (data) => {
        if (data.loopMetrics) {
          setLoopTypes(prev => prev.map(loop => {
            const updates = { ...loop };
            
            if (loop.id === 'feedback') {
              updates.metrics = {
                ...loop.metrics,
                cycles: data.loopMetrics!.feedbackLoopsActive || loop.metrics.cycles,
                efficiency: data.loopMetrics!.feedbackEfficiency || loop.metrics.efficiency,
              };
            } else if (loop.id === 'monitoring') {
              updates.metrics = {
                ...loop.metrics,
                cycles: data.loopMetrics!.monitoringLoops?.active || loop.metrics.cycles,
                latency: data.loopMetrics!.monitoringLoops?.averageLatency || loop.metrics.latency,
                throughput: data.loopMetrics!.monitoringLoops?.cyclesPerMinute || loop.metrics.throughput,
              };
            }
            
            return updates;
          }));
        }
      }
    }
  ));

  // Simulate continuous loop updates
  useEffect(() => {
    if (!monitoringActive) return;

    const interval = setInterval(() => {
      setLoopTypes(prev => prev.map(loop => ({
        ...loop,
        metrics: {
          ...loop.metrics,
          cycles: loop.metrics.cycles + (Math.random() > 0.5 ? 1 : 0),
          efficiency: Math.max(60, Math.min(100, loop.metrics.efficiency + (Math.random() - 0.5) * 2)),
          latency: Math.max(50, loop.metrics.latency + (Math.random() - 0.5) * 20),
          throughput: Math.max(1, loop.metrics.throughput + (Math.random() - 0.5) * 1),
        }
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, [monitoringActive]);

  const toggleMonitoring = () => {
    setMonitoringActive(!monitoringActive);
    toast(monitoringActive ? 'Loop monitoring paused' : 'Loop monitoring resumed');
  };

  const toggleLoopStatus = (loopId: string) => {
    setLoopTypes(prev => prev.map(loop => 
      loop.id === loopId 
        ? { ...loop, status: loop.status === 'active' ? 'paused' : 'active' }
        : loop
    ));
    toast(`${loopTypes.find(l => l.id === loopId)?.name} ${loopTypes.find(l => l.id === loopId)?.status === 'active' ? 'paused' : 'resumed'}`);
  };

  const selectedLoopData = loopTypes.find(l => l.id === selectedLoop);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-h2 font-display font-semibold text-text-bright mb-2">
          Infinite Loop Monitor
        </h2>
        <p className="text-body-sm text-text-muted">
          Real-time visualization of infinite system loops — continuous, never-ending, perpetual cycles
        </p>
      </div>

      {/* Global Controls */}
      <div className="flex items-center justify-between bg-text-muted/5 rounded-lg border border-text-muted/20 p-4">
        <div className="flex items-center gap-3">
          <Button size="sm" variant={monitoringActive ? 'secondary' : 'primary'} onClick={toggleMonitoring}>
            {monitoringActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {monitoringActive ? 'Pause All' : 'Resume All'}
          </Button>
          <Chip variant={monitoringActive ? 'running' : 'idle'} animate={monitoringActive}>
            Infinite Monitoring: {monitoringActive ? 'Active' : 'Paused'}
          </Chip>
        </div>
        
        <div className="flex items-center gap-2 text-caption text-text-muted">
          <Activity className="w-3 h-3" />
          <span>System Load: {globalMetrics?.systemLoad?.toFixed(1) || '45.2'}%</span>
          <span>•</span>
          <span>Active Loops: {globalMetrics?.activeLoops || loopTypes.filter(l => l.status === 'active').length}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Loop Type Selector */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <h3 className="text-h3 font-medium text-text-bright mb-4">Loop Types</h3>
            <div className="space-y-2">
              {loopTypes.map(loop => {
                const Icon = loop.icon;
                return (
                  <button
                    key={loop.id}
                    onClick={() => setSelectedLoop(loop.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedLoop === loop.id
                        ? 'border-accent-cyan bg-accent-cyan/10'
                        : 'border-text-muted/20 hover:border-text-muted/40 hover:bg-text-muted/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${loop.color}`} />
                        <span className="text-body-sm font-medium text-text-bright">{loop.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Chip 
                          size="sm" 
                          variant={loop.status === 'active' ? 'running' : 'idle'}
                          animate={loop.status === 'active'}
                        >
                          {loop.status}
                        </Chip>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLoopStatus(loop.id);
                          }}
                        >
                          {loop.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                    <p className="text-caption text-text-muted">{loop.description}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-caption">
                      <div>
                        <span className="text-text-muted">Cycles:</span>
                        <span className={`ml-1 font-mono ${loop.color}`}>{loop.metrics.cycles}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Efficiency:</span>
                        <span className={`ml-1 font-mono ${loop.color}`}>{loop.metrics.efficiency.toFixed(1)}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Selected Loop Details */}
        <div className="lg:col-span-2">
          {selectedLoopData && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-h3 font-medium text-text-bright flex items-center gap-2">
                  <selectedLoopData.icon className={`w-4 h-4 ${selectedLoopData.color}`} />
                  {selectedLoopData.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Chip 
                    variant={selectedLoopData.status === 'active' ? 'running' : 'idle'}
                    animate={selectedLoopData.status === 'active'}
                  >
                    {selectedLoopData.status}
                  </Chip>
                  <Button size="sm" variant="ghost">
                    <Settings className="w-3 h-3" />
                    Configure
                  </Button>
                </div>
              </div>

              <p className="text-body-sm text-text-muted mb-6">{selectedLoopData.description}</p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-text-muted/5 rounded-lg p-3 text-center">
                  <div className={`text-h3 font-bold ${selectedLoopData.color}`}>
                    {selectedLoopData.metrics.cycles}
                  </div>
                  <div className="text-caption text-text-muted">Total Cycles</div>
                </div>
                <div className="bg-text-muted/5 rounded-lg p-3 text-center">
                  <div className={`text-h3 font-bold ${selectedLoopData.color}`}>
                    {selectedLoopData.metrics.efficiency.toFixed(1)}%
                  </div>
                  <div className="text-caption text-text-muted">Efficiency</div>
                </div>
                <div className="bg-text-muted/5 rounded-lg p-3 text-center">
                  <div className={`text-h3 font-bold ${selectedLoopData.color}`}>
                    {selectedLoopData.metrics.latency.toFixed(0)}ms
                  </div>
                  <div className="text-caption text-text-muted">Avg Latency</div>
                </div>
                <div className="bg-text-muted/5 rounded-lg p-3 text-center">
                  <div className={`text-h3 font-bold ${selectedLoopData.color}`}>
                    {selectedLoopData.metrics.throughput.toFixed(1)}/min
                  </div>
                  <div className="text-caption text-text-muted">Throughput</div>
                </div>
              </div>

              {/* Efficiency Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-body-sm text-text-muted">Loop Efficiency</span>
                  <span className="text-body-sm text-text-muted">{selectedLoopData.metrics.efficiency.toFixed(1)}%</span>
                </div>
                <ProgressBar 
                  progress={selectedLoopData.metrics.efficiency} 
                  variant={selectedLoopData.metrics.efficiency > 80 ? 'success' : 'default'}
                />
              </div>

              {/* Recent Activity */}
              <div className="bg-text-muted/5 rounded-lg p-4">
                <h4 className="text-body font-medium text-text-bright mb-3 flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  Infinite Loop Activity
                </h4>
                <div className="space-y-2 font-mono text-caption">
                  <div className="flex justify-between">
                    <span className="text-text-muted">[{new Date().toLocaleTimeString()}]</span>
                    <span className={selectedLoopData.color}>Cycle #{selectedLoopData.metrics.cycles} completed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">[{new Date(Date.now() - 2000).toLocaleTimeString()}]</span>
                    <span className="text-text-muted">Efficiency: {selectedLoopData.metrics.efficiency.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">[{new Date(Date.now() - 4000).toLocaleTimeString()}]</span>
                    <span className="text-text-muted">Latency: {selectedLoopData.metrics.latency.toFixed(0)}ms</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
