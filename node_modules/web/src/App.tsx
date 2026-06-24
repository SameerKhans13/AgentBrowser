import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Play, Terminal, CheckCircle, XCircle, Clock,
  RefreshCw, ExternalLink, Eye, Zap, Activity,
  Globe, AlertCircle, MousePointer, Keyboard,
  ArrowDown, ChevronLeft, ChevronRight, Database,
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const API_BASE_URL = 'http://localhost:3001/api';
const PAGE_SIZE = 8;

/* ─── Types ──────────────────────────────────────────────────────────────── */
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

/* ─── Mock data ──────────────────────────────────────────────────────────── */
const MOCK_RUNS: AgentRun[] = Array.from({ length: 9 }, (_, i) => ({
  id: `e1234567-c234-4567-8901-${String(i).padStart(12, '0')}`,
  targetUrl: ['https://ui.shadcn.com/docs/forms/react-hook-form', 'https://github.com/login', 'https://vercel.com/dashboard'][i % 3],
  status: (['COMPLETED', 'RUNNING', 'FAILED', 'COMPLETED', 'PENDING', 'COMPLETED', 'RUNNING', 'FAILED', 'COMPLETED'] as const)[i],
  startedAt: new Date(Date.now() - (i + 1) * 420000).toISOString(),
  completedAt: ['COMPLETED', 'FAILED'].includes((['COMPLETED', 'RUNNING', 'FAILED', 'COMPLETED', 'PENDING', 'COMPLETED', 'RUNNING', 'FAILED', 'COMPLETED'])[i])
    ? new Date(Date.now() - (i + 1) * 420000 + 60000).toISOString() : null,
  errorLog: ['FAILED'].includes((['COMPLETED', 'RUNNING', 'FAILED', 'COMPLETED', 'PENDING', 'COMPLETED', 'RUNNING', 'FAILED', 'COMPLETED'])[i])
    ? 'Max step limit reached without finishing.' : null,
  instructions: i % 3 === 0 ? 'Fill username with Sameer Khan and submit the form.' : null,
}));

