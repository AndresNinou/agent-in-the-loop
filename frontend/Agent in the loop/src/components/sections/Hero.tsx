import { AlertTriangle, Workflow } from 'lucide-react';
import { Button } from '~/components/ui/Button';
import toast from 'react-hot-toast';

export function Hero() {
  const handleStartOrchestration = () => {
    toast.success('Orchestration initiated — launching agent swarm');
  };

  const handleSeeFakeGreens = () => {
    toast('Demo: Showing how we catch false positives');
  };

  return (
    <div className="text-center space-y-8">
      {/* Pain banner */}
      <div className="inline-flex items-center gap-3 px-4 py-2 bg-fail-rose/10 border border-fail-rose/30 rounded-xl text-fail-rose text-body-sm">
        <AlertTriangle className="w-4 h-4" />
        <span>Tired of 'Fixed! ✅' that isn't? We gate every claim so you don't waste cycles.</span>
      </div>

      {/* Main headline */}
      <div className="space-y-4">
        <h1 className="text-hero font-display font-bold text-text-bright">
          Stop False Positives.
          <br />
          <span className="bg-orchestrate bg-clip-text text-transparent">
            Start Orchestration.
          </span>
        </h1>
        
        <p className="text-h3 text-text-muted max-w-3xl mx-auto leading-relaxed">
          Multiple agent instances (Cline + CodeRabbit) collaborate in parallel. 
          Independent QA gates every claim. You review only when it's real.
        </p>
      </div>

      {/* Pain bullets */}
      <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
        <div className="p-4 bg-text-muted/5 rounded-xl border border-text-muted/20">
          <p className="text-body-sm text-text-muted">
            <span className="text-fail-rose">•</span> False positives waste review time.
          </p>
        </div>
        <div className="p-4 bg-text-muted/5 rounded-xl border border-text-muted/20">
          <p className="text-body-sm text-text-muted">
            <span className="text-fail-rose">•</span> Hardcoded 'demos' pass locally, break in reality.
          </p>
        </div>
        <div className="p-4 bg-text-muted/5 rounded-xl border border-text-muted/20">
          <p className="text-body-sm text-text-muted">
            <span className="text-fail-rose">•</span> Endless copy/paste ⇒ rerun ⇒ discover it's not fixed.
          </p>
        </div>
      </div>

      {/* Promise line */}
      <div className="p-6 bg-success-lime/5 border border-success-lime/20 rounded-2xl max-w-2xl mx-auto">
        <p className="text-body text-success-lime font-medium">
          Agent in the Loop gates every claim with independent QA — you only review when it's <strong>actually</strong> green.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button 
          size="lg" 
          onClick={handleStartOrchestration}
          className="min-w-48"
        >
          <Workflow className="w-5 h-5" />
          Start Orchestration
        </Button>
        
        <Button 
          variant="ghost" 
          size="lg" 
          onClick={handleSeeFakeGreens}
          className="min-w-48"
        >
          See How It Catches Fake Greens
        </Button>
      </div>
    </div>
  );
}
