import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Play, Terminal, CheckCircle, XCircle, Clock,
  RefreshCw, ExternalLink, Eye, Zap, Activity,
  Globe, AlertCircle, MousePointer, Keyboard,
  ArrowDown, ChevronLeft, ChevronRight, Database,
  Send, Layers, Monitor, Settings, MoreHorizontal,
  Search, Filter, Maximize2,
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────────────────────── */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const PAGE_SIZE = 6;

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
  { id: '9', runId: MOCK_RUNS[1].id, stepIndex: 1, actionType: 'OPEN_BROWSER', thought: 'Starting browser for GitHub login test.', parameters: null, screenshotUrl: null, createdAt: new Date(Date.now() - 100000).toISOString() },
  { id: '10', runId: MOCK_RUNS[1].id, stepIndex: 2, actionType: 'GOTO_URL', thought: 'Navigating to Github login page.', parameters: { url: 'https://github.com/login' }, screenshotUrl: 'https://picsum.photos/800/500?random=8', createdAt: new Date(Date.now() - 90000).toISOString() },
  { id: '11', runId: MOCK_RUNS[2].id, stepIndex: 1, actionType: 'OPEN_BROWSER', thought: 'Starting Vercel dashboard check.', parameters: null, screenshotUrl: null, createdAt: new Date(Date.now() - 500000).toISOString() },
  { id: '12', runId: MOCK_RUNS[2].id, stepIndex: 2, actionType: 'ERROR', thought: 'Encountered unexpected authentication block on routing.', parameters: null, screenshotUrl: 'https://picsum.photos/800/500?random=9', createdAt: new Date(Date.now() - 480000).toISOString() },
];

