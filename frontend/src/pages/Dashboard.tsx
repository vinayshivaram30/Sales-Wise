import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listCalls, createCall } from '../lib/api';
import { Phone, Plus, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

interface Call {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [callName, setCallName] = useState('');
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    loadCalls();
  }, []);

  async function loadCalls() {
    setLoading(true);
    setError('');
    try {
      const data = await listCalls();
      setCalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartCall() {
    if (!callName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const call = await createCall({
        name: callName.trim(),
        contact_name: '',
        company_name: '',
        goal: 'Discovery',
      });
      navigate(`/calls/${call.id}/precall`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create call');
    } finally {
      setCreating(false);
    }
  }

  const totalCalls = calls.length;
  const activeCalls = calls.filter((c) => c.status === 'live').length;
  const completedCalls = calls.filter((c) => c.status === 'ended').length;
  const recentCalls = calls.slice(0, 5);

  function statusBadge(status: string) {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-live/15 px-2.5 py-0.5 text-xs font-medium text-live">
            <span className="h-1.5 w-1.5 rounded-full bg-live motion-safe:animate-pulse" />
            Live
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-dark-label/10 px-2.5 py-0.5 text-xs font-medium text-dark-label">
            <CheckCircle className="h-3 w-3" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
            <Clock className="h-3 w-3" />
            {status || 'Draft'}
          </span>
        );
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-dark-text font-display tracking-[-0.02em]">
          Welcome back, {user.name || 'there'}
        </h1>
        <p className="mt-1 text-dark-label">{today}</p>
      </div>

      {/* Quick action card */}
      <div className="mb-8 rounded-xl border border-dark-border bg-dark-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-dark-text">
          Prep your next call
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={callName}
            onChange={(e) => setCallName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStartCall()}
            placeholder="Enter call name..."
            className="flex-1 rounded-lg border border-dark-border bg-dark-card px-4 py-3 text-dark-text placeholder-dark-label outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleStartCall}
            disabled={creating || !callName.trim()}
            aria-label="Start new call"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-3 font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <Spinner size="sm" inverted label="Creating call" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Start New Call
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-danger">{error}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-dark-border border-l-2 border-l-accent bg-dark-surface p-5">
          <div className="mb-1 flex items-center gap-2 text-dark-label">
            <Phone className="h-4 w-4" />
            <span className="text-sm">Total Calls</span>
          </div>
          <p className="text-3xl font-bold text-dark-text font-mono tabular-nums">
            {loading ? '--' : totalCalls}
          </p>
        </div>
        <div className="rounded-xl border border-dark-border border-l-2 border-l-live bg-dark-surface p-5">
          <div className="mb-1 flex items-center gap-2 text-dark-label">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Active</span>
          </div>
          <p className="text-3xl font-bold text-live font-mono tabular-nums">
            {loading ? '--' : activeCalls}
          </p>
        </div>
        <div className="rounded-xl border border-dark-border border-l-2 border-l-success bg-dark-surface p-5">
          <div className="mb-1 flex items-center gap-2 text-dark-label">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Completed</span>
          </div>
          <p className="text-3xl font-bold text-dark-text font-mono tabular-nums">
            {loading ? '--' : completedCalls}
          </p>
        </div>
      </div>

      {/* Recent Calls */}
      <div className="rounded-xl border border-dark-border bg-dark-surface">
        <div className="border-b border-dark-border px-6 py-4">
          <h2 className="text-lg font-semibold text-dark-text">
            Recent Calls
          </h2>
        </div>
        {error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button onClick={loadCalls} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">Retry</button>
          </div>
        ) : loading ? (
          <div className="px-6 py-4 flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 motion-safe:animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-dark-border" />
                  <div className="h-3 w-1/3 rounded bg-dark-border" />
                </div>
                <div className="h-6 w-16 rounded-full bg-dark-border" />
              </div>
            ))}
          </div>
        ) : recentCalls.length === 0 ? (
          <EmptyState
            icon={<Phone className="h-5 w-5 text-dark-muted" />}
            message="No calls yet"
            hint='Enter a call name above and hit "Start New Call" to begin.'
          />
        ) : (
          <ul className="divide-y divide-dark-border">
            {recentCalls.map((call) => (
              <li
                key={call.id}
                className="flex items-center justify-between px-6 py-4 transition hover:bg-dark-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-dark-text">
                    {call.name}
                  </p>
                  <p className="mt-0.5 text-sm text-dark-label">
                    {formatDate(call.created_at)}
                  </p>
                </div>
                <div className="mx-4">{statusBadge(call.status)}</div>
                <Link
                  to={`/calls/${call.id}/${call.status === 'ended' ? 'postcall' : 'precall'}`}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-400 transition hover:bg-indigo-500/10"
                >
                  {call.status === 'ended' ? 'Review' : 'Open'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
