import { useState, useEffect } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Chip } from '~/components/ui/Chip';
import { Button } from '~/components/ui/Button';
import toast from 'react-hot-toast';
import { useTRPC } from '~/trpc/react';
import { useMutation } from '@tanstack/react-query';

const STRATEGIES = [
  { id: 'reviewer-first', label: 'Reviewer-First' },
  { id: 'divide-conquer', label: 'Divide & Conquer' },
  { id: 'dice-roll', label: 'Dice-Roll' },
];

interface SwarmControlsProps {
  onConfigChange?: (config: {
    clineInstances: number;
    coderabbitInstances: number;
    strategy: string;
    autoDedup: boolean;
  }) => void;
}

export function SwarmControls({ onConfigChange }: SwarmControlsProps) {
  const [clineInstances, setClineInstances] = useState(2);
  const [coderabbitInstances, setCoderabbitInstances] = useState(1);
  const [selectedStrategy, setSelectedStrategy] = useState('reviewer-first');
  const [autoDedup, setAutoDedup] = useState(true);

  const trpc = useTRPC();

  const synchronizeMutation = useMutation(
    trpc.orchestration.launchSwarm.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Agents synchronized: ${data.message}`);
      },
      onError: (error) => {
        toast.error(`Synchronization failed: ${error.message}`);
      },
    })
  );

  const handleSynchronize = () => {
    synchronizeMutation.mutate({
      criteria: ['tests', 'typecheck', 'lint'], // Default criteria
      clineInstances,
      coderabbitInstances,
      strategy: selectedStrategy as 'reviewer-first' | 'divide-conquer' | 'dice-roll',
    });
  };

  // Notify parent of config changes
  useEffect(() => {
    onConfigChange?.({
      clineInstances,
      coderabbitInstances,
      strategy: selectedStrategy,
      autoDedup,
    });
  }, [clineInstances, coderabbitInstances, selectedStrategy, autoDedup, onConfigChange]);

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-h2 font-display font-semibold text-text-bright mb-2">
            Swarm Controls
          </h2>
          <p className="text-body-sm text-text-muted">
            Configure your multi-agent orchestration
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Agent Instance Sliders */}
          <div className="space-y-6">
            <h3 className="text-h3 font-medium text-text-bright">Agent Instances</h3>
            
            {/* Cline Instances */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-body-sm text-text-muted">Cline Instances</label>
                <span className="text-body-sm text-accent-cyan font-medium">{clineInstances}</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={clineInstances}
                  onChange={(e) => setClineInstances(parseInt(e.target.value))}
                  className="w-full h-2 bg-text-muted/20 rounded-lg appearance-none cursor-pointer slider"
                />
                <style jsx>{`
                  .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%);
                    cursor: pointer;
                    box-shadow: 0 0 8px rgba(34, 211, 238, 0.4);
                  }
                  .slider::-moz-range-thumb {
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%);
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 0 8px rgba(34, 211, 238, 0.4);
                  }
                `}</style>
              </div>
            </div>

            {/* CodeRabbit Instances */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-body-sm text-text-muted">CodeRabbit Instances</label>
                <span className="text-body-sm text-accent-violet font-medium">{coderabbitInstances}</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={coderabbitInstances}
                  onChange={(e) => setCoderabbitInstances(parseInt(e.target.value))}
                  className="w-full h-2 bg-text-muted/20 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>

          {/* Strategy & Options */}
          <div className="space-y-6">
            <h3 className="text-h3 font-medium text-text-bright">Strategy</h3>
            
            <div className="space-y-3">
              <p className="text-body-sm text-text-muted">Orchestration Strategy</p>
              <div className="flex flex-wrap gap-2">
                {STRATEGIES.map((strategy) => (
                  <Chip
                    key={strategy.id}
                    variant={selectedStrategy === strategy.id ? 'selected' : 'selectable'}
                    onClick={() => setSelectedStrategy(strategy.id)}
                  >
                    {strategy.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-body-sm text-text-muted">Options</p>
              <div className="flex items-center justify-between p-3 bg-text-muted/5 rounded-lg border border-text-muted/20">
                <span className="text-body-sm text-text-primary">Auto-Dedup Similar Ideas</span>
                <button
                  onClick={() => setAutoDedup(!autoDedup)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-control-bg ${
                    autoDedup ? 'bg-accent-cyan' : 'bg-text-muted/30'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoDedup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-hairline">
          <Button 
            size="lg" 
            variant="secondary"
            onClick={handleSynchronize}
            isLoading={synchronizeMutation.isPending}
            className="w-full"
          >
            <RefreshCw className="w-5 h-5" />
            Synchronize Agents
          </Button>
        </div>
      </div>
    </Card>
  );
}
