import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { summariseCall, getSummary, getCallDetail } from '../lib/api';

const MEDDIC_LABELS: Record<string, string> = {
  metrics: 'Metrics', econ_buyer: 'Economic buyer',
  decision_criteria: 'Decision criteria', decision_process: 'Decision process',
  pain: 'Pain', champion: 'Champion'
};

export default function PostCall() {
  const { callId } = useParams<{ callId: string }>();
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [summarising, setSummarising] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const d = await getCallDetail(callId!);
        setDetail(d);
        if (!d.summary && (d.transcript_chunks as unknown[])?.length > 0) {
          setSummarising(true);
          await summariseCall(callId!);
          const d2 = await getCallDetail(callId!);
          setDetail(d2);
        }
      } catch {
        try {
          const existing = await getSummary(callId!);
          setDetail(prev => prev ? { ...prev, summary: existing } : { summary: existing });
        } catch {
          setSummarising(true);
          try {
            await summariseCall(callId!);
            const d = await getCallDetail(callId!);
            setDetail(d);
          } catch {
            setDetail(null);
          }
        }
      } finally {
        setLoading(false);
        setSummarising(false);
      }
    }
    if (callId) load();
  }, [callId]);

  async function handleRegenerate() {
    setSummarising(true);
    try {
      await summariseCall(callId!);
      const d = await getCallDetail(callId!);
      setDetail(d);
    } finally {
      setSummarising(false);
    }
  }

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#666' }}>Loading...</div>;
  if (!detail) return <div style={{ padding: 32 }}>Call not found. <Link to="/calls">Back to calls</Link></div>;

  const summary = detail.summary as Record<string, unknown> | null;
  const transcriptChunks = (detail.transcript_chunks as Array<{ text: string }>) || [];

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/calls" style={{ fontSize: 14, color: '#4F46E5', textDecoration: 'none' }}>← Back to calls</Link>
        <h1 style={{ marginTop: 8, fontSize: 24, fontWeight: 600 }}>{detail.name as string || 'Call'}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <h2 style={{ marginBottom: 16 }}>Transcript</h2>
          <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 14, marginBottom: 20, maxHeight: 300, overflowY: 'auto' }}>
            {transcriptChunks.length > 0 ? transcriptChunks.map((c, i) => (
              <p key={i} style={{ margin: '0 0 8px', fontSize: 13, lineHeight: 1.6 }}>{c.text}</p>
            )) : 'No transcript yet'}
          </div>

          {summary && (
            <>
              <h2 style={{ marginBottom: 16 }}>Summary</h2>
              <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 14, marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#333' }}>{String(summary.summary_text)}</p>
              </div>

              <p style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 10 }}>MEDDIC scorecard</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                {Object.entries((summary.meddic_state as Record<string, string>) || {}).map(([k, v]) => (
                  <div key={k} style={{ background: v ? '#f0fdf4' : '#fff7ed', border: `1px solid ${v ? '#86efac' : '#fed7aa'}`, borderRadius: 8, padding: '8px 10px' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: v ? '#166534' : '#c2410c', margin: '0 0 3px' }}>{MEDDIC_LABELS[k]}</p>
                    <p style={{ margin: 0, fontSize: 11, color: v ? '#15803d' : '#9a3412' }}>{v || 'Not captured'}</p>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 10 }}>Objections</p>
              {((summary.objections as Array<{ text: string; handled: boolean; response: string }>) || []).map((o, i) => (
                <div key={i} style={{ borderLeft: '3px solid #f59e0b', paddingLeft: 10, marginBottom: 10 }}>
                  <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 500 }}>&quot;{o.text}&quot;</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#666' }}>{o.handled ? '✓ Addressed: ' : '✗ Unresolved: '}{o.response}</p>
                </div>
              ))}
            </>
          )}
        </div>

        <div>
          {!summary && transcriptChunks.length > 0 && (
            <button onClick={handleRegenerate} disabled={summarising}
              style={{ display: 'block', width: '100%', padding: 12, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}>
              {summarising ? 'Generating...' : 'Generate summary'}
            </button>
          )}

          {summary && (
            <>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 10 }}>Next steps</p>
              {((summary.next_steps as Array<{ text: string; owner: string; due: string }>) || []).map((ns, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <input type="checkbox" style={{ marginTop: 2 }} />
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 13 }}>{ns.text}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#666' }}>Owner: {ns.owner} · Due: {ns.due}</p>
                  </div>
                </div>
              ))}

              <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 14, marginBottom: 20, marginTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Deal stage</p>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#4F46E5' }}>{String(summary.deal_stage)}</span>
                </div>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${summary.deal_score || 0}%`, height: '100%', background: '#4F46E5', borderRadius: 3 }} />
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#666' }}>{Number(summary.deal_score)}% complete</p>
              </div>

              <p style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 10 }}>Coaching notes</p>
              {((summary.coaching as Array<{ note: string }>) || []).map((c, i) => (
                <div key={i} style={{ borderLeft: '3px solid #3b82f6', paddingLeft: 10, marginBottom: 8 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{c.note}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
