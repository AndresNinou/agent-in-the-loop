import { useState } from 'react';
import { X, FileText, Shield, MessageCircle, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card } from '~/components/ui/Card';
import { Chip } from '~/components/ui/Chip';
import { Button } from '~/components/ui/Button';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  laneId?: string;
}

const TABS = [
  { id: 'diff', label: 'Diff', icon: FileText },
  { id: 'qa-report', label: 'QA Report', icon: Shield },
  { id: 'agent-chat', label: 'Agent Chat', icon: MessageCircle },
  { id: 'timeline', label: 'Timeline', icon: Clock },
];

const MOCK_FILES = [
  { name: 'src/auth/login.ts', status: 'modified', lines: '+12 -3' },
  { name: 'src/tests/auth.test.ts', status: 'added', lines: '+45' },
  { name: 'package.json', status: 'modified', lines: '+2 -1' },
];

const MOCK_CHAT = [
  { agent: 'Cline', avatar: '🧠', message: 'Starting authentication flow implementation...', time: '2m ago' },
  { agent: 'CodeRabbit', avatar: '🐇', message: 'Reviewing security patterns in auth logic', time: '1m ago' },
  { agent: 'Orchestrator', avatar: '🕹️', message: 'Gate TYPECHECK: passed', time: '45s ago' },
  { agent: 'Claude Code', avatar: '🔧', message: 'Detected potential race condition in token refresh', time: '30s ago' },
];

const TIMELINE_EVENTS = [
  { event: 'launched', time: '5m ago', status: 'completed' },
  { event: 'edits', time: '3m ago', status: 'completed' },
  { event: 'QA', time: '1m ago', status: 'running' },
  { event: 'rework', time: '', status: 'pending' },
  { event: 'verified', time: '', status: 'pending' },
];

export function EvidenceDrawer({ isOpen, onClose, laneId }: EvidenceDrawerProps) {
  const [activeTab, setActiveTab] = useState('diff');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-control-bg/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl transform transition-transform duration-300 ease-out">
        <Card className="h-full rounded-none rounded-l-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-hairline">
            <div>
              <h2 className="text-h2 font-display font-semibold text-text-bright">
                Evidence Panel
              </h2>
              <p className="text-body-sm text-text-muted">
                {laneId ? `Lane: ${laneId}` : 'No lane selected'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-hairline">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-body-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-accent-cyan border-accent-cyan'
                      : 'text-text-muted border-transparent hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'diff' && (
              <div className="space-y-4">
                <h3 className="text-h3 font-medium text-text-bright">Changed Files</h3>
                <div className="space-y-2">
                  {MOCK_FILES.map((file, index) => (
                    <div key={index} className="p-3 bg-text-muted/5 rounded-lg border border-text-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-body-sm text-text-primary">{file.name}</span>
                        <Chip size="sm" variant={file.status === 'added' ? 'pass' : 'selectable'}>
                          {file.status}
                        </Chip>
                      </div>
                      <p className="text-caption text-text-muted font-mono">{file.lines}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-text-muted/5 rounded-lg border border-text-muted/20">
                  <h4 className="text-body font-medium text-text-bright mb-3">Preview: src/auth/login.ts</h4>
                  <pre className="text-caption font-mono text-text-muted overflow-x-auto">
{`+ const validateToken = (token: string): boolean => {
+   return token.length > 0 && !token.includes('demo');
+ }
  
  export async function login(credentials: LoginData) {
-   // TODO: implement validation
+   if (!validateToken(credentials.token)) {
+     throw new Error('Invalid token format');
+   }
    return authenticate(credentials);
  }`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'qa-report' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-h3 font-medium text-text-bright">QA Report</h3>
                  <Chip variant="running" animate>Overall: Running</Chip>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Chip variant="pass" icon={<CheckCircle className="w-3 h-3" />}>build_ok</Chip>
                  <Chip variant="pass" icon={<CheckCircle className="w-3 h-3" />}>typecheck_ok</Chip>
                  <Chip variant="pass" icon={<CheckCircle className="w-3 h-3" />}>lint_ok</Chip>
                  <Chip variant="running" icon={<AlertCircle className="w-3 h-3" />}>tests_running</Chip>
                  <Chip variant="idle">coverage</Chip>
                  <Chip variant="pass" icon={<CheckCircle className="w-3 h-3" />}>anti_bs: clean</Chip>
                </div>

                <div className="mt-6 p-4 bg-text-muted/5 rounded-lg border border-text-muted/20">
                  <h4 className="text-body font-medium text-text-bright mb-3">Signals</h4>
                  <div className="space-y-2 font-mono text-caption text-text-muted">
                    <div>✓ build_ok · typecheck_ok · lint_ok</div>
                    <div>⚠ tests_ok: 3/5 suites passing</div>
                    <div>- coverage: pending</div>
                    <div>✓ anti_bs: no hardcoded demo values detected</div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-fail-rose/10 border border-fail-rose/30 rounded-lg">
                  <h4 className="text-body-sm font-medium text-fail-rose mb-2">Last Error Lines</h4>
                  <pre className="text-caption font-mono text-text-muted">
{`FAIL src/tests/auth.test.ts
● should handle invalid tokens
  Expected: "Invalid token format"
  Received: undefined`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'agent-chat' && (
              <div className="space-y-4">
                <h3 className="text-h3 font-medium text-text-bright">Agent Chat</h3>
                <div className="space-y-3">
                  {MOCK_CHAT.map((message, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="text-lg">{message.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-body-sm font-medium text-accent-cyan">{message.agent}</span>
                          <span className="text-caption text-text-muted">{message.time}</span>
                        </div>
                        <p className="text-body-sm text-text-muted">{message.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                <h3 className="text-h3 font-medium text-text-bright">Timeline</h3>
                <div className="space-y-4">
                  {TIMELINE_EVENTS.map((event, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        event.status === 'completed' ? 'bg-success-lime' :
                        event.status === 'running' ? 'bg-running-amber animate-pulse' :
                        'bg-text-muted/30'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-body-sm font-medium text-text-primary capitalize">
                            {event.event}
                          </span>
                          <span className="text-caption text-text-muted">
                            {event.time || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
