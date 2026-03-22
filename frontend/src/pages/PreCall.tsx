import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { generatePlan, getPlan, updateCall, getCallDetail } from '../lib/api';
import CallProgressBar from '../components/CallProgressBar';
import { MEDDIC_LABELS } from '../lib/constants';

type PrecallContext = {
  company?: string;
  contact?: string;
  sales_team_size?: string;
  current_stack?: string;
  known_pain?: string;
  deal_stage?: string;
  deal_size_est?: string;
  decision_timeline?: string;
  economic_buyer?: string;
  champion_likelihood?: string;
  product_name?: string;
  category?: string;
  core_value_proposition?: string;
  pricing?: string;
  key_differentiators?: string;
  known_objections?: string;
  product_tags?: string[];
  primary_goal?: string;
  secondary_goal?: string;
  demo_focus?: string;
  objection_to_preempt?: string;
  exit_criteria?: string;
  past_conversations?: Array<{ date?: string; type?: string; duration?: string; channel?: string; content?: string; outcome?: string }>;
  open_objections_from_history?: string;
};

const emptyContext: PrecallContext = {};

function SectionCard({ title, required, children, collapsible, defaultOpen = true }: { title: string; required?: boolean; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl bg-dark-card border border-dark-border mb-6 overflow-hidden">
      <div
        className={`flex justify-between items-center p-5 ${collapsible ? 'cursor-pointer select-none' : ''} ${open ? 'pb-0' : ''}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={collapsible ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); } } : undefined}
        aria-expanded={collapsible ? open : undefined}
      >
        <div className="flex items-center gap-2">
          {collapsible && (
            <ChevronDown className={`w-4 h-4 text-dark-muted transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} />
          )}
          <span className="text-xs font-semibold text-dark-label tracking-[0.05em] uppercase">{title}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${required ? 'bg-blue-500/20 text-blue-500' : 'bg-dark-muted/20 text-dark-muted'}`}>
          {required ? 'Required' : 'Optional'}
        </span>
      </div>
      {open && <div className="p-5 pt-4">{children}</div>}
    </div>
  );
}

function FieldBox({ label, value, onChange, placeholder, rows = 1 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div className="mb-3.5">
      <label className="text-xs text-dark-label block mb-1">{label}</label>
      {rows > 1 ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          className="w-full p-2.5 bg-dark-field border border-dark-border rounded-lg text-dark-text text-sm resize-y outline-none focus:border-accent" />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full p-2.5 bg-dark-field border border-dark-border rounded-lg text-dark-text text-sm outline-none focus:border-accent" />
      )}
    </div>
  );
}

function GoalItem({ label, color, value, onChange, placeholder }: { label: string; color: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex gap-3 py-3 border-b border-dark-border">
      <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${color}`} />
      <div className="flex-1">
        <label className="text-xs text-dark-label block mb-1">{label}</label>
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
          className="w-full p-2.5 bg-dark-field border border-dark-border rounded-lg text-dark-text text-sm resize-y outline-none focus:border-accent" />
      </div>
    </div>
  );
}

