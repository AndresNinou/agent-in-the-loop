import { useState, useEffect } from 'react';
import { Play, Pause, Trash2, ExternalLink, Brain, Rabbit, Activity, RotateCcw, Zap } from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Chip } from '~/components/ui/Chip';
import { Button } from '~/components/ui/Button';
import { ProgressBar } from '~/components/ui/ProgressBar';
import toast from 'react-hot-toast';
import { useTRPC } from '~/trpc/react';
import { useQuery } from '@tanstack/react-query';

const GATES = [
  { id: 'install', label: 'INSTALL', icon: '📦' },
  { id: 'build', label: 'BUILD', icon: '🔧' },
  { id: 'lint', label: 'LINT', icon: '✨' },
  { id: 'typecheck', label: 'TYPECHECK', icon: '🔍' },
  { id: 'tests', label: 'TESTS', icon: '🧪' },
  { id: 'coverage', label: 'COVERAGE', icon: '🛡️' },
];

interface Lane {
  id: string;
  name: string;
  agent: 'cline' | 'coderabbit';
  status: 'idle' | 'running' | 'qa' | 'rework' | 'verified';
  progress: number;
  gates: Record<string, 'idle' | 'running' | 'pass' | 'fail'>;
  messages: Array<{ agent: string; text: string; timestamp: number }>;
  // Enhanced loop information
  loopMetrics?: {
    totalIterations: number;
    cycleTime: number;
    efficiency: number;
  };
  activeGate?: string;
  currentIteration?: number;
  feedbackLoop?: {
    fromAgent: string;
    toAgent: string;
    message: string;
    confidence: number;
  };
  orchestrationPhase?: string;
}

interface ParallelLanesProps {
  onLaneClick?: (laneId: string) => void;
}

const initialLanes: Lane[] = [
  {
    id: 'lane-1',
    name: 'Environment Alpha',
    agent: 'cline',
    status: 'running',
    progress: 65,
    gates: {
      install: 'pass',
      build: 'pass',
      lint: 'running',
      typecheck: 'idle',
      tests: 'idle',
      coverage: 'idle',
    },
    messages: [
      { agent: 'Cline', text: 'Analyzing test coverage patterns...', timestamp: Date.now() - 1000 },
      { agent: 'Orchestrator', text: 'Gate: LINT in progress', timestamp: Date.now() - 2000 },
    ],
    loopMetrics: {
      totalIterations: 12,
      cycleTime: 2400,
      efficiency: 0.87,
    },
    activeGate: 'lint',
    currentIteration: 3,
    orchestrationPhase: 'quality_check',
  },
  {
    id: 'lane-2',
    name: 'Environment Beta',
    agent: 'coderabbit',
    status: 'qa',
    progress: 85,
    gates: {
      install: 'pass',
      build: 'pass',
      lint: 'pass',
      typecheck: 'pass',
      tests: 'running',
      coverage: 'idle',
    },
    messages: [
      { agent: 'CodeRabbit', text: 'Reviewing test implementation quality...', timestamp: Date.now() - 500 },
      { agent: 'Claude Code', text: 'Found potential edge case in auth logic', timestamp: Date.now() - 1500 },
    ],
    loopMetrics: {
      totalIterations: 8,
      cycleTime: 1800,
      efficiency: 0.92,
    },
    activeGate: 'tests',
    currentIteration: 2,
    feedbackLoop: {
      fromAgent: 'Cline',
      toAgent: 'CodeRabbit',
      message: 'Consider refactoring auth validation logic for better testability',
      confidence: 0.85,
    },
    orchestrationPhase: 'peer_review',
  },
];

