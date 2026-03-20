import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listCalls, createCall } from '../lib/api';
import { Phone, Plus, Clock, CheckCircle, ArrowRight } from 'lucide-react';

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

  const user = JSON.parse(localStorage.getItem('user') || '{}');

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
    try {
      const call = await createCall({
        name: callName.trim(),
        contact_name: '',
        company_name: '',
        goal: 'Discovery',
      });
      window.location.href = `/calls/${call.id}/precall`;
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
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f97316]/15 px-2.5 py-0.5 text-xs font-medium text-[#f97316]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f97316] animate-pulse" />
            Live
          </span>
        );
      case 'ended':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#8b8ba0]/10 px-2.5 py-0.5 text-xs font-medium text-[#8b8ba0]">
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
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#e8e8f0] font-[Satoshi,sans-serif]">
          Welcome back, {user.name || 'there'}
        </h1>
        <p className="mt-1 text-[#8b8ba0]">{today}</p>
      </div>

      {/* Quick action card */}
      <div className="mb-8 rounded-xl border border-[#2a2a3a] bg-[#12121a] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#e8e8f0]">
          Quick Start
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={callName}
            onChange={(e) => setCallName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStartCall()}
            placeholder="Enter call name..."
            className="flex-1 rounded-lg border border-[#2a2a3a] bg-[#1a1a25] px-4 py-3 text-[#e8e8f0] placeholder-[#8b8ba0] outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleStartCall}
            disabled={creating || !callName.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-3 font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Start New Call
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#2a2a3a] bg-[#12121a] p-5">
          <div className="mb-1 flex items-center gap-2 text-[#8b8ba0]">
            <Phone className="h-4 w-4" />
            <span className="text-sm">Total Calls</span>
          </div>
          <p className="text-3xl font-bold text-[#e8e8f0] font-['Geist_Mono',monospace] tabular-nums">
            {loading ? '--' : totalCalls}
          </p>
        </div>
        <div className="rounded-xl border border-[#2a2a3a] bg-[#12121a] p-5">
          <div className="mb-1 flex items-center gap-2 text-[#8b8ba0]">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Active</span>
          </div>
          <p className="text-3xl font-bold text-[#f97316] font-['Geist_Mono',monospace] tabular-nums">
            {loading ? '--' : activeCalls}
          </p>
        </div>
        <div className="rounded-xl border border-[#2a2a3a] bg-[#12121a] p-5">
          <div className="mb-1 flex items-center gap-2 text-[#8b8ba0]">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Completed</span>
          </div>
          <p className="text-3xl font-bold text-[#e8e8f0] font-['Geist_Mono',monospace] tabular-nums">
            {loading ? '--' : completedCalls}
          </p>
        </div>
      </div>

      {/* Recent Calls */}
      <div className="rounded-xl border border-[#2a2a3a] bg-[#12121a]">
        <div className="border-b border-[#2a2a3a] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#e8e8f0]">
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
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-[#2a2a3a]" />
                  <div className="h-3 w-1/3 rounded bg-[#2a2a3a]" />
                </div>
                <div className="h-6 w-16 rounded-full bg-[#2a2a3a]" />
              </div>
            ))}
          </div>
        ) : recentCalls.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-[#1a1a25] flex items-center justify-center">
              <Phone className="h-5 w-5 text-[#6b6b80]" />
            </div>
            <p className="text-[#8b8ba0] text-sm mb-1">No calls yet</p>
            <p className="text-[#6b6b80] text-xs">Enter a call name above and hit "Start New Call" to begin.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#2a2a3a]">
            {recentCalls.map((call) => (
              <li
                key={call.id}
                className="flex items-center justify-between px-6 py-4 transition hover:bg-[#1a1a25]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#e8e8f0]">
                    {call.name}
                  </p>
                  <p className="mt-0.5 text-sm text-[#8b8ba0]">
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
