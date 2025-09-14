import { TrendingUp, Users, Shield, Clock, Activity, RotateCcw, Zap, Target } from 'lucide-react';
import { useTRPC } from '~/trpc/react';
import { useQuery } from '@tanstack/react-query';
import { Chip } from '~/components/ui/Chip';

export function StatsHeader() {
  const trpc = useTRPC();
  
  const { data: stats, isLoading } = useQuery(
    trpc.orchestration.getSwarmStats.queryOptions(
      undefined,
      {
        refetchInterval: 2000, // Poll every 2 seconds for real-time loop updates
      }
    )
  );

  const { data: loopMetrics } = useQuery(
    trpc.orchestration.getLoopMetrics.queryOptions(
      undefined, // Get global loop metrics
      {
        refetchInterval: 1000, // More frequent polling for loop data
      }
    )
  );

  const statItems = [
    {
      icon: Users,
      label: 'Active Agents',
      value: stats?.activeAgents ?? '-',
      color: 'text-accent-cyan',
      subtext: stats?.realTimeInfo?.pollingConnections ? `${stats.realTimeInfo.pollingConnections} connections` : undefined,
    },
    {
      icon: Activity,
      label: 'Loop Cycles',
      value: stats?.loopMetrics?.totalOrchestrationCycles ?? '-',
      color: 'text-accent-violet',
      subtext: stats?.loopMetrics?.averageCycleTime ? `${stats.loopMetrics.averageCycleTime} avg` : undefined,
    },
    {
      icon: RotateCcw,
      label: 'Feedback Loops',
      value: stats?.loopMetrics?.feedbackLoopsActive ?? '-',
      color: 'text-accent-pink',
      subtext: stats?.loopMetrics?.feedbackEfficiency ? `${stats.loopMetrics.feedbackEfficiency.toFixed(1)}% efficiency` : undefined,
    },
    {
      icon: Zap,
      label: 'Monitoring Loops',
      value: stats?.loopMetrics?.monitoringLoops?.active ?? '-',
      color: 'text-success-lime',
      subtext: stats?.loopMetrics?.monitoringLoops?.averageLatency ? `${stats.loopMetrics.monitoringLoops.averageLatency}ms latency` : undefined,
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: stats ? `${stats.successRate}%` : '-',
      color: 'text-success-lime',
      subtext: stats?.loopMetrics?.adaptationRate ? `${stats.loopMetrics.adaptationRate.toFixed(1)}% adaptation` : undefined,
    },
    {
      icon: Clock,
      label: 'Convergence',
      value: stats?.loopMetrics?.convergenceTime ?? '-',
      color: 'text-accent-cyan',
      subtext: loopMetrics?.convergenceRate ? `${loopMetrics.convergenceRate.toFixed(1)}% rate` : undefined,
    },
    {
      icon: Target,
      label: 'System Load',
      value: loopMetrics ? `${loopMetrics.systemLoad.toFixed(1)}%` : '-',
      color: 'text-accent-violet',
      subtext: loopMetrics?.activeLoops ? `${loopMetrics.activeLoops} active loops` : undefined,
    },
    {
      icon: Shield,
      label: 'False Positives Prevented',
      value: stats?.falsPositivesPrevented ?? '-',
      color: 'text-accent-pink',
      subtext: stats?.avgResolutionTime ?? undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Loop Status Indicator */}
      {stats?.realTimeInfo && (
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-h3 font-medium text-text-bright flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Loop System Status
              </h3>
              <div className="flex items-center gap-2">
                <Chip variant="running" animate size="sm">
                  {stats.loopMetrics?.monitoringLoops?.cyclesPerMinute || 30} cycles/min
                </Chip>
                <Chip variant="pass" size="sm">
                  {stats.realTimeInfo.activeQueries} queries active
                </Chip>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-caption text-text-muted">Orchestration Phase</div>
                <div className="text-body-sm font-medium text-accent-cyan capitalize">
                  {stats.realTimeInfo.orchestrationPhase?.replace('_', ' ') || 'active'}
                </div>
              </div>
              <div>
                <div className="text-caption text-text-muted">Feedback Latency</div>
                <div className="text-body-sm font-medium text-accent-violet">
                  {loopMetrics?.feedbackLatency ? `${loopMetrics.feedbackLatency.toFixed(0)}ms` : '250ms'}
                </div>
              </div>
              <div>
                <div className="text-caption text-text-muted">Memory Usage</div>
                <div className="text-body-sm font-medium text-success-lime">
                  {loopMetrics?.memoryUsage ? `${loopMetrics.memoryUsage.toFixed(1)}%` : '45.2%'}
                </div>
              </div>
              <div>
                <div className="text-caption text-text-muted">Last Heartbeat</div>
                <div className="text-body-sm font-medium text-text-muted">
                  {new Date(stats.realTimeInfo.lastUpdate).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="glass rounded-xl p-4 text-center hover:shadow-card-hover transition-all duration-200"
            >
              <div className="flex items-center justify-center mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="space-y-1">
                <div className={`text-h3 font-bold ${stat.color}`}>
                  {isLoading ? (
                    <div className="w-8 h-6 bg-text-muted/20 rounded animate-pulse mx-auto" />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-caption text-text-muted">
                  {stat.label}
                </div>
                {stat.subtext && (
                  <div className="text-caption text-text-muted/70 italic">
                    {stat.subtext}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