const MOCK_LOGS: ActionLog[] = [
  { id: '1', runId: MOCK_RUNS[0].id, stepIndex: 1, actionType: 'OPEN_BROWSER', thought: 'Initializing Chromium browser in non-headless mode.', parameters: null, screenshotUrl: null, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', runId: MOCK_RUNS[0].id, stepIndex: 2, actionType: 'GOTO_URL', thought: 'Navigating to target URL and waiting for DOM to settle.', parameters: { url: 'https://ui.shadcn.com/docs/forms/react-hook-form' }, screenshotUrl: 'https://picsum.photos/800/500?random=1', createdAt: new Date(Date.now() - 3590000).toISOString() },
  { id: '3', runId: MOCK_RUNS[0].id, stepIndex: 3, actionType: 'SCROLL', thought: 'Scrolling down to bring form fields into viewport.', parameters: { distance: 400 }, screenshotUrl: 'https://picsum.photos/800/500?random=2', createdAt: new Date(Date.now() - 3580000).toISOString() },
  { id: '4', runId: MOCK_RUNS[0].id, stepIndex: 4, actionType: 'CLICK', thought: 'Found username input at x=450 y=320. Focusing element.', parameters: { x: 450, y: 320, label: 'Username' }, screenshotUrl: 'https://picsum.photos/800/500?random=3', createdAt: new Date(Date.now() - 3570000).toISOString() },
  { id: '5', runId: MOCK_RUNS[0].id, stepIndex: 5, actionType: 'SEND_KEYS', thought: 'Typing "Sameer Khan" into the username field.', parameters: { text: 'Sameer Khan', label: 'Username' }, screenshotUrl: 'https://picsum.photos/800/500?random=4', createdAt: new Date(Date.now() - 3560000).toISOString() },
  { id: '6', runId: MOCK_RUNS[0].id, stepIndex: 6, actionType: 'SEND_KEYS', thought: 'Filling bio textarea with "AI engineer building GradeBench".', parameters: { text: 'AI engineer building GradeBench', label: 'Bio' }, screenshotUrl: 'https://picsum.photos/800/500?random=5', createdAt: new Date(Date.now() - 3550000).toISOString() },
  { id: '7', runId: MOCK_RUNS[0].id, stepIndex: 7, actionType: 'CLICK', thought: 'Clicking Submit button. All fields verified as filled.', parameters: { x: 520, y: 550, label: 'Submit' }, screenshotUrl: 'https://picsum.photos/800/500?random=6', createdAt: new Date(Date.now() - 3540000).toISOString() },
  { id: '8', runId: MOCK_RUNS[0].id, stepIndex: 8, actionType: 'FINISH', thought: 'Toast success message detected. Objective complete.', parameters: {}, screenshotUrl: 'https://picsum.photos/800/500?random=7', createdAt: new Date(Date.now() - 3530000).toISOString() },
  // Map some basic logs to other mock runs so clicking them displays visual elements
  { id: '9', runId: MOCK_RUNS[1].id, stepIndex: 1, actionType: 'OPEN_BROWSER', thought: 'Starting browser for GitHub login test.', parameters: null, screenshotUrl: null, createdAt: new Date(Date.now() - 100000).toISOString() },
  { id: '10', runId: MOCK_RUNS[1].id, stepIndex: 2, actionType: 'GOTO_URL', thought: 'Navigating to Github login page.', parameters: { url: 'https://github.com/login' }, screenshotUrl: 'https://picsum.photos/800/500?random=8', createdAt: new Date(Date.now() - 90000).toISOString() },
  { id: '11', runId: MOCK_RUNS[2].id, stepIndex: 1, actionType: 'OPEN_BROWSER', thought: 'Starting Vercel dashboard check.', parameters: null, screenshotUrl: null, createdAt: new Date(Date.now() - 500000).toISOString() },
  { id: '12', runId: MOCK_RUNS[2].id, stepIndex: 2, actionType: 'ERROR', thought: 'Encountered unexpected authentication block on routing.', parameters: null, screenshotUrl: 'https://picsum.photos/800/500?random=9', createdAt: new Date(Date.now() - 480000).toISOString() },
];

/* ─── Config maps ────────────────────────────────────────────────────────── */
const STATUS_CFG = {
  COMPLETED: { label: 'Completed', dot: '#e2e8f0', text: 'rgba(226,232,240,0.9)', bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)', Icon: CheckCircle },
  RUNNING:   { label: 'Running',   dot: '#ffffff', text: '#ffffff',              bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.20)', Icon: Activity    },
  PENDING:   { label: 'Pending',   dot: '#9ca3af', text: '#9ca3af',              bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', Icon: Clock       },
  FAILED:    { label: 'Failed',    dot: '#6b7280', text: '#6b7280',              bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', Icon: XCircle     },
};

const ACTION_CFG: Record<string, { label: string; Icon: React.FC<any> }> = {
  OPEN_BROWSER: { label: 'OPEN_BROWSER', Icon: Globe        },
  GOTO_URL:     { label: 'GOTO_URL',     Icon: ExternalLink },
  CLICK:        { label: 'CLICK',        Icon: MousePointer },
  SEND_KEYS:    { label: 'SEND_KEYS',    Icon: Keyboard     },
  SCROLL:       { label: 'SCROLL',       Icon: ArrowDown    },
  DOUBLE_CLICK: { label: 'DBL_CLICK',   Icon: MousePointer },
  FINISH:       { label: 'FINISH',       Icon: CheckCircle  },
  ERROR:        { label: 'ERROR',        Icon: AlertCircle  },
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtDuration(start: string, end: string | null) {
  if (!end) return null;
  const s = Math.round((+new Date(end) - +new Date(start)) / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - +new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
function truncUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/* ─── Styled atoms ───────────────────────────────────────────────────────── */
const glass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  ...extra,
});

function StatusBadge({ status }: { status: AgentRun['status'] }) {
  const c = STATUS_CFG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 99,
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: '0.65rem', fontWeight: 600, color: c.text, letterSpacing: '0.03em',
    }}>
      {status === 'RUNNING' ? (
        <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: c.dot, animation: 'abPulse 1.5s ease-out infinite' }} />
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, position: 'relative' }} />
        </span>
      ) : (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block', opacity: 0.7 }} />
      )}
      {c.label}
    </span>
  );
}

function ActionChip({ type }: { type: string }) {
  const a = ACTION_CFG[type] ?? { label: type, Icon: Zap };
  const Icon = a.Icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 5,
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)',
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em',
    }}>
      <Icon size={9} />
      {a.label}
    </span>
  );
}

