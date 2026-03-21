import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Target } from 'lucide-react';
import { summariseCall, getSummary, getCallDetail } from '../lib/api';
import CallProgressBar from '../components/CallProgressBar';
import { MEDDIC_LABELS } from '../lib/constants';

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
        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="ml-3 text-sm text-[#8b8ba0]">Loading...</span>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-[1100px] mx-auto px-8 py-10">
        <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <AlertCircle className="w-10 h-10 text-[#5a5a70] mx-auto mb-3" />
          <p className="text-[#8b8ba0] mb-4">Call not found.</p>
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
    <div className="max-w-[1100px] mx-auto px-8 py-10">
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
        <h1 className="text-2xl font-semibold text-[#e8e8f0]">
          {(detail.name as string) || 'Call'}
        </h1>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Transcript */}
          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b8ba0] mb-4">
              Transcript
            </h2>
            <div className="max-h-72 overflow-y-auto pr-2 scrollbar-thin">
              {transcriptChunks.length > 0 ? transcriptChunks.map((c, i) => (
                <p key={i} className="text-sm leading-relaxed text-[#c0c0d0] mb-2">{c.text}</p>
              )) : (
                <p className="text-sm text-[#5a5a70] italic">No transcript yet</p>
              )}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b8ba0] mb-4">
                Summary
              </h2>
              <p className="text-sm leading-relaxed text-[#c0c0d0]">
                {String(summary.summary_text)}
              </p>
            </div>
          )}

          {/* MEDDIC Scorecard */}
          {summary && (
            <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b8ba0]">
                  MEDDIC Scorecard
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries((summary.meddic_state as Record<string, string>) || {}).map(([k, v]) => (
                  <div
                    key={k}
                    className={`rounded-lg p-3 border ${
                      v
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-amber-500/5 border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {v
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      }
                      <p className={`text-[11px] font-semibold ${v ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {MEDDIC_LABELS[k]}
                      </p>
                    </div>
                    <p className={`text-xs leading-relaxed ${v ? 'text-emerald-300/80' : 'text-amber-300/60'}`}>
                      {v || 'Not captured'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Objections */}
          {summary && ((summary.objections as Array<{ text: string; handled: boolean; response: string }>) || []).length > 0 && (
            <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b8ba0] mb-4">
                Objections
              </h2>
              <div className="flex flex-col gap-3">
                {((summary.objections as Array<{ text: string; handled: boolean; response: string }>) || []).map((o, i) => (
                  <div
                    key={i}
                    className={`border-l-[3px] pl-4 py-1 ${
                      o.handled ? 'border-l-emerald-500' : 'border-l-amber-500'
                    }`}
                  >
                    <p className="text-sm font-medium text-[#e8e8f0] mb-1">
                      &quot;{o.text}&quot;
                    </p>
                    <p className="text-xs text-[#8b8ba0]">
                      <span className={o.handled ? 'text-emerald-400' : 'text-red-400'}>
                        {o.handled ? 'Addressed' : 'Unresolved'}:
                      </span>{' '}
                      {o.response}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Generate / Regenerate Button */}
          {!summary && transcriptChunks.length > 0 && (
            <button
              onClick={handleRegenerate}
              disabled={summarising}
              className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${summarising ? 'animate-spin' : ''}`} />
              {summarising ? 'Generating...' : 'Generate Summary'}
            </button>
          )}

          {summary && (
            <>
              {/* Next Steps */}
              <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b8ba0] mb-4">
                  Next Steps
                </h2>
                <div className="flex flex-col gap-3">
                  {((summary.next_steps as Array<{ text: string; owner: string; due: string }>) || []).map((ns, i) => (
                    <label key={i} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="mt-0.5 w-4 h-4 rounded border-[#2a2a3a] bg-[#1a1a25] text-indigo-500 focus:ring-indigo-500/25 focus:ring-offset-0"
                      />
                      <div>
                        <p className="text-sm text-[#e8e8f0] group-hover:text-white transition-colors">
                          {ns.text}
                        </p>
                        <p className="text-xs text-[#5a5a70] mt-0.5">
                          Owner: {ns.owner} &middot; Due: {ns.due}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Deal Stage */}
              <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-[#e8e8f0]">Deal Stage</h2>
                  <span className="text-sm font-semibold text-indigo-400">
                    {String(summary.deal_stage)}
                  </span>
                </div>
                <div className="h-2 bg-[#1a1a25] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${summary.deal_score || 0}%` }}
                  />
                </div>
                <p className="text-xs text-[#5a5a70] mt-2">
                  {Number(summary.deal_score)}% complete
                </p>
              </div>

              {/* Coaching Notes */}
              {((summary.coaching as Array<{ note: string }>) || []).length > 0 && (
                <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b8ba0] mb-4">
                    Coaching Notes
                  </h2>
                  <div className="flex flex-col gap-3">
                    {((summary.coaching as Array<{ note: string }>) || []).map((c, i) => (
                      <div key={i} className="border-l-[3px] border-l-indigo-500 pl-4 py-1">
                        <p className="text-sm text-[#c0c0d0] leading-relaxed">{c.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regenerate Button */}
              <button
                onClick={handleRegenerate}
                disabled={summarising}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#1a1a25] hover:bg-[#22222e] border border-[#2a2a3a] hover:border-indigo-500/30 text-[#8b8ba0] hover:text-indigo-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${summarising ? 'animate-spin' : ''}`} />
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
