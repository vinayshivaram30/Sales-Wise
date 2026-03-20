import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ChevronUp, FileText, BarChart3 } from 'lucide-react';
import { listCalls, createCall, getCallDetail, deleteCall } from '../lib/api';

export default function Calls() {
  const [calls, setCalls] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadCalls();
  }, []);

  async function loadCalls() {
    setLoading(true);
    try {
      const data = await listCalls();
      setCalls(data.calls || data);
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
      window.location.href = `/calls/${call.id}/precall`;
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(callId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this call? This cannot be undone.')) return;
    setDeletingId(callId);
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

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20';
      case 'in_progress': return 'bg-amber-500/15 text-amber-500 border border-amber-500/20';
      case 'failed': return 'bg-red-500/15 text-red-500 border border-red-500/20';
      default: return 'bg-[#2a2a3a] text-[#8b8ba0] border border-[#2a2a3a]';
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-[#e8e8f0]">Calls</h1>
        <div className="flex items-center gap-3">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New call name..."
            className="w-56 px-4 py-2.5 bg-[#1a1a25] border border-[#2a2a3a] rounded-lg text-sm text-[#e8e8f0] placeholder-[#5a5a70] outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-colors"
            onKeyDown={e => e.key === 'Enter' && handleAddCall()}
          />
          <button
            onClick={handleAddCall}
            disabled={adding || !newName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {adding ? 'Adding...' : 'New Call'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="ml-3 text-sm text-[#8b8ba0]">Loading calls...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && calls.length === 0 && (
        <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-16 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#1a1a25] flex items-center justify-center">
            <FileText className="w-7 h-7 text-[#5a5a70]" />
          </div>
          <p className="text-[#8b8ba0] text-sm">No calls yet. Add a call to get started.</p>
        </div>
      )}

      {/* Call List */}
      {!loading && calls.length > 0 && (
        <div className="flex flex-col gap-3">
          {calls.map((call) => (
            <div
              key={call.id as string}
              className="bg-[#12121a] border border-[#2a2a3a] rounded-xl overflow-hidden transition-colors hover:border-[#3a3a4a]"
            >
              {/* Call Row */}
              <div
                onClick={() => toggleExpand(call.id as string)}
                className="flex items-center justify-between px-5 py-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#e8e8f0]">
                    {(call.name as string) || 'Untitled'}
                  </span>
                  <span className="text-xs text-[#5a5a70]">
                    {formatDate(call.created_at as string)}
                  </span>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${statusColor((call.status as string) || 'created')}`}>
                    {(call.status as string) || 'created'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/calls/${call.id}/precall`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Pre-call
                  </Link>
                  <Link
                    to={`/calls/${call.id}/postcall`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Summary
                  </Link>
                  <button
                    onClick={e => handleDelete(call.id as string, e)}
                    disabled={deletingId === call.id}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-md transition-colors disabled:opacity-40"
                    title="Delete call"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deletingId === call.id ? '...' : 'Delete'}
                  </button>
                  {expandedId === call.id
                    ? <ChevronUp className="w-4 h-4 text-[#5a5a70]" />
                    : <ChevronDown className="w-4 h-4 text-[#5a5a70]" />
                  }
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedId === call.id && detail && (
                <div className="border-t border-[#2a2a3a] bg-[#0e0e16] px-5 py-4">
                  <div className="mb-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b8ba0] mb-2">
                      Transcript
                    </p>
                    <div className="text-sm leading-relaxed text-[#c0c0d0] max-h-32 overflow-y-auto pr-2 scrollbar-thin">
                      {((detail.transcript_chunks as Array<{ text: string }>) || []).length > 0
                        ? (detail.transcript_chunks as Array<{ text: string }>).map((c, i) => (
                            <span key={i}>{c.text} </span>
                          ))
                        : <span className="text-[#5a5a70] italic">No transcript yet</span>
                      }
                    </div>
                  </div>
                  {!!detail.summary && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b8ba0] mb-2">
                        Summary
                      </p>
                      <p className="text-sm leading-relaxed text-[#c0c0d0]">
                        {(detail.summary as Record<string, string>).summary_text}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
