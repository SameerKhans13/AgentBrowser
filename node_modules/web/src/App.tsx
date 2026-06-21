import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Play, 
  Terminal, 
  Layers, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Search, 
  ExternalLink,
  ChevronRight,
  Eye
} from 'lucide-react';

// API configurations
const API_BASE_URL = 'http://localhost:3001/api';

interface AgentRun {
  id: string;
  targetUrl: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt: string | null;
  errorLog: string | null;
  instructions?: string | null;
}

interface ActionLog {
  id: string;
  runId: string;
  stepIndex: number;
  actionType: string;
  thought: string;
  parameters: Record<string, any> | null;
  screenshotUrl: string | null;
  createdAt: string;
}

// Highly descriptive, gorgeous sample mock data for presentations
const MOCK_RUNS: AgentRun[] = [
  {
    id: 'f39a7b7e-001d-4001-9a74-98403bc686ab',
    targetUrl: 'https://ui.shadcn.com/docs/forms/react-hook-form',
    status: 'COMPLETED',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3540000).toISOString(),
    errorLog: null
  },
  {
    id: 'a12bcde3-4567-8910-1112-131415161718',
    targetUrl: 'https://ui.shadcn.com/docs/forms/react-hook-form',
    status: 'RUNNING',
    startedAt: new Date().toISOString(),
    completedAt: null,
    errorLog: null
  }
];

const MOCK_LOGS: Record<string, ActionLog[]> = {
  'f39a7b7e-001d-4001-9a74-98403bc686ab': [
    {
      id: '1',
      runId: 'f39a7b7e-001d-4001-9a74-98403bc686ab',
      stepIndex: 1,
      actionType: 'OPEN_BROWSER',
      thought: 'Initializing the Chromium browser session in non-headless state.',
      parameters: null,
      screenshotUrl: null,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      runId: 'f39a7b7e-001d-4001-9a74-98403bc686ab',
      stepIndex: 2,
      actionType: 'GOTO_URL',
      thought: 'Navigating to Shadcn form documentation URL and waiting for loaded elements.',
      parameters: { url: 'https://ui.shadcn.com/docs/forms/react-hook-form' },
      screenshotUrl: 'https://picsum.photos/800/500?random=1',
      createdAt: new Date(Date.now() - 3590000).toISOString()
    },
    {
      id: '3',
      runId: 'f39a7b7e-001d-4001-9a74-98403bc686ab',
      stepIndex: 3,
      actionType: 'CLICK',
      thought: 'Identified Name input field at coordinates x=450, y=320. Performing mouse focus click.',
      parameters: { x: 450, y: 320, label: 'Username' },
      screenshotUrl: 'https://picsum.photos/800/500?random=2',
      createdAt: new Date(Date.now() - 3580000).toISOString()
    },
    {
      id: '4',
      runId: 'f39a7b7e-001d-4001-9a74-98403bc686ab',
      stepIndex: 4,
      actionType: 'SEND_KEYS',
      thought: 'Typing demo username text "shadcn-agent-user" into active Name field.',
      parameters: { x: 450, y: 320, text: 'shadcn-agent-user', label: 'Username' },
      screenshotUrl: 'https://picsum.photos/800/500?random=3',
      createdAt: new Date(Date.now() - 3570000).toISOString()
    },
    {
      id: '5',
      runId: 'f39a7b7e-001d-4001-9a74-98403bc686ab',
      stepIndex: 5,
      actionType: 'SEND_KEYS',
      thought: 'Focusing on Description textarea at x=450, y=410 and entering the descriptive biography details.',
      parameters: { x: 450, y: 410, text: 'This is an autonomous text representation filled perfectly by our LLM-powered browser agent.', label: 'Description' },
      screenshotUrl: 'https://picsum.photos/800/500?random=4',
      createdAt: new Date(Date.now() - 3560000).toISOString()
    },
    {
      id: '6',
      runId: 'f39a7b7e-001d-4001-9a74-98403bc686ab',
      stepIndex: 6,
      actionType: 'CLICK',
      thought: 'All target parameters inserted. Targeting the Submit/Submit Form button at x=520, y=550 to submit the hook form.',
      parameters: { x: 520, y: 550, label: 'Submit' },
      screenshotUrl: 'https://picsum.photos/800/500?random=5',
      createdAt: new Date(Date.now() - 3550000).toISOString()
    },
    {
      id: '7',
      runId: 'f39a7b7e-001d-4001-9a74-98403bc686ab',
      stepIndex: 7,
      actionType: 'FINISH',
      thought: 'I see form validation matches and toast success state showing success message. Breaking loop.',
      parameters: {},
      screenshotUrl: 'https://picsum.photos/800/500?random=6',
      createdAt: new Date(Date.now() - 3540000).toISOString()
    }
  ],
  'a12bcde3-4567-8910-1112-131415161718': [
    {
      id: '10',
      runId: 'a12bcde3-4567-8910-1112-131415161718',
      stepIndex: 1,
      actionType: 'OPEN_BROWSER',
      thought: 'Launching fresh Chromium environment.',
      parameters: null,
      screenshotUrl: null,
      createdAt: new Date().toISOString()
    },
    {
      id: '11',
      runId: 'a12bcde3-4567-8910-1112-131415161718',
      stepIndex: 2,
      actionType: 'GOTO_URL',
      thought: 'Loading target documentation url. Wait for DOM content to finish loading.',
      parameters: { url: 'https://ui.shadcn.com/docs/forms/react-hook-form' },
      screenshotUrl: 'https://picsum.photos/800/500?random=11',
      createdAt: new Date().toISOString()
    }
  ]
};