/* ─── Status & action config ─────────────────────────────────────────────── */
const STATUS_CFG = {
  COMPLETED: { label: 'Completed', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)', Icon: CheckCircle },
  RUNNING:   { label: 'Running',   color: '#fff',    bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)', Icon: Activity },
  PENDING:   { label: 'Queued',    color: '#737373', bg: 'rgba(115,115,115,0.08)', border: 'rgba(115,115,115,0.2)', Icon: Clock },
  FAILED:    { label: 'Failed',    color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', Icon: XCircle },
};

const ACTION_CFG: Record<string, { label: string; Icon: React.FC<any>; color: string }> = {
  OPEN_BROWSER: { label: 'OPEN',      Icon: Globe,        color: '#a78bfa' },
  GOTO_URL:     { label: 'NAVIGATE',   Icon: ExternalLink, color: '#60a5fa' },
  CLICK:        { label: 'CLICK',      Icon: MousePointer, color: '#34d399' },
  SEND_KEYS:    { label: 'TYPE',       Icon: Keyboard,     color: '#fbbf24' },
  SCROLL:       { label: 'SCROLL',     Icon: ArrowDown,    color: '#818cf8' },
  DOUBLE_CLICK: { label: 'DBL_CLICK',  Icon: MousePointer, color: '#f472b6' },
  FINISH:       { label: 'DONE',       Icon: CheckCircle,  color: '#4ade80' },
  ERROR:        { label: 'ERROR',      Icon: AlertCircle,  color: '#f87171' },
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
  try {
    const u = new URL(url);
    return u.hostname + (u.pathname !== '/' ? u.pathname : '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   APP
   ════════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [selectedId, setSelectedId] = useState<string>(MOCK_RUNS[0].id);
  const [activeTab, setActiveTab] = useState<'timeline' | 'table'>('timeline');
  const [activeShot, setActiveShot] = useState<string>('');
  const [url, setUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [launching, setLaunching] = useState(false);
  const [launchErr, setLaunchErr] = useState<string | null>(null);
  const [launchOk, setLaunchOk] = useState(false);
  const [page, setPage] = useState(1);
  const [cleanSteps, setCleanSteps] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
    refetchInterval: 3000,
  });
  const runs = (qRuns && qRuns.length > 0) ? qRuns : MOCK_RUNS;

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
    enabled: !!selectedId,
  });
  const logs = (qLogs && qLogs.length > 0) ? qLogs : MOCK_LOGS.filter(l => l.runId === selectedId);

  /* pagination */
  const totalPages = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const pageRuns = runs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* effects */
  useEffect(() => {
    if (qRuns && qRuns.length > 0) {
      if (!qRuns.some(r => r.id === selectedId)) {
        setSelectedId(qRuns[0].id);
        setPage(1);
      }
    }
  }, [qRuns, selectedId]);

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
        url: raw.startsWith('http') ? raw : `${API_BASE_URL.replace('/api', '')}/${raw.replace(/\\/g, '/')}`,
      };
    });

  const screenshotsKey = JSON.stringify(screenshots.map(s => s.url));
  useEffect(() => {
    if (screenshots.length) setActiveShot(screenshots[screenshots.length - 1].url);
    else setActiveShot('');
  }, [screenshotsKey]);

  const activeRun = runs.find(r => r.id === selectedId);

  /* launch */
  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLaunching(true); setLaunchErr(null); setLaunchOk(false);
    try {
      const res = await axios.post(`${API_BASE_URL}/run`, { targetUrl: url, instructions, cleanSteps });
      setSelectedId(res.data.id);
      setLaunchOk(true);
      setPage(1);
      setShowForm(false);
      setTimeout(() => setLaunchOk(false), 3000);
      refetch();
    } catch (err: any) {
      setLaunchErr(err.response?.data?.error || err.message || 'Failed to start session');
    } finally { setLaunching(false); }
  };

  const runningCount = runs.filter(r => r.status === 'RUNNING').length;

  /* ── render ── */
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      fontFamily: "'Inter', sans-serif",
      background: '#000',
      color: '#e5e5e5',
      overflow: 'hidden',
    }}>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; color: #e5e5e5; overflow: hidden; font-family: 'Inter', sans-serif; }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }

        .fade-in { animation: fadeIn 0.25s ease-out; }
        .hover-row { transition: background 0.15s ease; }
        .hover-row:hover { background: rgba(255,255,255,0.03) !important; }
        .btn-ghost { background: none; border: 1px solid rgba(255,255,255,0.1); color: #999; cursor: pointer; transition: all 0.15s ease; border-radius: 6px; }
        .btn-ghost:hover { background: rgba(255,255,255,0.05); color: #fff; border-color: rgba(255,255,255,0.2); }
        .btn-ghost:disabled { opacity: 0.3; cursor: not-allowed; }
        .session-item { transition: all 0.15s ease; cursor: pointer; }
        .session-item:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Monitor size={14} color="#000" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              AgentBrain
            </span>
          </div>

          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />

          {/* Status indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: '#4ade80',
                display: 'inline-block', animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: 10, fontWeight: 500, color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>
                Connected
              </span>
            </div>
            {runningCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <Activity size={10} color="#fff" />
                <span style={{ fontSize: 10, fontWeight: 500, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
                  {runningCount} active
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => refetch()} className="btn-ghost" style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '6px 14px', borderRadius: 6,
              background: '#fff', color: '#000', border: 'none',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <Play size={11} fill="#000" />
            New Session
          </button>
        </div>
      </header>

      {/* ═══ LAUNCH FORM OVERLAY ═════════════════════════════════════════════ */}
      {showForm && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          animation: 'slideDown 0.2s ease-out',
          overflow: 'hidden',
        }}>
          <form onSubmit={handleLaunch} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', maxWidth: 900 }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: '#666', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Target URL
              </label>
              <input
                value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
                required type="url"
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: '#fff', fontSize: 13, outline: 'none',
                  transition: 'border-color 0.15s',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div style={{ flex: 3 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 500, color: '#666', marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Instructions
              </label>
              <input
                value={instructions} onChange={e => setInstructions(e.target.value)}
                placeholder="Fill the form, click submit..."
                style={{
                  width: '100%', padding: '9px 12px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, color: '#fff', fontSize: 13, outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox" checked={cleanSteps}
                  onChange={e => setCleanSteps(e.target.checked)}
                  style={{ accentColor: '#fff', width: 13, height: 13 }}
                />
                <span style={{ fontSize: 10, color: '#666' }}>Clean steps</span>
              </label>
            </div>
            <button
              type="submit" disabled={launching}
              style={{
                padding: '9px 20px', borderRadius: 6,
                background: launchOk ? '#4ade80' : '#fff',
                color: launchOk ? '#fff' : '#000',
                border: 'none', fontSize: 12, fontWeight: 600,
                cursor: launching ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                opacity: launching ? 0.6 : 1,
              }}
            >
              {launching ? <><Spinner /> Starting...</> : launchOk ? <><CheckCircle size={12} /> Launched</> : <><Send size={11} /> Launch</>}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-ghost"
              style={{ padding: '9px 12px', fontSize: 11, color: '#666' }}
            >
              Cancel
            </button>
          </form>
          {launchErr && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontSize: 11 }}>
              <AlertCircle size={12} /> {launchErr}
            </div>
          )}
        </div>
      )}

      {/* ═══ MAIN BODY ═══════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* ─── LEFT: SESSION LIST ─────────────────────────────────────────── */}
        <aside style={{
          width: 300, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: '#000',
          overflow: 'hidden',
        }}>
          {/* Section header */}
          <div style={{
            padding: '16px 16px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Sessions
            </span>
            <span style={{ fontSize: 10, color: '#444', fontFamily: "'JetBrains Mono', monospace" }}>
              {runs.length} total
            </span>
          </div>

          {/* Session list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px', minHeight: 0 }}>
            {pageRuns.map(run => {
              const sel = run.id === selectedId;
              const st = STATUS_CFG[run.status];
              const dur = fmtDuration(run.startedAt, run.completedAt);

              return (
                <div
                  key={run.id}
                  className="session-item fade-in"
                  onClick={() => setSelectedId(run.id)}
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    marginBottom: 2,
                    background: sel ? 'rgba(255,255,255,0.06)' : 'transparent',
                    borderLeft: sel ? '2px solid #fff' : '2px solid transparent',
                  }}
                >
                  {/* Top row: status + time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <StatusBadge status={run.status} />
                    <span style={{ fontSize: 9, color: '#555', fontFamily: "'JetBrains Mono', monospace" }}>
                      {timeAgo(run.startedAt)}
                    </span>
                  </div>

                  {/* URL */}
                  <div style={{
                    fontSize: 12, color: sel ? '#fff' : '#999',
                    fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 4,
                  }}>
                    {truncUrl(run.targetUrl)}
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: '#444' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      #{run.id.substring(0, 8)}
                    </span>
                    {dur && (
                      <>
                        <span style={{ color: '#333' }}>·</span>
                        <span>{dur}</span>
                      </>
                    )}
                  </div>

                  {/* Instructions preview */}
                  {run.instructions && (
                    <div style={{
                      marginTop: 6, padding: '4px 8px', borderRadius: 4,
                      background: 'rgba(255,255,255,0.02)',
                      borderLeft: '1px solid rgba(255,255,255,0.08)',
                      fontSize: 10, color: '#555', lineHeight: 1.4,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                    } as React.CSSProperties}>
                      {run.instructions}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: 10 }}
              >
                <ChevronLeft size={12} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 24, height: 24, borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: p === page ? '#fff' : 'transparent',
                    color: p === page ? '#000' : '#555',
                    border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-ghost"
                style={{ padding: '4px 8px', fontSize: 10 }}
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            fontSize: 9, color: '#333', fontFamily: "'JetBrains Mono', monospace",
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Layers size={10} color="#333" />
            Gemini 2.5 · Playwright · PostgreSQL
          </div>
        </aside>

        {/* ─── RIGHT: MAIN CONTENT AREA ──────────────────────────────────── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

          {/* Content split: Viewport + Logs */}
          <div style={{ flex: 1, display: 'grid', gridTemplateRows: '1fr 1fr', overflow: 'hidden', minHeight: 0 }}>

            {/* ─── TOP: VIEWPORT ─────────────────────────────────────────── */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              {/* Viewport header */}
              <div style={{
                height: 38, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: 'rgba(255,255,255,0.01)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={12} color="#666" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#999' }}>Browser Viewport</span>
                  {activeRun && (
                    <span style={{
                      fontSize: 9, padding: '2px 6px', borderRadius: 3,
                      background: 'rgba(255,255,255,0.04)', color: '#555',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {screenshots.length} frames
                    </span>
                  )}
                </div>
                {activeRun && <StatusBadge status={activeRun.status} />}
              </div>

              {/* Viewport image */}
              <div style={{
                flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#0a0a0a',
              }}>
                {screenshots.length === 0 ? (
                  <EmptyState icon={<Monitor size={28} color="rgba(255,255,255,0.06)" />} text="No viewport captures yet" />
                ) : (
                  <img
                    src={activeShot}
                    alt="Agent viewport"
                    style={{
                      maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                      borderRadius: 4,
                    }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>

              {/* Thumbnail strip */}
              {screenshots.length > 0 && (
                <div style={{
                  flexShrink: 0, padding: '6px 12px',
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', gap: 4, overflowX: 'auto',
                  background: 'rgba(255,255,255,0.01)',
                }}>
                  {screenshots.map((s, i) => {
                    const isActive = activeShot === s.url;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveShot(s.url)}
                        style={{
                          flexShrink: 0, padding: 0, background: 'transparent', cursor: 'pointer',
                          borderRadius: 4, overflow: 'hidden',
                          border: isActive ? '1.5px solid #fff' : '1.5px solid rgba(255,255,255,0.08)',
                          opacity: isActive ? 1 : 0.4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ width: 48, height: 30, overflow: 'hidden', background: '#111' }}>
                          <img
                            src={s.url} alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── BOTTOM: TRACE LOGS ────────────────────────────────────── */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden', minHeight: 0,
            }}>
              {/* Log header */}
              <div style={{
                height: 38, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: 'rgba(255,255,255,0.01)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={12} color="#666" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#999' }}>Execution Trace</span>
                  <span style={{
                    fontSize: 9, padding: '2px 6px', borderRadius: 3,
                    background: 'rgba(255,255,255,0.04)', color: '#555',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {logs.length} steps
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {(['timeline', 'table'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '4px 10px', borderRadius: 4,
                        background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: activeTab === tab ? '#fff' : '#555',
                        border: 'none', cursor: 'pointer',
                        fontSize: 10, fontWeight: 500, transition: 'all 0.15s ease',
                      }}
                    >
                      {tab === 'timeline' ? 'Timeline' : 'Table'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Log content */}
              {activeTab === 'timeline' ? (
                <div
                  ref={consoleEl}
                  style={{
                    flex: 1, overflowY: 'auto', padding: '12px 16px', minHeight: 0,
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}
                >
                  {logs.length === 0 ? (
                    <EmptyState icon={<Terminal size={22} color="rgba(255,255,255,0.06)" />} text="No trace logs for this session" />
                  ) : logs.map(log => {
                    const acfg = ACTION_CFG[log.actionType] ?? { label: log.actionType, Icon: Zap, color: '#888' };
                    const AIcon = acfg.Icon;
                    return (
                      <div
                        key={log.id}
                        className="hover-row fade-in"
                        style={{
                          display: 'flex', gap: 12, padding: '8px 8px',
                          borderRadius: 6,
                        }}
                      >
                        {/* Timeline dot */}
                        <div style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          paddingTop: 2, width: 20, flexShrink: 0,
                        }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: 5,
                            background: `${acfg.color}15`,
                            border: `1px solid ${acfg.color}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <AIcon size={10} color={acfg.color} />
                          </div>
                          <div style={{
                            flex: 1, width: 1, marginTop: 4,
                            background: 'rgba(255,255,255,0.04)',
                          }} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: acfg.color,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>
                              {acfg.label}
                            </span>
                            <span style={{
                              fontSize: 9, color: '#444',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>
                              Step {log.stepIndex}
                            </span>
                            <span style={{ marginLeft: 'auto', fontSize: 9, color: '#333', fontFamily: "'JetBrains Mono', monospace" }}>
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                            </span>
                          </div>
                          <p style={{ color: '#888', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
                            {log.thought}
                          </p>
                          {log.parameters && Object.keys(log.parameters).length > 0 && (
                            <div style={{
                              marginTop: 4, padding: '3px 8px', borderRadius: 4,
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.04)',
                              fontSize: 9, color: '#555', fontFamily: "'JetBrains Mono', monospace",
                              wordBreak: 'break-all',
                            }}>
                              {JSON.stringify(log.parameters)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Table view */
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead style={{
                      position: 'sticky', top: 0, zIndex: 2,
                      background: '#000',
                    }}>
                      <tr>
                        {['#', 'Action', 'Description', 'Params', 'Time'].map(h => (
                          <th key={h} style={{
                            padding: '8px 12px', textAlign: 'left',
                            fontSize: 9, fontWeight: 600, color: '#555',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#333' }}>No data</td></tr>
                      ) : logs.map((log, i) => {
                        const acfg = ACTION_CFG[log.actionType] ?? { label: log.actionType, Icon: Zap, color: '#888' };
                        return (
                          <tr key={log.id} className="hover-row" style={{
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                          }}>
                            <td style={{ padding: '7px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontWeight: 600 }}>
                              {log.stepIndex}
                            </td>
                            <td style={{ padding: '7px 12px' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '2px 7px', borderRadius: 3,
                                background: `${acfg.color}10`,
                                fontSize: 9, fontWeight: 600, color: acfg.color,
                                fontFamily: "'JetBrains Mono', monospace",
                              }}>
                                {acfg.label}
                              </span>
                            </td>
                            <td style={{ padding: '7px 12px', color: '#888', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.thought}
                            </td>
                            <td style={{ padding: '7px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#444', fontSize: 9, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.parameters ? JSON.stringify(log.parameters) : <span style={{ color: '#333' }}>—</span>}
                            </td>
                            <td style={{ padding: '7px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#444', fontSize: 9, whiteSpace: 'nowrap' }}>
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Small components ───────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: AgentRun['status'] }) {
  const c = STATUS_CFG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: 9, fontWeight: 600, color: c.color,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {status === 'RUNNING' && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%', background: '#fff',
          display: 'inline-block', animation: 'pulse 1.5s infinite',
        }} />
      )}
      {c.label}
    </span>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 12, height: 12,
      border: '2px solid rgba(0,0,0,0.15)', borderTopColor: '#000',
      borderRadius: '50%', display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 10, height: '100%', width: '100%',
    }}>
      {icon}
      <span style={{ fontSize: 11, color: '#333' }}>{text}</span>
    </div>
  );
}
