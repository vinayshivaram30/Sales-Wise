import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ChevronUp, FileText, BarChart3 } from 'lucide-react';
import { listCalls, createCall, getCallDetail, deleteCall } from '../lib/api';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

export default function Calls() {
  const [calls, setCalls] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCalls();
  }, []);

  async function loadCalls() {
    setLoading(true);
    try {
      const data = await listCalls();
      setCalls(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCall() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const call = await createCall({
        name: newName.trim(),
        contact_name: '',
        company_name: '',
        goal: 'Discovery'
      });
      setNewName('');
      setCalls(prev => [call, ...prev]);
      navigate(`/calls/${call.id}/precall`);
    } finally {
      setAdding(false);
    }
  }

  function handleDeleteClick(callId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmDeleteId(callId);
  }

  async function handleDeleteConfirm(callId: string) {
    setDeletingId(callId);
    setConfirmDeleteId(null);
    try {
      await deleteCall(callId);
      setCalls(prev => prev.filter(c => c.id !== callId));
      if (expandedId === callId) {
        setExpandedId(null);
        setDetail(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleExpand(callId: string) {
    if (expandedId === callId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(callId);
    try {
      const d = await getCallDetail(callId);
      setDetail(d);
    } catch {
      setDetail(null);
    }
  }

  const formatDate = (d: string) => {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  function groupCalls(items: Array<Record<string, unknown>>) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const groups: { label: string; calls: Array<Record<string, unknown>> }[] = [
      { label: 'Today', calls: [] },
      { label: 'This week', calls: [] },
      { label: 'Earlier', calls: [] },
    ];

    for (const call of items) {
      const d = new Date(call.created_at as string);
      if (d >= todayStart) groups[0].calls.push(call);
      else if (d >= weekStart) groups[1].calls.push(call);
      else groups[2].calls.push(call);
    }

    return groups.filter(g => g.calls.length > 0);
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/15 text-success border border-success/20';
      case 'in_progress': return 'bg-warning/15 text-warning border border-warning/20';
      case 'failed': return 'bg-danger/15 text-danger border border-danger/20';
      default: return 'bg-dark-border text-dark-label border border-dark-border';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-dark-text font-display tracking-[-0.01em]">Calls</h1>
        <div className="flex items-center gap-3">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New call name..."
            className="flex-1 sm:w-56 min-w-0 px-4 py-2.5 bg-dark-card border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-colors"
            onKeyDown={e => e.key === 'Enter' && handleAddCall()}
          />
          <button
            onClick={handleAddCall}
            disabled={adding || !newName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{adding ? 'Adding...' : 'New Call'}</span>
            <span className="sm:hidden">{adding ? '...' : 'Add'}</span>
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner label="Loading calls" />
        </div>
      )}

      {/* Empty State */}
      {!loading && calls.length === 0 && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-16">
          <EmptyState
            icon={<FileText className="w-7 h-7 text-dark-muted" />}
            message="No calls yet. Add a call to get started."
          />
        </div>
      )}

      {/* Call List — grouped by date */}
      {!loading && calls.length > 0 && (
        <div className="flex flex-col gap-8">
          {groupCalls(calls).map((group) => (
            <div key={group.label}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-dark-muted mb-3 px-1">{group.label}</h2>
              <div className="flex flex-col gap-3">
          {group.calls.map((call) => (
            <div
              key={call.id as string}
              className="bg-dark-surface border border-dark-border rounded-xl overflow-hidden transition-colors hover:border-dark-border-hover"
            >
              {/* Call Row */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleExpand(call.id as string)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(call.id as string); } }}
                aria-expanded={expandedId === call.id}
                aria-label={`${(call.name as string) || 'Untitled'} — click to ${expandedId === call.id ? 'collapse' : 'expand'} details`}
                className="flex items-center justify-between px-5 py-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-inset"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-semibold text-dark-text truncate">
                    {(call.name as string) || 'Untitled'}
                  </span>
                  <span className="hidden sm:inline text-xs text-dark-muted whitespace-nowrap">
                    {formatDate(call.created_at as string)}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${statusColor((call.status as string) || 'created')}`}>
                    {(call.status as string) || 'created'}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to={`/calls/${call.id}/precall`}
                    onClick={e => e.stopPropagation()}
                    className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Pre-call
                  </Link>
                  <Link
                    to={`/calls/${call.id}/postcall`}
                    onClick={e => e.stopPropagation()}
                    className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Summary
                  </Link>
                  {confirmDeleteId === call.id ? (
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteConfirm(call.id as string)}
                        disabled={deletingId === call.id}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:opacity-40"
                        aria-label="Confirm delete"
                      >
                        {deletingId === call.id ? '...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 text-xs text-dark-label hover:text-dark-text rounded-md transition-colors"
                        aria-label="Cancel delete"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={e => handleDeleteClick(call.id as string, e)}
                      disabled={deletingId === call.id}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-md transition-colors disabled:opacity-40"
                      aria-label={`Delete call ${(call.name as string) || 'Untitled'}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                  {expandedId === call.id
                    ? <ChevronUp className="w-4 h-4 text-dark-muted" />
                    : <ChevronDown className="w-4 h-4 text-dark-muted" />
                  }
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedId === call.id && detail && (
                <div className="border-t border-dark-border bg-dark-bg px-5 py-4">
                  {/* Mobile-only action links + date */}
                  <div className="flex items-center gap-4 mb-4 sm:hidden">
                    <span className="text-xs text-dark-muted">{formatDate(call.created_at as string)}</span>
                    <Link to={`/calls/${call.id}/precall`} className="flex items-center gap-1.5 text-xs text-indigo-400"><FileText className="w-3.5 h-3.5" />Pre-call</Link>
                    <Link to={`/calls/${call.id}/postcall`} className="flex items-center gap-1.5 text-xs text-indigo-400"><BarChart3 className="w-3.5 h-3.5" />Summary</Link>
                  </div>
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-dark-label mb-2">
                      Transcript
                    </p>
                    <div className="text-sm leading-relaxed text-dark-text max-h-32 overflow-y-auto pr-2 scrollbar-thin">
                      {((detail.transcript_chunks as Array<{ text: string }>) || []).length > 0
                        ? (detail.transcript_chunks as Array<{ text: string }>).map((c, i) => (
                            <span key={i}>{c.text} </span>
                          ))
                        : <span className="text-dark-muted italic">No transcript yet</span>
                      }
                    </div>
                  </div>
                  {!!detail.summary && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-dark-label mb-2">
                        Summary
                      </p>
                      <p className="text-sm leading-relaxed text-dark-text">
                        {(detail.summary as Record<string, string>).summary_text}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