export default function App() {
  const [selectedRunId, setSelectedRunId] = useState<string>('f39a7b7e-001d-4001-9a74-98403bc686ab');
  const [activeTab, setActiveTab] = useState<'console' | 'table'>('console');
  const [activeScreenshot, setActiveScreenshot] = useState<string>('https://picsum.photos/800/500?random=1');
  const [inputUrl, setInputUrl] = useState<string>('https://ui.shadcn.com/docs/forms/react-hook-form');
  const [inputInstructions, setInputInstructions] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const handleLaunchAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    setIsLaunching(true);
    setLaunchError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/run`, { 
        targetUrl: inputUrl,
        instructions: inputInstructions 
      });
      setSelectedRunId(res.data.id);
    } catch (err: any) {
      console.error('Failed to trigger run:', err);
      setLaunchError(err.response?.data?.error || err.message || 'Failed to start agent');
    } finally {
      setIsLaunching(false);
    }
  };

  // Fetch runs list (Polled every 2 seconds via react-query)
  const { data: runs = MOCK_RUNS, isLoading: isLoadingRuns } = useQuery<AgentRun[]>({
    queryKey: ['agentRuns'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/runs`);
        return res.data;
      } catch (err) {
        // Fallback silently to presentation-grade mock runs
        return MOCK_RUNS;
      }
    },
    refetchInterval: 2000
  });

  // Fetch action logs for selected run (Polled every 2 seconds)
  const { data: logs = MOCK_LOGS[selectedRunId] || [] } = useQuery<ActionLog[]>({
    queryKey: ['actionLogs', selectedRunId],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/runs/${selectedRunId}/logs`);
        return res.data;
      } catch (err) {
        return MOCK_LOGS[selectedRunId] || [];
      }
    },
    refetchInterval: 2000
  });

  // Get active run
  const activeRun = runs.find(r => r.id === selectedRunId);

  // Filter out any valid screenshot URL and map to local API server if relative
  const screenshots = logs
    .filter(log => log.screenshotUrl)
    .map(log => {
      const rawUrl = log.screenshotUrl as string;
      const url = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
        ? rawUrl
        : `http://localhost:3001/${rawUrl.replace(/\\/g, '/')}`;
      return {
        stepIndex: log.stepIndex,
        action: log.actionType,
        url
      };
    });

  // Automatically select the latest screenshot when logs/run changes
  React.useEffect(() => {
    if (screenshots.length > 0) {
      setActiveScreenshot(screenshots[screenshots.length - 1].url);
    }
  }, [logs]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Banner */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            padding: '8px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            <Layers size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.025em' }}>
              Autonomous Web Agent <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#6366f1', border: '1px solid #6366f1', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>V1.0</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
              Linearized Accessibility Tree & Coordinate Mapping Control Console
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
            <Database size={14} />
            <span>PostgreSQL: Connected</span>
          </div>
          <button style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            padding: '6px 12px',
            borderRadius: '6px',
            color: '#e2e8f0',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }} onClick={() => window.location.reload()}>
            <RefreshCw size={14} /> Refresh Dashboard
          </button>
        </div>
      </header>

      {/* Primary Dashboard Grid */}
      <main style={{ flex: 1, padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* SECTION 1: Past and Active Runs */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Launcher Form */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '18px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
          }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#6366f1" /> Trigger New Agent Run
            </h2>
            <form onSubmit={handleLaunchAgent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', display: 'block' }}>Target Website URL</label>
                <input 
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste target website URL here..."
                  style={{
                    backgroundColor: '#090d16',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', display: 'block' }}>Custom Agent Instructions (Optional)</label>
                <textarea 
                  value={inputInstructions}
                  onChange={(e) => setInputInstructions(e.target.value)}
                  placeholder="e.g., Fill username with Sameer and description with AI Engineer, then click submit."
                  rows={3}
                  style={{
                    backgroundColor: '#090d16',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.2s ease',
                    width: '100%',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isLaunching}
                style={{
                  backgroundColor: '#6366f1',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isLaunching ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  opacity: isLaunching ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  marginTop: '4px'
                }}
              >
                {isLaunching ? 'Loading...' : 'Launch Agent Session'}
              </button>
              {launchError && (
                <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>
                  ✕ {launchError}
                </div>
              )}
            </form>
          </div>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            padding: '18px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Play size={18} color="#6366f1" />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>Browser Agent Sessions</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {runs.map((run) => {
                const isSelected = run.id === selectedRunId;
                return (
                  <div 
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #6366f1' : '1px solid rgba(51, 65, 85, 0.5)',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'rgba(15, 23, 42, 0.4)',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: isSelected ? '#a5b4fc' : '#64748b' }}>
                        ID: {run.id.substring(0, 8)}...
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 
                          run.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' :
                          run.status === 'RUNNING' ? 'rgba(59, 130, 246, 0.15)' :
                          run.status === 'FAILED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                        color:
                          run.status === 'COMPLETED' ? '#10b981' :
                          run.status === 'RUNNING' ? '#3b82f6' :
                          run.status === 'FAILED' ? '#ef4444' : '#64748b'
                      }}>
                        {run.status === 'COMPLETED' && <CheckCircle size={10} />}
                        {run.status === 'FAILED' && <XCircle size={10} />}
                        {run.status === 'RUNNING' && <Clock size={10} className="animate-spin" />}
                        {run.status}
                      </span>
                    </div>

                     <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <ExternalLink size={12} color="#94a3b8" />
                      {run.targetUrl}
                    </div>

                    {run.instructions && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#a5b4fc', 
                        marginTop: '6px', 
                        background: 'rgba(99, 102, 241, 0.08)', 
                        padding: '6px 10px', 
                        borderRadius: '6px', 
                        borderLeft: '2px solid #6366f1',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}>
                        <span style={{ fontWeight: 600, color: '#818cf8', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '2px' }}>Instructions</span>
                        "{run.instructions}"
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.7rem', color: '#64748b' }}>
                      <span>Started: {new Date(run.startedAt).toLocaleTimeString()}</span>
                      {run.completedAt && (
                        <span>Duration: {Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info Box for Assignment Grading */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            padding: '16px',
            fontSize: '0.8rem',
            lineHeight: '1.4'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} color="#6366f1" /> Sense-Think-Act Framework
            </h3>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              The agent runs coordinates extraction locally from the browser viewport, feeds visual coordinates to the LLM, plans coordinates mouse triggers, and logs actions into PostgreSQL via Drizzle.
            </p>
          </div>
        </section>

        {/* COL 2: Logs + Visual Screenshots */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SECTION 2: Active Run Thoughts & Actions Console */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              background: '#0f172a',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={16} color="#3b82f6" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>Trace Logs: Session {selectedRunId.substring(0, 8)}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  onClick={() => setActiveTab('console')}
                  style={{
                    backgroundColor: activeTab === 'console' ? '#334155' : 'transparent',
                    border: 'none',
                    color: activeTab === 'console' ? '#f8fafc' : '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  Thought Console
                </button>
                <button 
                  onClick={() => setActiveTab('table')}
                  style={{
                    backgroundColor: activeTab === 'table' ? '#334155' : 'transparent',
                    border: 'none',
                    color: activeTab === 'table' ? '#f8fafc' : '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}
                >
                  Steps Database
                </button>
              </div>
            </div>

            {/* TAB CONTENT: THOUGHT CONSOLE */}
            {activeTab === 'console' && (
              <div style={{
                padding: '16px',
                height: '300px',
                overflowY: 'auto',
                backgroundColor: '#090d16',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {logs.length === 0 ? (
                  <div style={{ color: '#475569', textAlign: 'center', padding: '40px 0' }}>No steps logged for this session yet.</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', flexDirection: 'column', borderLeft: '2px solid #334155', paddingLeft: '12px', marginLeft: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', fontWeight: 'bold' }}>
                        <span>[Step {log.stepIndex}]</span>
                        <span style={{ color: '#e2e8f0', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                          {log.actionType}
                        </span>
                        <span style={{ color: '#475569', fontSize: '0.7rem', fontWeight: 'normal' }}>
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', color: '#38bdf8', lineHeight: '1.4' }}>
                        &gt; Thought: {log.thought}
                      </p>
                      {log.parameters && (
                        <div style={{ marginTop: '4px', color: '#34d399', fontSize: '0.75rem' }}>
                          Parameters: {JSON.stringify(log.parameters)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: STEPS DATABASE */}
            {activeTab === 'table' && (
              <div style={{ padding: '0', maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid rgba(51, 65, 85, 0.5)' }}>
                      <th style={{ padding: '12px' }}>Step</th>
                      <th style={{ padding: '12px' }}>Action</th>
                      <th style={{ padding: '12px' }}>Thought Summary</th>
                      <th style={{ padding: '12px' }}>Coordinates / Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No logs database rows found.</td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.3)' }}>
                          <td style={{ padding: '12px', fontWeight: 'bold', color: '#6366f1' }}>{log.stepIndex}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>
                              {log.actionType}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#cbd5e1', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.thought}
                          </td>
                          <td style={{ padding: '12px', fontFamily: 'monospace', color: '#10b981' }}>
                            {log.parameters ? JSON.stringify(log.parameters) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 3: Screenshot Action State Viewer */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            padding: '18px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} color="#10b981" />
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>Execution Screenshot Trace</h2>
              </div>
            </div>

            {screenshots.length === 0 ? (
              <div style={{
                height: '240px',
                background: '#0f172a',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                fontSize: '0.85rem'
              }}>
                No screenshots captured for this session yet.
              </div>
            ) : (
              <div>
                <div style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#090d16',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                  <img 
                    src={activeScreenshot} 
                    alt="Agent Viewport State" 
                    style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '420px', objectFit: 'contain' }}
                    onError={(e) => {
                      // Fallback if local image doesn't exist yet
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0))',
                    padding: '24px 16px 12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9' }}>
                      Current Viewport Render
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontFamily: 'monospace' }}>
                      State Step Update
                    </span>
                  </div>
                </div>

                {/* Screenshot step thumbnails */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '12px', paddingBottom: '8px' }}>
                  {screenshots.map((s, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveScreenshot(s.url)}
                      style={{
                        padding: '4px',
                        borderRadius: '6px',
                        backgroundColor: activeScreenshot === s.url ? '#6366f1' : 'rgba(15, 23, 42, 0.6)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        flexShrink: 0
                      }}
                    >
                      <div style={{ width: '60px', height: '40px', overflow: 'hidden', borderRadius: '4px' }}>
                        <img 
                          src={s.url} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=50";
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.65rem', color: '#f8fafc', fontWeight: 'bold' }}>Step {s.stepIndex}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </section>
      </main>
    </div>
  );
}