export default function PreCall() {
  const { callId } = useParams<{ callId: string }>();
  const [ctx, setCtx] = useState<PrecallContext>(emptyContext);
  const [quickMode, setQuickMode] = useState(true);
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [callIdState, setCallIdState] = useState<string | null>(callId || null);
  const [meetUrl, setMeetUrl] = useState('');
  const [showDealDetails, setShowDealDetails] = useState(false);

  useEffect(() => {
    if (callId) setCallIdState(callId);
  }, [callId]);

  useEffect(() => {
    if (!callIdState) return;
    getCallDetail(callIdState).then(c => {
      const merged: PrecallContext = {
        company: (c.company as string) ?? '',
        contact: (c.contact as string) ?? '',
        sales_team_size: (c.sales_team_size as string) ?? '',
        current_stack: (c.current_stack as string) ?? '',
        known_pain: (c.known_pain as string) ?? '',
        deal_stage: (c.deal_stage as string) ?? '',
        deal_size_est: (c.deal_size_est as string) ?? '',
        decision_timeline: (c.decision_timeline as string) ?? '',
        economic_buyer: (c.economic_buyer as string) ?? '',
        champion_likelihood: (c.champion_likelihood as string) ?? '',
        product_name: (c.product_name as string) ?? '',
        category: (c.category as string) ?? '',
        core_value_proposition: (c.core_value_proposition as string) ?? '',
        pricing: (c.pricing as string) ?? '',
        key_differentiators: (c.key_differentiators as string) ?? '',
        known_objections: (c.known_objections as string) ?? '',
        product_tags: Array.isArray(c.product_tags) ? c.product_tags : [],
        primary_goal: (c.primary_goal as string) ?? '',
        secondary_goal: (c.secondary_goal as string) ?? '',
        demo_focus: (c.demo_focus as string) ?? '',
        objection_to_preempt: (c.objection_to_preempt as string) ?? '',
        exit_criteria: (c.exit_criteria as string) ?? '',
        open_objections_from_history: (c.open_objections_from_history as string) ?? '',
        past_conversations: Array.isArray(c.past_conversations) ? c.past_conversations : [],
      };
      if (!merged.company && c.company_name) merged.company = `${c.company_name} · ${c.company_ctx || ''}`.trim();
      if (!merged.contact && c.contact_name) merged.contact = c.contact_name as string;
      if (!merged.primary_goal && !merged.secondary_goal && c.goal) merged.primary_goal = c.goal as string;
      if (!merged.core_value_proposition && c.product_ctx) merged.core_value_proposition = c.product_ctx as string;
      if (!merged.open_objections_from_history && c.past_context) merged.open_objections_from_history = c.past_context as string;
      setCtx(merged);
    }).catch(() => {});
  }, [callIdState]);

  async function handleGenerate() {
    setLoading(true);
    setPlanError('');
    try {
      const cid = callIdState!;
      await updateCall(cid, {
        company: ctx.company,
        contact: ctx.contact,
        sales_team_size: ctx.sales_team_size,
        current_stack: ctx.current_stack,
        known_pain: ctx.known_pain,
        deal_stage: ctx.deal_stage,
        deal_size_est: ctx.deal_size_est,
        decision_timeline: ctx.decision_timeline,
        economic_buyer: ctx.economic_buyer,
        champion_likelihood: ctx.champion_likelihood,
        product_name: ctx.product_name,
        category: ctx.category,
        core_value_proposition: ctx.core_value_proposition,
        pricing: ctx.pricing,
        key_differentiators: ctx.key_differentiators,
        known_objections: ctx.known_objections,
        product_tags: ctx.product_tags,
        primary_goal: ctx.primary_goal,
        secondary_goal: ctx.secondary_goal,
        demo_focus: ctx.demo_focus,
        objection_to_preempt: ctx.objection_to_preempt,
        exit_criteria: ctx.exit_criteria,
        open_objections_from_history: ctx.open_objections_from_history,
        past_conversations: ctx.past_conversations,
      });
      const p = await generatePlan(cid);
      setPlan(p);
      localStorage.setItem('active_call_id', cid);
      window.postMessage({ type: 'SALESWISE_SET_CALL', callId: cid }, '*');
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadPlan() {
    if (!callIdState) return;
    try {
      const p = await getPlan(callIdState);
      setPlan(p);
    } catch {
      // No plan yet
    }
  }

  useEffect(() => {
    if (callIdState) handleLoadPlan();
  }, [callIdState]);

  function launchCopilot() {
    if (!callIdState) return;
    localStorage.setItem('active_call_id', callIdState);
    window.postMessage({ type: 'SALESWISE_SET_CALL', callId: callIdState }, '*');
    const url = meetUrl.trim();
    if (url && url.includes('meet.google.com')) {
      window.open(url, '_blank');
    } else {
      window.open('https://meet.google.com', '_blank');
    }
  }

  const set = (k: keyof PrecallContext) => (v: string | string[]) => setCtx(prev => ({ ...prev, [k]: v }));

  const hasRequired = ctx.company && ctx.contact && ctx.primary_goal;

  if (!callIdState) return (
    <div className="p-8 text-dark-text">
      No call selected. <Link to="/calls" className="text-accent hover:text-accent-hover">Back to calls</Link>
    </div>
  );

  return (
    <>
    <CallProgressBar current="precall" />
    <div className="min-h-screen bg-dark-bg p-8 text-dark-text">
      <div>
        <div className="mb-6">
          <Link to="/calls" className="text-sm text-accent hover:text-accent-hover no-underline">&larr; Back to calls</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-[-0.01em] mb-6">Pre-call setup</h1>

            {/* Essential fields — always visible */}
            <SectionCard title="CALL ESSENTIALS" required>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldBox label="Company" value={ctx.company || ''} onChange={set('company')} placeholder="Acme Corp · B2B SaaS · 200 employees" />
                <FieldBox label="Contact" value={ctx.contact || ''} onChange={set('contact')} placeholder="Jane Smith · VP of Sales" />
              </div>
              <div className="mt-2">
                <FieldBox label="Primary goal" value={ctx.primary_goal || ''} onChange={set('primary_goal')} rows={2} placeholder="Qualify economic buyer. Get commitment for follow-up demo." />
              </div>
            </SectionCard>

            {/* Quick/Full mode toggle */}
            <button
              onClick={() => setQuickMode(q => !q)}
              className="mb-6 text-sm text-accent hover:text-accent-hover transition-colors flex items-center gap-1.5"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${quickMode ? '-rotate-90' : 'rotate-0'}`} />
              {quickMode ? 'Show all fields (company details, product, objectives, history)' : 'Hide additional fields'}
            </button>

            {!quickMode && (
            <>
            {/* 1. Customer / Company Context */}
            <SectionCard title="COMPANY DETAILS" required={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldBox label="Sales team size" value={ctx.sales_team_size || ''} onChange={set('sales_team_size')} placeholder="8 AEs + 3 SDRs · Quota: $1.2M ARR/AE" />
                <FieldBox label="Current stack" value={ctx.current_stack || ''} onChange={set('current_stack')} placeholder="Salesforce CRM · Outreach · Zoom" />
                <FieldBox label="Known pain" value={ctx.known_pain || ''} onChange={set('known_pain')} rows={2} placeholder="Reps spend ~40 min/day on CRM. Pipeline reviews feel like guesswork." />
                <FieldBox label="Deal stage" value={ctx.deal_stage || ''} onChange={set('deal_stage')} placeholder="Stage 2 — Discovery" />
              </div>
              {!showDealDetails ? (
                <button
                  onClick={() => setShowDealDetails(true)}
                  className="mt-4 text-xs text-dark-label hover:text-dark-text transition-colors flex items-center gap-1"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show deal details (size, timeline, buyer, champion)
                </button>
              ) : (
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-dark-border">
                  <FieldBox label="Deal size est." value={ctx.deal_size_est || ''} onChange={set('deal_size_est')} placeholder="$14,400–$28,800 ARR" />
                  <FieldBox label="Decision timeline" value={ctx.decision_timeline || ''} onChange={set('decision_timeline')} placeholder="Q3 budget cycle" />
                  <FieldBox label="Economic buyer" value={ctx.economic_buyer || ''} onChange={set('economic_buyer')} placeholder="CRO (not yet engaged)" />
                  <FieldBox label="Champion likelihood" value={ctx.champion_likelihood || ''} onChange={set('champion_likelihood')} placeholder="High — Priya raised pain unprompted" />
                </div>
              )}
            </SectionCard>

            {/* 2. Product Context — collapsible, auto-open if key fields empty */}
            <SectionCard title="PRODUCT / SERVICE CONTEXT" required collapsible defaultOpen={!ctx.product_name || !ctx.core_value_proposition}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldBox label="Product name" value={ctx.product_name || ''} onChange={set('product_name')} placeholder="Velaris (Revenue Intelligence Platform)" />
                <FieldBox label="Category" value={ctx.category || ''} onChange={set('category')} placeholder="B2B SaaS · Revenue Operations" />
                <div className="col-span-full">
                  <FieldBox label="Core value proposition" value={ctx.core_value_proposition || ''} onChange={set('core_value_proposition')} rows={2} placeholder="Consolidates pipeline, call recordings, CRM into single dashboard — eliminates manual updates" />
                </div>
                <FieldBox label="Pricing" value={ctx.pricing || ''} onChange={set('pricing')} placeholder="$180/seat/month · 5-seat minimum · Annual contract" />
                <FieldBox label="Key differentiators" value={ctx.key_differentiators || ''} onChange={set('key_differentiators')} rows={2} placeholder="Real-time live-call coaching vs Gong's post-call only. Native Salesforce write-back." />
                <FieldBox label="Known objections we handle" value={ctx.known_objections || ''} onChange={set('known_objections')} rows={2} placeholder="Budget, adoption, security" />
              </div>
              {(ctx.product_tags || []).length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {(ctx.product_tags || []).map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-500">{tag}</span>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* 3. Objectives / Goals */}
            <SectionCard title="OBJECTIVES / GOALS" required={false}>
              <GoalItem label="Secondary goal" color="bg-danger" value={ctx.secondary_goal || ''} onChange={set('secondary_goal')} placeholder="Surface business impact — translate pain to dollar figure." />
              <GoalItem label="Demo focus" color="bg-warning" value={ctx.demo_focus || ''} onChange={set('demo_focus')} placeholder="Show live-call coaching first. Defer CRM unless asked." />
              <GoalItem label="Objection to pre-empt" color="bg-warning" value={ctx.objection_to_preempt || ''} onChange={set('objection_to_preempt')} placeholder="Address known concerns proactively." />
              <GoalItem label="Exit criteria" color="bg-success" value={ctx.exit_criteria || ''} onChange={set('exit_criteria')} placeholder="Intro to decision maker scheduled. No 'I'll think about it'." />
            </SectionCard>

            {/* 4. Past Conversations — collapsed by default */}
            <SectionCard title="PAST CONVERSATIONS" required={false} collapsible defaultOpen={false}>
              {(ctx.past_conversations || []).map((conv, i) => (
                <div key={i} className="mb-4 p-3 bg-dark-field rounded-lg border border-dark-border">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input value={conv.date || ''} onChange={e => {
                      const next = [...(ctx.past_conversations || [])];
                      next[i] = { ...next[i], date: e.target.value };
                      setCtx(prev => ({ ...prev, past_conversations: next }));
                    }} placeholder="14 Mar 2026" className="p-1.5 bg-dark-bg border border-dark-border rounded text-dark-text text-xs outline-none focus:border-accent" />
                    <input value={conv.type || ''} onChange={e => {
                      const next = [...(ctx.past_conversations || [])];
                      next[i] = { ...next[i], type: e.target.value };
                      setCtx(prev => ({ ...prev, past_conversations: next }));
                    }} placeholder="SDR intro call" className="p-1.5 bg-dark-bg border border-dark-border rounded text-dark-text text-xs outline-none focus:border-accent" />
                    <input value={conv.duration || ''} onChange={e => {
                      const next = [...(ctx.past_conversations || [])];
                      next[i] = { ...next[i], duration: e.target.value };
                      setCtx(prev => ({ ...prev, past_conversations: next }));
                    }} placeholder="18 min" className="p-1.5 bg-dark-bg border border-dark-border rounded text-dark-text text-xs outline-none focus:border-accent" />
                    <input value={conv.channel || ''} onChange={e => {
                      const next = [...(ctx.past_conversations || [])];
                      next[i] = { ...next[i], channel: e.target.value };
                      setCtx(prev => ({ ...prev, past_conversations: next }));
                    }} placeholder="Zoom" className="p-1.5 bg-dark-bg border border-dark-border rounded text-dark-text text-xs outline-none focus:border-accent" />
                  </div>
                  <textarea value={conv.content || ''} onChange={e => {
                    const next = [...(ctx.past_conversations || [])];
                    next[i] = { ...next[i], content: e.target.value };
                    setCtx(prev => ({ ...prev, past_conversations: next }));
                  }} placeholder="Summary of the conversation..." rows={2} className="w-full p-2 bg-dark-bg border border-dark-border rounded text-dark-text text-xs mb-2 outline-none focus:border-accent" />
                  <div className="flex justify-between items-center">
                    <input value={conv.outcome || ''} onChange={e => {
                      const next = [...(ctx.past_conversations || [])];
                      next[i] = { ...next[i], outcome: e.target.value };
                      setCtx(prev => ({ ...prev, past_conversations: next }));
                    }} placeholder="Outcome: Demo booked" className="flex-1 mr-2 p-1.5 bg-dark-bg border border-dark-border rounded text-dark-text text-xs outline-none focus:border-accent" />
                    <button onClick={() => setCtx(prev => ({ ...prev, past_conversations: (prev.past_conversations || []).filter((_, j) => j !== i) }))}
                      className="px-2.5 py-1.5 text-xs bg-transparent border border-danger/40 rounded text-danger cursor-pointer hover:bg-danger/10 transition-colors">Remove</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setCtx(prev => ({ ...prev, past_conversations: [...(prev.past_conversations || []), { date: '', type: '', duration: '', channel: '', content: '', outcome: '' }] }))}
                className="px-3.5 py-2 text-xs bg-dark-field border border-dark-border rounded-md text-dark-text cursor-pointer hover:bg-dark-card transition-colors mb-4">
                + Add conversation
              </button>
              <FieldBox label="Open objections from history" value={ctx.open_objections_from_history || ''} onChange={set('open_objections_from_history')} placeholder="Bad past experience with coaching tool · Economic buyer not looped in" />
            </SectionCard>
            </>
            )}

            <button onClick={handleGenerate} disabled={loading || !hasRequired}
              className="w-full py-3.5 bg-accent text-white rounded-[10px] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors cursor-pointer">
              {loading ? 'Generating...' : 'Generate call plan'}
            </button>
            {planError && (
              <div className="mt-3 p-3 bg-danger/10 border border-danger/40 rounded-lg">
                <p className="m-0 text-sm text-danger">{planError}</p>
              </div>
            )}
          </div>

          {/* Right: Call plan output */}
          <div className="lg:sticky lg:top-20">
            {!plan && <div className="text-dark-label mt-[60px] text-center">Fill in required context and generate your plan</div>}
            {!!plan && (
              <div className="rounded-xl bg-dark-card border border-dark-border p-5">
                <h2 className="mb-4 text-lg">Call plan</h2>
                <div className="mb-5">
                  <p className="text-xs font-semibold text-dark-label uppercase mb-2">MEDDIC gaps</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries((plan.meddic_gaps as Record<string, boolean>) || {}).map(([k, filled]) => (
                      <span key={k} className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${filled ? 'bg-success/20 text-success' : 'bg-dark-field text-dark-label'}`}>
                        {filled ? '\u2713 ' : ''}{MEDDIC_LABELS[k] || k}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mb-5">
                  <p className="text-xs font-semibold text-dark-label uppercase mb-2">Priority questions</p>
                  {((plan.questions as Array<{ question: string; meddic_field: string; why: string; priority: number }>) || []).map((q, i) => (
                    <div key={i} className="bg-dark-field rounded-lg p-3 mb-2 border-l-[3px] border-l-accent">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-semibold text-accent">{MEDDIC_LABELS[q.meddic_field] || q.meddic_field}</span>
                        <span className="text-xs text-dark-label">#{q.priority}</span>
                      </div>
                      <p className="m-0 text-sm">&quot;{q.question}&quot;</p>
                      <p className="mt-1 mb-0 text-xs text-dark-label">{q.why}</p>
                    </div>
                  ))}
                </div>
                {!!plan.watch_for && (
                  <div className="bg-warning/10 border border-warning/40 rounded-lg p-3 mb-5">
                    <p className="text-xs font-semibold text-warning mb-1 mt-0">Watch for</p>
                    <p className="m-0 text-sm text-dark-text">{String(plan.watch_for)}</p>
                  </div>
                )}
                <div className="mb-3">
                  <label className="text-xs text-dark-label block mb-1">Google Meet link</label>
                  <input
                    value={meetUrl}
                    onChange={e => setMeetUrl(e.target.value)}
                    placeholder="https://meet.google.com/abc-defg-hij"
                    className="w-full p-2.5 bg-dark-field border border-dark-border rounded-lg text-dark-text text-sm outline-none focus:border-accent"
                  />
                  <p className="text-xs text-dark-label mt-1">
                    Paste your Meet link, or leave blank to open meet.google.com
                  </p>
                </div>
                <button onClick={launchCopilot}
                  className="w-full py-3 bg-success text-white rounded-lg text-sm font-semibold hover:bg-success/90 transition-colors cursor-pointer">
                  Join Meet &amp; start copilot &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
