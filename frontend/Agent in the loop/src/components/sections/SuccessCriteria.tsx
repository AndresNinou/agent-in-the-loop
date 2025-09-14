import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Chip } from '~/components/ui/Chip';
import { Button } from '~/components/ui/Button';
import toast from 'react-hot-toast';
import { useTRPC } from '~/trpc/react';
import { useMutation } from '@tanstack/react-query';

const CRITERIA_OPTIONS = [
  { id: 'tests', label: 'All tests green', selected: true },
  { id: 'hardcode', label: 'No hardcoding', selected: true },
  { id: 'typecheck', label: 'Typecheck clean', selected: true },
  { id: 'coverage', label: 'Coverage ≥ 80%', selected: false },
  { id: 'lint', label: 'Lint clean', selected: true },
  { id: 'security', label: 'Security scan', selected: false },
];

export function SuccessCriteria() {
  const [criteria, setCriteria] = useState(CRITERIA_OPTIONS);
  const trpc = useTRPC();
  
  const launchSwarmMutation = useMutation(
    trpc.orchestration.launchSwarm.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message);
      },
      onError: (error) => {
        toast.error(`Failed to launch swarm: ${error.message}`);
      },
    })
  );

  const toggleCriterion = (id: string) => {
    setCriteria(prev => prev.map(c => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ));
  };

  const handleLaunchSwarm = () => {
    const selectedCriteria = criteria.filter(c => c.selected).map(c => c.id);
    
    launchSwarmMutation.mutate({
      criteria: selectedCriteria,
      clineInstances: 2, // Default values - could be made configurable
      coderabbitInstances: 1,
      strategy: 'reviewer-first',
    });
  };

  return (
    <Card variant="focus" className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-h2 font-display font-semibold text-text-bright mb-2">
            Success Criteria
          </h2>
          <p className="text-body-sm text-text-muted">
            Define what "actually green" means for your agents
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {criteria.map((criterion) => (
            <Chip
              key={criterion.id}
              variant={criterion.selected ? 'selected' : 'selectable'}
              onClick={() => toggleCriterion(criterion.id)}
              className="transition-all duration-200"
            >
              {criterion.label}
            </Chip>
          ))}
        </div>

        <div className="pt-4 border-t border-hairline">
          <Button 
            size="lg" 
            onClick={handleLaunchSwarm}
            isLoading={launchSwarmMutation.isPending}
            className="w-full bg-orchestrate hover:shadow-glow-cyan"
          >
            <Rocket className="w-5 h-5" />
            Launch Swarm
          </Button>
        </div>
      </div>
    </Card>
  );
}
