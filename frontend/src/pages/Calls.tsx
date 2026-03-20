import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Calls</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New call name"
            style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, width: 200 }}
            onKeyDown={e => e.key === 'Enter' && handleAddCall()}
          />
          <button onClick={handleAddCall} disabled={adding || !newName.trim()}
            style={{ padding: '8px 16px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {adding ? 'Adding...' : 'Add call'}
          </button>
        </div>
      </div>

      {loading && <p style={{ color: '#666' }}>Loading...</p>}
      {!loading && calls.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 8, padding: 48, textAlign: 'center', color: '#6b7280' }}>
          No calls yet. Add a call to get started.
        </div>
      )}
      {!loading && calls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {calls.map((call) => (
            <div key={call.id as string} style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div
                onClick={() => toggleExpand(call.id as string)}
                style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{call.name || 'Untitled'}</span>
                  <span style={{ marginLeft: 12, fontSize: 12, color: '#6b7280' }}>{formatDate(call.created_at as string)}</span>
                  <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280' }}>
                    {call.status as string || 'created'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Link to={`/calls/${call.id}/precall`} onClick={e => e.stopPropagation()}
                    style={{ fontSize: 12, color: '#4F46E5', textDecoration: 'none' }}>Pre-call</Link>
                  <Link to={`/calls/${call.id}/postcall`} onClick={e => e.stopPropagation()}
                    style={{ fontSize: 12, color: '#4F46E5', textDecoration: 'none' }}>Summary</Link>
                  <button onClick={e => handleDelete(call.id as string, e)} disabled={deletingId === call.id}
                    style={{ padding: '2px 8px', fontSize: 11, color: '#dc2626', background: 'transparent', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer' }}
                    title="Delete call">
                    {deletingId === call.id ? '…' : 'Delete'}
                  </button>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{expandedId === call.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandedId === call.id && detail && (
                <div style={{ borderTop: '1px solid #e5e7eb', padding: 16, background: '#f9fafb' }}>
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Transcript</p>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: '#374151', maxHeight: 120, overflowY: 'auto' }}>
                      {((detail.transcript_chunks as Array<{ text: string }>) || []).length > 0
                        ? (detail.transcript_chunks as Array<{ text: string }>).map((c, i) => <span key={i}>{c.text} </span>)
                        : 'No transcript yet'}
                    </div>
                  </div>
                  {detail.summary && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>Summary</p>
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: '#374151' }}>{(detail.summary as Record<string, string>).summary_text}</p>
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