export function ParallelLanes({ onLaneClick }: ParallelLanesProps) {
  const [lanes, setLanes] = useState<Lane[]>(initialLanes);
  const [loopControls, setLoopControls] = useState({
    monitoringActive: true,
    feedbackLoopsEnabled: true,
    orchestrationRunning: true,
    cycleInterval: 2000,
  });

  const trpc = useTRPC();

  // Poll for swarm stats to get orchestration information - called at top level
  const swarmStatsQuery = useQuery(trpc.orchestration.getSwarmStats.queryOptions(
    undefined,
    {
      enabled: loopControls.orchestrationRunning,
      refetchInterval: 3000, // 3 second orchestration cycle
      onSuccess: (data) => {
        // Update lanes with orchestration metrics
        if (data.loopMetrics) {
          setLanes(prev => prev.map(lane => ({
            ...lane,
            orchestrationPhase: data.realTimeInfo?.orchestrationPhase || 'orchestration_active',
            loopMetrics: lane.loopMetrics ? {
              ...lane.loopMetrics,
              totalIterations: Math.max(lane.loopMetrics.totalIterations, data.loopMetrics.totalOrchestrationCycles || 0),
            } : undefined,
          })));
        }
      },
      onError: (error) => {
        console.error('Swarm stats error:', error);
      },
    }
  ));

  // Poll for individual lane statuses - using a single query for all lanes
  const allLaneStatusQuery = useQuery(trpc.orchestration.getLoopMetrics.queryOptions(
    undefined, // Get global metrics
    {
      enabled: loopControls.monitoringActive,
      refetchInterval: loopControls.cycleInterval,
      onSuccess: (data) => {
        // Update lanes with real-time loop metrics from server
        if (data.loopType === 'orchestration') {
          setLanes(prev => prev.map(lane => ({
            ...lane,
            loopMetrics: lane.loopMetrics ? {
              ...lane.loopMetrics,
              totalIterations: Math.max(lane.loopMetrics.totalIterations, data.totalCycles || 0),
              efficiency: Math.max(0.5, data.coordinationEfficiency / 100 || 0.8),
            } : undefined,
          })));
        }
      },
      onError: (error) => {
        console.error('Loop metrics error:', error);
      },
    }
  ));

  // Enhanced simulation loop for better loop representation
  useEffect(() => {
    if (!loopControls.monitoringActive) return;
    
    const interval = setInterval(() => {
      setLanes(prev => prev.map(lane => {
        const updates: Partial<Lane> = {};
        
        // Simulate continuous progress for running lanes
        if (lane.status === 'running' && lane.progress < 100) {
          updates.progress = Math.min(100, lane.progress + Math.random() * 3);
          
          // Update loop metrics to show continuous iteration
          if (lane.loopMetrics) {
            updates.loopMetrics = {
              ...lane.loopMetrics,
              totalIterations: lane.loopMetrics.totalIterations + (Math.random() > 0.7 ? 1 : 0),
              cycleTime: Math.max(1000, lane.loopMetrics.cycleTime + (Math.random() - 0.5) * 200),
              efficiency: Math.max(0.5, Math.min(1, lane.loopMetrics.efficiency + (Math.random() - 0.5) * 0.05)),
            };
            updates.currentIteration = (lane.currentIteration || 0) + (Math.random() > 0.8 ? 1 : 0);
          }
          
          // Simulate gate progression in a loop
          const gates = ['install', 'build', 'lint', 'typecheck', 'tests', 'coverage'];
          const currentGateIndex = gates.findIndex(g => lane.gates[g] === 'running');
          if (currentGateIndex !== -1 && Math.random() > 0.7) {
            const newGates = { ...lane.gates };
            newGates[gates[currentGateIndex]] = 'pass';
            if (currentGateIndex < gates.length - 1) {
              newGates[gates[currentGateIndex + 1]] = 'running';
              updates.activeGate = gates[currentGateIndex + 1];
            }
            updates.gates = newGates;
          }
          
          // Simulate feedback loop updates
          if (loopControls.feedbackLoopsEnabled && Math.random() > 0.85) {
            const feedbackMessages = [
              'Optimization suggestion: reduce complexity',
              'Quality check: tests needed',
              'Performance improvement detected',
              'Code review feedback applied',
              'Refactoring suggestion: extract common logic',
            ];
            updates.feedbackLoop = {
              fromAgent: lane.agent === 'cline' ? 'CodeRabbit' : 'Cline',
              toAgent: lane.agent,
              message: feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)],
              confidence: Math.random() * 0.3 + 0.7,
            };
          }
          
          // Add new messages periodically
          if (Math.random() > 0.9) {
            const newMessages = [
              'Running quality checks...',
              'Analyzing code patterns...',
              'Optimizing performance...',
              'Validating test coverage...',
              'Processing feedback loop...',
            ];
            const newMessage = {
              agent: lane.agent === 'cline' ? 'Cline' : 'CodeRabbit',
              text: newMessages[Math.floor(Math.random() * newMessages.length)],
              timestamp: Date.now(),
            };
            updates.messages = [newMessage, ...lane.messages.slice(0, 2)];
          }
        }
        
        return { ...lane, ...updates };
      }));
    }, loopControls.cycleInterval);

    return () => clearInterval(interval);
  }, [loopControls.monitoringActive, loopControls.cycleInterval, loopControls.feedbackLoopsEnabled]);

  const toggleMonitoring = () => {
    setLoopControls(prev => ({
      ...prev,
      monitoringActive: !prev.monitoringActive,
    }));
    toast(loopControls.monitoringActive ? 'Monitoring loops paused' : 'Monitoring loops resumed');
  };

  const toggleFeedbackLoops = () => {
    setLoopControls(prev => ({
      ...prev,
      feedbackLoopsEnabled: !prev.feedbackLoopsEnabled,
    }));
    toast(loopControls.feedbackLoopsEnabled ? 'Feedback loops disabled' : 'Feedback loops enabled');
  };

  const adjustCycleInterval = (newInterval: number) => {
    setLoopControls(prev => ({
      ...prev,
      cycleInterval: newInterval,
    }));
    toast(`Cycle interval adjusted to ${newInterval}ms`);
  };

  const handleLaneAction = (e: React.MouseEvent, laneId: string, action: string) => {
    e.stopPropagation(); // Prevent triggering the lane click
    toast(`${action} action triggered for ${lanes.find(l => l.id === laneId)?.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-h2 font-display font-semibold text-text-bright mb-2">
          Parallel Environment Lanes
        </h2>
        <p className="text-body-sm text-text-muted">
          Independent VS Code environments running in parallel with continuous feedback loops
        </p>
      </div>

      {/* Loop Controls */}
      <div className="bg-text-muted/5 rounded-lg border border-text-muted/20 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-h3 font-medium text-text-bright flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Loop Controls
          </h3>
          <div className="flex items-center gap-2">
            <Chip 
              variant={loopControls.monitoringActive ? 'running' : 'idle'} 
              animate={loopControls.monitoringActive}
              size="sm"
            >
              Monitoring: {loopControls.monitoringActive ? 'Active' : 'Paused'}
            </Chip>
            <Chip 
              variant={loopControls.orchestrationRunning ? 'running' : 'idle'}
              animate={loopControls.orchestrationRunning}
              size="sm"
            >
              Orchestration: {loopControls.orchestrationRunning ? 'Running' : 'Stopped'}
            </Chip>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            size="sm" 
            variant={loopControls.monitoringActive ? 'secondary' : 'primary'}
            onClick={toggleMonitoring}
          >
            {loopControls.monitoringActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {loopControls.monitoringActive ? 'Pause Monitoring' : 'Resume Monitoring'}
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost"
            onClick={toggleFeedbackLoops}
          >
            <RotateCcw className="w-3 h-3" />
            Feedback Loops: {loopControls.feedbackLoopsEnabled ? 'On' : 'Off'}
          </Button>
          
          <div className="flex items-center gap-2 text-caption text-text-muted">
            <span>Cycle:</span>
            <select 
              value={loopControls.cycleInterval}
              onChange={(e) => adjustCycleInterval(parseInt(e.target.value))}
              className="bg-control-bg border border-text-muted/30 rounded px-2 py-1 text-text-primary"
            >
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value={3000}>3s</option>
              <option value={5000}>5s</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {lanes.map((lane) => (
          <Card 
            key={lane.id} 
            className="space-y-4 cursor-pointer hover:shadow-card-hover hover:scale-[1.02] transition-all duration-200" 
            onClick={() => onLaneClick?.(lane.id)}
          >
            {/* Enhanced Lane Header with Loop Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-h3 font-medium text-text-bright">
                  {lane.name}
                </h3>
                <div className="flex items-center gap-2">
                  {lane.agent === 'cline' ? (
                    <Chip size="sm" variant="selected" icon={<Brain className="w-3 h-3" />}>
                      Cline 🧠
                    </Chip>
                  ) : (
                    <Chip size="sm" variant="selected" icon={<Rabbit className="w-3 h-3" />}>
                      CodeRabbit 🐇
                    </Chip>
                  )}
                  
                  {/* Loop iteration indicator */}
                  {lane.currentIteration && (
                    <Chip size="sm" variant="idle" icon={<RotateCcw className="w-3 h-3" />}>
                      Cycle #{lane.currentIteration}
                    </Chip>
                  )}
                  
                  {/* Active gate indicator */}
                  {lane.activeGate && (
                    <Chip size="sm" variant="running" animate>
                      {lane.activeGate.toUpperCase()}
                    </Chip>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Chip 
                  size="sm" 
                  variant={
                    lane.status === 'idle' ? 'idle' :
                    lane.status === 'running' ? 'running' :
                    lane.status === 'verified' ? 'pass' : 'selectable'
                  }
                  animate={lane.status === 'running'}
                >
                  {lane.status.charAt(0).toUpperCase() + lane.status.slice(1)}
                </Chip>
                
                {/* Orchestration phase indicator */}
                {lane.orchestrationPhase && (
                  <Chip size="sm" variant="selectable">
                    {lane.orchestrationPhase.replace('_', ' ')}
                  </Chip>
                )}
              </div>
            </div>

            {/* Gates */}
            <div className="flex flex-wrap gap-2">
              {GATES.map((gate) => (
                <Chip
                  key={gate.id}
                  size="sm"
                  variant={lane.gates[gate.id] || 'idle'}
                  animate={lane.gates[gate.id] === 'running'}
                  icon={<span>{gate.icon}</span>}
                >
                  {gate.label}
                </Chip>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-caption text-text-muted">Progress</span>
                <span className="text-caption text-text-muted">{Math.round(lane.progress)}%</span>
              </div>
              <ProgressBar 
                progress={lane.progress} 
                variant={lane.status === 'verified' ? 'success' : 'default'}
              />
            </div>

            {/* Loop Metrics */}
            {lane.loopMetrics && (
              <div className="bg-text-muted/5 rounded-lg p-3 space-y-2">
                <h4 className="text-caption font-medium text-text-bright flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Loop Metrics
                </h4>
                <div className="grid grid-cols-3 gap-3 text-caption">
                  <div>
                    <span className="text-text-muted">Iterations:</span>
                    <div className="font-mono text-accent-cyan">{lane.loopMetrics.totalIterations}</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Cycle Time:</span>
                    <div className="font-mono text-accent-violet">{(lane.loopMetrics.cycleTime / 1000).toFixed(1)}s</div>
                  </div>
                  <div>
                    <span className="text-text-muted">Efficiency:</span>
                    <div className="font-mono text-success-lime">{(lane.loopMetrics.efficiency * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback Loop Indicator */}
            {lane.feedbackLoop && loopControls.feedbackLoopsEnabled && (
              <div className="bg-accent-cyan/10 border border-accent-cyan/30 rounded-lg p-3">
                <h4 className="text-caption font-medium text-accent-cyan mb-1">
                  Feedback Loop Active
                </h4>
                <div className="text-caption text-text-muted">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono">{lane.feedbackLoop.fromAgent}</span>
                    <span>→</span>
                    <span className="font-mono">{lane.feedbackLoop.toAgent}</span>
                    <Chip size="sm" variant="running">
                      {(lane.feedbackLoop.confidence * 100).toFixed(0)}%
                    </Chip>
                  </div>
                  <p className="italic">{lane.feedbackLoop.message}</p>
                </div>
              </div>
            )}

            {/* Message Ticker */}
            <div className="bg-text-muted/5 rounded-lg p-3 space-y-1 font-mono text-caption">
              {lane.messages.slice(-3).map((message, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-accent-cyan flex-shrink-0">[{message.agent}]</span>
                  <span className="text-text-muted">{message.text}</span>
                </div>
              ))}
            </div>

            {/* Lane Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-hairline">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={(e) => handleLaneAction(e, lane.id, 'pause')}
              >
                <Pause className="w-3 h-3" />
                Pause
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={(e) => handleLaneAction(e, lane.id, 'resume')}
              >
                <Play className="w-3 h-3" />
                Resume
              </Button>
              <Button 
                size="sm" 
                variant="danger" 
                onClick={(e) => handleLaneAction(e, lane.id, 'nuke')}
              >
                <Trash2 className="w-3 h-3" />
                Nuke
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                disabled
                className="ml-auto opacity-50 cursor-not-allowed"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