/* ─── App ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [selectedId, setSelectedId] = useState<string>(MOCK_RUNS[0].id);
  const [activeTab, setActiveTab] = useState<'console' | 'table'>('console');
  const [activeShot, setActiveShot] = useState<string>('');
  const [url, setUrl] = useState('https://ui.shadcn.com/docs/forms/react-hook-form');
  const [instructions, setInstructions] = useState('');
  const [launching, setLaunching] = useState(false);
  const [launchErr, setLaunchErr] = useState<string | null>(null);
  const [launchOk, setLaunchOk] = useState(false);
  const [page, setPage] = useState(1);
  const [cleanSteps, setCleanSteps] = useState(true);
  const [isTempMode, setIsTempMode] = useState(false);
  const consoleEl = useRef<HTMLDivElement>(null);

  /* queries */
  const { data: qRuns, refetch } = useQuery<AgentRun[]>({
    queryKey: ['runs'],
    queryFn: async () => { 
      try { 
        return (await axios.get(`${API_BASE_URL}/runs`)).data; 
      } catch { 
        return []; 
      } 
    },
    refetchInterval: 2000,
    enabled: !isTempMode,
  });
  const runs = (qRuns && qRuns.length > 0 && !isTempMode) ? qRuns : MOCK_RUNS;

  const { data: qLogs } = useQuery<ActionLog[]>({
    queryKey: ['logs', selectedId],
    queryFn: async () => { 
      try { 
        return (await axios.get(`${API_BASE_URL}/runs/${selectedId}/logs`)).data; 
      } catch { 
        return []; 
      } 
    },
    refetchInterval: 2000,
    enabled: !!selectedId && !isTempMode,
  });
  const logs = (qLogs && qLogs.length > 0 && !isTempMode) ? qLogs : MOCK_LOGS.filter(l => l.runId === selectedId);

  /* pagination */
  const totalPages = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const pageRuns = runs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* effects */
  useEffect(() => {
    if (isTempMode) {
      setSelectedId(MOCK_RUNS[0].id);
      setPage(1);
    } else if (qRuns && qRuns.length > 0) {
      if (!qRuns.some(r => r.id === selectedId)) {
        setSelectedId(qRuns[0].id);
        setPage(1);
      }
    }
  }, [qRuns, selectedId, isTempMode]);

  useEffect(() => {
    if (consoleEl.current) consoleEl.current.scrollTop = consoleEl.current.scrollHeight;
  }, [logs]);

  const screenshots = logs
    .filter(l => l.screenshotUrl)
    .map(l => {
      const raw = l.screenshotUrl!;
      return {
        stepIndex: l.stepIndex,
        action: l.actionType,
        url: raw.startsWith('http') ? raw : `http://localhost:3001/${raw.replace(/\\/g, '/')}`,
      };
    });

  const screenshotsKey = JSON.stringify(screenshots.map(s => s.url));
  useEffect(() => {
    if (screenshots.length) {
      setActiveShot(screenshots[screenshots.length - 1].url);
    } else {
      setActiveShot('');
    }
  }, [screenshotsKey]);

  const activeRun = runs.find(r => r.id === selectedId);

  /* launch */
  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLaunching(true); setLaunchErr(null); setLaunchOk(false);
    try {
      // Direct API to clean screenshots dynamically
      const res = await axios.post(`${API_BASE_URL}/run`, { targetUrl: url, instructions, cleanSteps });
      
      // If temporary mode is active, simulate pushing run data locally
      if (isTempMode) {
        const newRunId = res.data.id;
        const fakeRun: AgentRun = {
          id: newRunId,
          targetUrl: url,
          status: 'RUNNING',
          startedAt: new Date().toISOString(),
          completedAt: null,
          errorLog: null,
          instructions: instructions || null,
        };
        MOCK_RUNS.unshift(fakeRun);
        setSelectedId(newRunId);
        
        // Push initial open browser mock logs
        MOCK_LOGS.push({
          id: Math.random().toString(),
          runId: newRunId,
          stepIndex: 1,
          actionType: 'OPEN_BROWSER',
          thought: 'Initializing temporary sandbox browser engine.',
          parameters: null,
          screenshotUrl: null,
          createdAt: new Date().toISOString(),
        });
      } else {
        setSelectedId(res.data.id);
      }
      
      setLaunchOk(true);
      setPage(1);
      setTimeout(() => setLaunchOk(false), 3000);
      refetch();
    } catch (err: any) {
      setLaunchErr(err.response?.data?.error || err.message || 'Failed to start session');
    } finally { setLaunching(false); }
  };

  /* ── render ── */
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      fontFamily: "'Inter', sans-serif",
      background: '#080808',
      color: '#e2e8f0',
      overflow: 'hidden',
    }}>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        body {
            background-color: #0a0a0a;
            color: #e5e2e1;
            overflow: hidden;
            font-family: 'Inter', sans-serif;
        }

        .glass-panel {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
            backdrop-filter: blur(20px);
            border: 0.5px solid rgba(255, 255, 255, 0.08);
        }

        .custom-scrollbar::-webkit-scrollbar {
            width: 3px;
            height: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
        }

        .terminal-text {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            line-height: 1.6;
        }

        @keyframes pulse-status {
            0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.2); }
            70% { box-shadow: 0 0 0 4px rgba(255, 255, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        .status-pulse {
            animation: pulse-status 2s infinite;
        }

        .split-pane-border {
            border-right: 0.5px solid rgba(255, 255, 255, 0.08);
        }

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        
        input, textarea {
            background: rgba(255, 255, 255, 0.03) !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
        }
        input:focus, textarea:focus {
            border-color: rgba(255, 255, 255, 0.3) !important;
            ring-color: transparent !important;
        }
        .ab-session-card { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .ab-session-card:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.2) !important; }
        .ab-tab-btn { transition: all 0.2s ease; }
        .ab-tab-btn:hover { color: #fff !important; background: rgba(255,255,255,0.05) !important; }
        .ab-thumb { transition: all 0.2s ease; }
        .ab-thumb:hover { opacity: 0.8 !important; transform: translateY(-1px); }
        .ab-pg-btn { transition: all 0.2s ease; }
        .ab-pg-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08) !important; color: #fff !important; border-color: rgba(255,255,255,0.2) !important; }
        .ab-launch-btn { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .ab-launch-btn:not(:disabled):hover { background: #ffffff !important; color: #000000 !important; border-color: #ffffff !important; }
      `}</style>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="h-14 flex items-center justify-between px-6 glass-panel border-b border-white/5 z-50 shrink-0" style={{
        ...glass({ borderLeft: 'none', borderRight: 'none', borderTop: 'none', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)' }),
        height: 56, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.4)' }}>
              Workspace <span style={{ fontWeight: 500, fontStyle: 'italic', textTransform: 'none' }}>v2.4</span>
            </div>
          </div>
        </div>

        {/* Info pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setIsTempMode(!isTempMode)}
            style={{
              padding: '4px 12px', borderRadius: 99,
              background: isTempMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${isTempMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              color: isTempMode ? '#f87171' : 'rgba(255,255,255,0.7)',
              transition: 'all 0.2s ease',
            }}
            title="Toggle Temporary in-memory session. Reloading will lose this session's logs."
          >
            <span style={{ fontSize: '10px' }}>💬</span>
            <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono' }}>
              {isTempMode ? 'Temporary Mode (Active)' : 'Database Mode'}
            </span>
          </button>

          {isTempMode && (
            <span style={{
              fontSize: '9px', color: '#f87171', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.05em',
              animation: 'pulse-status 2s infinite',
            }}>
              ⚠️ Data lost on reload
            </span>
          )}

          <div style={{
            padding: '4px 12px', borderRadius: 99,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span className="status-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono' }}>
              PostgreSQL Connected
            </span>
          </div>
          <div style={{
            padding: '4px 12px', borderRadius: 99,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono' }}>
              {runs.filter(r => r.status === 'RUNNING').length} Active Instances
            </span>
          </div>
        </div>

        {/* Right HUD Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => refetch()} className="ab-pg-btn" style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.6)'
          }}>
            <RefreshCw size={16} />
          </button>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#e5e2e1', lineHeight: 1 }}>Developer Pro</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', tracking: '0.1em', marginTop: 3 }}>Active Plan</div>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: 8, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)'
            }}>
              👤
            </div>
          </div>
        </div>
      </header>

      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '350px 1.2fr 1fr', overflow: 'hidden', minHeight: 0 }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside style={{
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: '#0a0a0a',
          overflow: 'hidden', minHeight: 0,
          width: 350,
        }}>

          {/* Launch form */}
          <div style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            <h2 style={{
              fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16
            }}>
              <span style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%' }}></span>
              NEW SESSION
            </h2>
            <form onSubmit={handleLaunch} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
              <GlassInput
                label="Target URL"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
                required
              />
              <GlassInput
                label="Global Instructions"
                as="textarea"
                rows={4}
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="Define behavior, constraints..."
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 8px' }}>
                <input
                  id="ab-clean-steps"
                  type="checkbox"
                  checked={cleanSteps}
                  onChange={e => setCleanSteps(e.target.checked)}
                  style={{
                    width: 14, height: 14, cursor: 'pointer', borderRadius: 4,
                    accentColor: '#ffffff', outline: 'none', margin: 0,
                  }}
                />
                <label
                  htmlFor="ab-clean-steps"
                  style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono', cursor: 'pointer', userSelect: 'none' }}
                >
                  Clean intermediate step screenshots
                </label>
              </div>

              <button
                type="submit"
                disabled={launching}
                className="ab-launch-btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '12px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)',
                  background: launchOk
                    ? '#22c55e'
                    : launching
                      ? 'rgba(255,255,255,0.06)'
                      : '#ffffff',
                  color: launchOk ? '#fff' : launching ? 'rgba(255,255,255,0.85)' : '#000000',
                  fontSize: '11px', fontWeight: 700, cursor: launching ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.15em',
                  transition: 'all 0.2s ease',
                }}
              >
                {launching
                  ? <><Spinner /> Launching…</>
                  : launchOk
                    ? <><CheckCircle size={13} /> Active!</>
                    : <>Launch Engine</>
                }
              </button>

              {launchErr && (
                <div style={{
                  display: 'flex', gap: 6, padding: '8px 10px', borderRadius: 6, alignItems: 'flex-start',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', lineHeight: 1.4,
                }}>
                  <AlertCircle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                  {launchErr}
                </div>
              )}
            </form>
          </div>

          {/* Sessions list header */}
          <div style={{ padding: '24px 20px 8px', flexShrink: 0 }}>
            <h2 style={{
              fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.15em', textTransform: 'uppercase'
            }}>
              Recent Sessions
            </h2>
          </div>

          {/* Sessions list — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px', minHeight: 0 }} className="custom-scrollbar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 8 }}>
              {pageRuns.map(run => {
                const sel = run.id === selectedId;
                const dur = fmtDuration(run.startedAt, run.completedAt) || '00:00m';
                
                // Style variables based on status
                let isFailed = run.status === 'FAILED';
                let cardBg = isFailed ? 'rgba(239, 68, 68, 0.05)' : sel ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)';
                let cardBorder = isFailed ? '1px solid rgba(239, 68, 68, 0.15)' : sel ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)';
                let idColor = isFailed ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.3)';

                return (
                  <div
                    key={run.id}
                    className="ab-session-card"
                    onClick={() => setSelectedId(run.id)}
                    style={{
                      padding: 16, borderRadius: 8, cursor: 'pointer',
                      background: cardBg,
                      border: cardBorder,
                      backdropFilter: 'blur(12px)',
                      animation: 'abFadeUp 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{
                        fontSize: '10px', color: idColor,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        #{run.id.substring(0, 8)}
                      </span>
                      <StatusBadge status={run.status} />
                    </div>

                    <div style={{
                      fontSize: '13px', color: sel ? '#ffffff' : 'rgba(255,255,255,0.6)',
                      fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: 8
                    }}>
                      {truncUrl(run.targetUrl)}
                    </div>

                    {run.instructions && (
                      <div style={{
                        marginTop: 4, marginBottom: 8, padding: '4px 8px', borderRadius: 4,
                        background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '10px', color: 'rgba(255,255,255,0.3)',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', lineHeight: 1.4,
                      } as React.CSSProperties}>
                        {run.instructions}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>
                      <span>{dur}</span>
                      <span>{timeAgo(run.startedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Footer */}
          <footer style={{
            padding: 16,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono', fontSize: '9px', letterSpacing: '0.15em',
            background: 'rgba(0,0,0,0.1)',
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ background: 'none', border: 'none', color: page === 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              className="hover:text-white transition-colors"
            >
              PREV
            </button>
            <div style={{ display: 'flex', gap: 16 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <span
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    color: p === page ? '#ffffff' : 'rgba(255,255,255,0.3)',
                    fontWeight: p === page ? 'bold' : 'normal',
                    cursor: 'pointer',
                  }}
                  className="hover:text-white transition-colors"
                >
                  {p}
                </span>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ background: 'none', border: 'none', color: page === totalPages ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              className="hover:text-white transition-colors"
            >
              NEXT
            </button>
          </footer>

          {/* Sense-Think-Act */}
          <div style={{
            padding: '10px 14px 12px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
              {['Sense', 'Think', 'Act'].map(s => (
                <div key={s} style={{
                  flex: 1, textAlign: 'center', padding: '5px 0',
                  borderRadius: 6, fontSize: '0.62rem', fontWeight: 600,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
                }}>{s}</div>
              ))}
            </div>
            <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}>
              Gemini 2.5 Flash · Playwright · Drizzle · PostgreSQL
            </div>
          </div>
        </aside>

        {/* ── CONSOLE / TABLE ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden', minHeight: 0,
          background: 'rgba(0,0,0,0.35)',
        }}>
          {/* Panel header */}
          <div style={{
            ...glass({ borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0 }),
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', height: 44, flexShrink: 0,
            background: 'rgba(255,255,255,0.01)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={13} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 650, color: '#ffffff', letterSpacing: '0.01em' }}>Trace Logs</span>
              {activeRun && (
                <code style={{
                  fontSize: '0.62rem', padding: '2px 7px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)',
                  fontFamily: "'JetBrains Mono', monospace",
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  #{selectedId.substring(0, 8)}
                </code>
              )}
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['console', 'table'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="ab-tab-btn"
                  style={{
                    padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: activeTab === tab ? 'rgba(255,255,255,0.09)' : 'transparent',
                    color: activeTab === tab ? '#ffffff' : 'rgba(255,255,255,0.4)',
                    fontSize: '0.7rem', fontWeight: activeTab === tab ? 600 : 400,
                  }}
                >
                  {tab === 'console' ? 'Console' : 'Table'}
                </button>
              ))}
            </div>
          </div>

          {/* Console content */}
          {activeTab === 'console' && (
            <div
              ref={consoleEl}
              style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                display: 'flex', flexDirection: 'column', gap: 10,
                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
                minHeight: 0,
                background: '#040404',
              }}
            >
              {logs.length === 0 ? (
                <EmptyState icon={<Terminal size={20} color="rgba(255,255,255,0.1)" />} text="No logs yet for this session." />
              ) : logs.map(log => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex', gap: 16,
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                    animation: 'abFadeUp 0.2s ease',
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.2)', width: 64, shrink: 0, selectNone: 'true', fontSize: '10px' } as React.CSSProperties}>
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                        [STEP_{log.stepIndex}]
                      </span>
                      <ActionChip type={log.actionType} />
                    </div>
                    
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 0, fontSize: '11px' }}>
                      {log.thought}
                    </p>

                    {log.parameters && Object.keys(log.parameters).length > 0 && (
                      <div style={{
                        marginTop: 6, padding: '4px 8px', borderRadius: 4,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.3)', fontSize: '10px', lineHeight: 1.4,
                        wordBreak: 'break-all',
                      }}>
                        <code>{JSON.stringify(log.parameters)}</code>
                      </div>
                    )}

                    {/* System Thought callout representation for key browser events */}
                    {['GOTO_URL', 'CLICK', 'SEND_KEYS'].includes(log.actionType) && (
                      <div style={{
                        marginTop: 10, padding: 12,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.005) 100%)',
                        borderLeft: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            System Thought
                          </span>
                        </div>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '10.5px', fontStyle: 'italic', lineHeight: 1.5 }}>
                          Analyzing selectors and waiting for network idle state to ensure element stable transition.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table content */}
          {activeTab === 'table' && (
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(8px)', zIndex: 2 }}>
                  <tr>
                    {['Step', 'Action', 'Thought', 'Params'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                        fontSize: '0.62rem', color: 'rgba(255,255,255,0.25)',
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontFamily: 'Inter, sans-serif' }}>No rows found.</td></tr>
                  ) : logs.map((log, i) => (
                    <tr key={log.id} style={{
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <td style={{ padding: '9px 14px', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                        {log.stepIndex}
                      </td>
                      <td style={{ padding: '9px 14px' }}><ActionChip type={log.actionType} /></td>
                      <td style={{ padding: '9px 14px', color: 'rgba(255,255,255,0.4)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.thought}
                      </td>
                      <td style={{ padding: '9px 14px', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.parameters ? JSON.stringify(log.parameters) : <span style={{ color: 'rgba(255,255,255,0.1)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer bar */}
          <div style={{
            height: 34, flexShrink: 0, padding: '0 14px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)' }}>
              {logs.length} step{logs.length !== 1 ? 's' : ''}
            </span>
            {activeRun && <StatusBadge status={activeRun.status} />}
          </div>
        </div>

        {/* ── VIEWPORT PANEL ───────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', minHeight: 0,
          background: 'rgba(0,0,0,0.5)',
        }}>
          {/* Panel header */}
          <div style={{
            ...glass({ borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0 }),
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', height: 44, flexShrink: 0,
            background: 'rgba(255,255,255,0.01)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={13} color="rgba(255,255,255,0.7)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 650, color: '#ffffff', letterSpacing: '0.01em' }}>Viewport Trace</span>
            </div>
            <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>
              {screenshots.length} frame{screenshots.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Screenshot viewer — scrollable area takes flex remaining */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0d0d0d' }}>
            {screenshots.length === 0 ? (
              <EmptyState icon={<Eye size={22} color="rgba(255,255,255,0.08)" />} text="Launch a session to see live captures." />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                borderRadius: 8, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                position: 'relative',
                background: '#0a0a0a',
              }}>
                {/* Radial Grid Overlay */}
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
                
                <img
                  src={activeShot}
                  alt="Agent viewport"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'; }}
                />

                {/* Floating HUD elements */}
                <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{
                    padding: '6px 12px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono' }}>🎯</span>
                    <span style={{ fontSize: '10px', color: '#fff', fontFamily: 'JetBrains Mono' }}>X: 640 Y: 320</span>
                  </div>
                  <div style={{
                    padding: '6px 12px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono' }}>🖱</span>
                    <span style={{ fontSize: '10px', color: '#fff', fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scroll Event</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {screenshots.length > 0 && (
            <div style={{
              flexShrink: 0, padding: '8px 14px 10px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(0,0,0,0.4)',
            }}>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                {screenshots.map((s, i) => {
                  const isActive = activeShot === s.url;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveShot(s.url)}
                      className="ab-thumb"
                      title={`Step ${s.stepIndex}: ${s.action}`}
                      style={{
                        flexShrink: 0, padding: 0, border: 'none', cursor: 'pointer',
                        borderRadius: 7, background: 'transparent',
                        outline: isActive ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                        outlineOffset: 2,
                        opacity: isActive ? 1 : 0.4,
                        transition: 'opacity 0.15s, outline-color 0.15s',
                      }}
                    >
                      <div style={{ width: 60, height: 38, borderRadius: 5, overflow: 'hidden', background: '#04080f' }}>
                        <img
                          src={s.url} alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=40'; }}
                        />
                      </div>
                      <div style={{
                        marginTop: 3, fontSize: '0.58rem', textAlign: 'center',
                        color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
                        fontFamily: "'JetBrains Mono', monospace", fontWeight: isActive ? 600 : 400,
                      }}>S{s.stepIndex}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Small reusable components ──────────────────────────────────────────── */

function Pill({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 99,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500,
    }}>
      {icon}
      {label}
      {sub && <span style={{ color: 'rgba(255,255,255,0.2)' }}>· {sub}</span>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 3, height: 12, borderRadius: 99, background: 'rgba(255,255,255,0.25)' }} />
      <span style={{
        fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase', letterSpacing: '0.09em',
      }}>
        {children}
      </span>
    </div>
  );
}

function GlassInput({
  label, as, icon, value, onChange, placeholder, required, type, rows
}: {
  label: string;
  as?: 'textarea';
  icon?: React.ReactNode;
  value?: string;
  onChange?: (e: any) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  rows?: number;
}) {
  const shared: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#e5e2e1',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
    resize: 'none' as const,
    boxSizing: 'border-box',
  };
  return (
    <div>
      <label style={{ display: 'block', fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {as === 'textarea'
          ? <textarea value={value} onChange={onChange} placeholder={placeholder} required={required} rows={rows} style={shared} onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
          : <input value={value} onChange={onChange} placeholder={placeholder} required={required} type={type} style={shared} onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
        }
      </div>
    </div>
  );
}

function Spinner() {
  return <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.7)', borderRadius: '50%', display: 'inline-block', animation: 'abSpin 0.7s linear infinite' }} />;
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: 0.5 }}>
      {icon}
      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>{text}</span>
    </div>
  );
}
