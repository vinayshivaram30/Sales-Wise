import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Target } from 'lucide-react';
import { summariseCall, getSummary, getCallDetail } from '../lib/api';
import CallProgressBar from '../components/CallProgressBar';
import { MEDDIC_LABELS } from '../lib/constants';
import SectionCard from '../components/SectionCard';
import Spinner from '../components/Spinner';

export default function PostCall() {
  const { callId } = useParams<{ callId: string }>();
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [summarising, setSummarising] = useState(false);
  const [summaryError, setSummaryError] = useState('');

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
    setSummaryError('');
    try {
      await summariseCall(callId!);
      const d = await getCallDetail(callId!);
      setDetail(d);
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setSummarising(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner label="Loading" />
        <span className="ml-3 text-sm text-dark-label">Loading...</span>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-2">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
          <AlertCircle className="w-10 h-10 text-dark-muted mx-auto mb-3" />
          <p className="text-dark-label mb-4">Call not found.</p>
          <Link to="/calls" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Back to calls
          </Link>
        </div>
      </div>
    );
  }

  const summary = detail.summary as Record<string, unknown> | null;
  const transcriptChunks = (detail.transcript_chunks as Array<{ text: string }>) || [];

  return (
    <>
    <CallProgressBar current="postcall" />
    <div className="py-2">
      {summaryError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{summaryError}</p>
        </div>
      )}
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/calls"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to calls
        </Link>
        <h1 className="text-2xl font-bold text-dark-text font-display tracking-[-0.01em]">
          {(detail.name as string) || 'Call'}
        </h1>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Transcript */}
          <SectionCard title="Transcript">
            <div className="max-h-72 overflow-y-auto pr-2 scrollbar-thin">
              {transcriptChunks.length > 0 ? transcriptChunks.map((c, i) => (
                <p key={i} className="text-sm leading-relaxed text-dark-text mb-2">{c.text}</p>
              )) : (
                <p className="text-sm text-dark-muted italic">No transcript yet</p>
              )}
            </div>
          </SectionCard>

          {/* Summary */}
          {summary && (
            <SectionCard title="Summary">
              <p className="text-sm leading-relaxed text-dark-text">
                {String(summary.summary_text)}
              </p>
            </SectionCard>
          )}

          {/* MEDDIC Scorecard */}
          {summary && (
            <SectionCard title="MEDDIC Scorecard" icon={<Target className="w-4 h-4 text-indigo-400" />}>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries((summary.meddic_state as Record<string, string>) || {}).map(([k, v]) => (
                  <div
                    key={k}
                    className={`rounded-lg p-3 border ${
                      v
                        ? 'bg-success/5 border-success/20'
                        : 'bg-warning/5 border-warning/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {v
                        ? <CheckCircle className="w-3.5 h-3.5 text-success" />
                        : <AlertCircle className="w-3.5 h-3.5 text-warning" />
                      }
                      <p className={`text-xs font-semibold ${v ? 'text-success' : 'text-warning'}`}>
                        {MEDDIC_LABELS[k]}
                      </p>
                    </div>
                    <p className={`text-xs leading-relaxed ${v ? 'text-success/80' : 'text-warning/60'}`}>
                      {v || 'Not captured'}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Objections */}
          {summary && ((summary.objections as Array<{ text: string; handled: boolean; response: string }>) || []).length > 0 && (
            <SectionCard title="Objections">
              <div className="flex flex-col gap-3">
                {((summary.objections as Array<{ text: string; handled: boolean; response: string }>) || []).map((o, i) => (
                  <div
                    key={i}
                    className={`border-l-[3px] pl-4 py-1 ${
                      o.handled ? 'border-l-success' : 'border-l-warning'
                    }`}
                  >
                    <p className="text-sm font-medium text-dark-text mb-1">
                      &quot;{o.text}&quot;
                    </p>
                    <p className="text-xs text-dark-label">
                      <span className={o.handled ? 'text-success' : 'text-danger'}>
                        {o.handled ? 'Addressed' : 'Unresolved'}:
                      </span>{' '}
                      {o.response}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Empty state — no transcript, no summary */}
          {!summary && transcriptChunks.length === 0 && !summarising && (
            <div className="bg-dark-surface border border-dark-border rounded-xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-dark-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-dark-text mb-1">No call data yet</p>
              <p className="text-xs text-dark-label mb-4">
                This call hasn't been recorded. Start a live session from the pre-call page to capture transcript and generate insights.
              </p>
              <Link
                to={`/calls/${callId}/precall`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Go to pre-call setup
              </Link>
            </div>
          )}

          {/* Generate button — has transcript but no summary */}
          {!summary && transcriptChunks.length > 0 && (
            <button
              onClick={handleRegenerate}
              disabled={summarising}
              className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${summarising ? 'motion-safe:animate-spin' : ''}`} />
              {summarising ? 'Generating...' : 'Generate Summary'}
            </button>
          )}

          {summary && (
            <>
              {/* Next Steps */}
              <SectionCard title="Next Steps">
                <div className="flex flex-col gap-3">
                  {((summary.next_steps as Array<{ text: string; owner: string; due: string }>) || []).map((ns, i) => (
                    <label key={i} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 rounded border-dark-border bg-dark-card text-indigo-500 focus:ring-indigo-500/25 focus:ring-offset-0"
                      />
                      <div>
                        <p className="text-sm text-dark-text group-hover:text-white transition-colors">
                          {ns.text}
                        </p>
                        <p className="text-xs text-dark-muted mt-0.5">
                          Owner: {ns.owner} &middot; Due: {ns.due}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </SectionCard>

              {/* Deal Stage */}
              <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-dark-text">Deal Stage</h2>
                  <span className="text-sm font-semibold text-indigo-400">
                    {String(summary.deal_stage)}
                  </span>
                </div>
                <div className="h-2 bg-dark-card rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-200"
                    style={{ width: `${summary.deal_score || 0}%` }}
                  />
                </div>
                <p className="text-xs text-dark-muted mt-2">
                  {Number(summary.deal_score)}% complete
                </p>
              </div>

              {/* Coaching Notes */}
              {((summary.coaching as Array<{ note: string }>) || []).length > 0 && (
                <SectionCard title="Coaching Notes">
                  <div className="flex flex-col gap-3">
                    {((summary.coaching as Array<{ note: string }>) || []).map((c, i) => (
                      <div key={i} className="border-l-[3px] border-l-indigo-500 pl-4 py-1">
                        <p className="text-sm text-dark-text leading-relaxed">{c.note}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Regenerate Button */}
              <button
                onClick={handleRegenerate}
                disabled={summarising}
                className="flex items-center justify-center gap-2 w-full py-3 bg-dark-card hover:bg-dark-field border border-dark-border hover:border-indigo-500/30 text-dark-label hover:text-indigo-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${summarising ? 'motion-safe:animate-spin' : ''}`} />
                {summarising ? 'Regenerating...' : 'Regenerate Summary'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
