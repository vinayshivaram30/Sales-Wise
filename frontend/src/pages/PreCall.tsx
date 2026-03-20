import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generatePlan, getPlan, updateCall, getCallDetail } from '../lib/api';
import CallProgressBar from '../components/CallProgressBar';

const MEDDIC_LABELS: Record<string, string> = {
  metrics: 'Metrics', econ_buyer: 'Economic buyer',
  decision_criteria: 'Decision criteria', decision_process: 'Decision process',
  pain: 'Pain', champion: 'Champion'
};

const DARK = {
  bg: '#0f0f0f',
  card: '#1a1a1a',
  field: '#252525',
  border: '#333',
  label: '#9ca3af',
  text: '#f3f4f6',
  accent: '#6366f1',
  required: '#3b82f6',
  optional: '#6b7280',
  red: '#ef4444',
  orange: '#f59e0b',
  green: '#22c55e',
  purple: '#a855f7',
  teal: '#14b8a6',
};

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

const defaultContext: PrecallContext = {
  company: '', contact: '', sales_team_size: '', current_stack: '', known_pain: '', deal_stage: '',
  deal_size_est: '', decision_timeline: '', economic_buyer: '', champion_likelihood: '',
  product_name: '', category: '', core_value_proposition: '', pricing: '', key_differentiators: '', known_objections: '',
  product_tags: [],
  primary_goal: '', secondary_goal: '', demo_focus: '', objection_to_preempt: '', exit_criteria: '',
  past_conversations: [],
  open_objections_from_history: '',
};

function SectionCard({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: DARK.card, borderRadius: 12, padding: 20, marginBottom: 24, border: `1px solid ${DARK.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: DARK.label, letterSpacing: '0.05em' }}>{title}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
          background: required ? `${DARK.required}33` : `${DARK.optional}33`,
          color: required ? DARK.required : DARK.optional
        }}>{required ? 'Required' : 'Optional'}</span>
      </div>
      {children}
    </div>
  );
}

function FieldBox({ label, value, onChange, placeholder, rows = 1 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, color: DARK.label, display: 'block', marginBottom: 4 }}>{label}</label>
      {rows > 1 ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          style={{ width: '100%', padding: 10, background: DARK.field, border: `1px solid ${DARK.border}`, borderRadius: 8, color: DARK.text, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', padding: 10, background: DARK.field, border: `1px solid ${DARK.border}`, borderRadius: 8, color: DARK.text, fontSize: 13, boxSizing: 'border-box' }} />
      )}
    </div>
  );
}

function GoalItem({ label, color, value, onChange, placeholder }: { label: string; color: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${DARK.border}` }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6 }} />
      <div style={{ flex: 1 }}>
        <label style={{ fontSize: 11, color: DARK.label, display: 'block', marginBottom: 4 }}>{label}</label>
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2}
          style={{ width: '100%', padding: 10, background: DARK.field, border: `1px solid ${DARK.border}`, borderRadius: 8, color: DARK.text, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
      </div>
    </div>
  );
}

export default function PreCall() {
  const { callId } = useParams<{ callId: string }>();
  const [ctx, setCtx] = useState<PrecallContext>(defaultContext);
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [callIdState, setCallIdState] = useState<string | null>(callId || null);

  useEffect(() => {
    if (callId) setCallIdState(callId);
  }, [callId]);

  useEffect(() => {
    if (!callIdState) return;
    getCallDetail(callIdState).then(c => {
      const merged: PrecallContext = {
        ...defaultContext,
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
    window.postMessage({ type: 'COPILOT_START', callId: callIdState }, '*');
    alert(`Open Google Meet, then click the Sales-wise extension icon to select this call and start.`);
  }

  const set = (k: keyof PrecallContext) => (v: string | string[]) => setCtx(prev => ({ ...prev, [k]: v }));

  const hasRequired = ctx.company && ctx.contact && ctx.product_name && ctx.core_value_proposition && ctx.primary_goal;

  if (!callIdState) return <div style={{ padding: 32, color: DARK.text }}>No call selected. <Link to="/calls" style={{ color: DARK.accent }}>Back to calls</Link></div>;

  return (
    <>
    <CallProgressBar current="precall" />
    <div style={{ minHeight: '100vh', background: DARK.bg, padding: 32, color: DARK.text }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/calls" style={{ fontSize: 14, color: DARK.accent, textDecoration: 'none' }}>← Back to calls</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Pre-call setup</h1>

            {/* 1. Customer / Company Context */}
            <SectionCard title="CUSTOMER / COMPANY CONTEXT" required>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FieldBox label="Company" value={ctx.company || ''} onChange={set('company')} placeholder="Fieldmotion · B2B SaaS · Field service management · 220 employees" />
                <FieldBox label="Contact" value={ctx.contact || ''} onChange={set('contact')} placeholder="Priya Nair · VP of Sales · 4 yrs tenure · Reports to CRO" />
                <FieldBox label="Sales team size" value={ctx.sales_team_size || ''} onChange={set('sales_team_size')} placeholder="8 AEs + 3 SDRs · Quota: $1.2M ARR/AE · ~68% attainment" />
                <FieldBox label="Current stack" value={ctx.current_stack || ''} onChange={set('current_stack')} placeholder="Salesforce CRM · Outreach · Zoom · No coaching tool" />
                <FieldBox label="Known pain" value={ctx.known_pain || ''} onChange={set('known_pain')} rows={2} placeholder="Reps spend ~40 min/day on CRM. Pipeline reviews feel like guesswork." />
                <FieldBox label="Deal stage" value={ctx.deal_stage || ''} onChange={set('deal_stage')} placeholder="Stage 2 — Discovery (first call was SDR intro)" />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${DARK.border}` }}>
                <FieldBox label="Deal size est." value={ctx.deal_size_est || ''} onChange={set('deal_size_est')} placeholder="$14,400–$28,800 ARR" />
                <FieldBox label="Decision timeline" value={ctx.decision_timeline || ''} onChange={set('decision_timeline')} placeholder="Q3 budget cycle" />
                <FieldBox label="Economic buyer" value={ctx.economic_buyer || ''} onChange={set('economic_buyer')} placeholder="CRO (not yet engaged)" />
                <FieldBox label="Champion likelihood" value={ctx.champion_likelihood || ''} onChange={set('champion_likelihood')} placeholder="High — Priya raised pain unprompted" />
              </div>
            </SectionCard>

            {/* 2. Product Context */}
            <SectionCard title="PRODUCT / SERVICE CONTEXT" required>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FieldBox label="Product name" value={ctx.product_name || ''} onChange={set('product_name')} placeholder="Velaris (Revenue Intelligence Platform)" />
                <FieldBox label="Category" value={ctx.category || ''} onChange={set('category')} placeholder="B2B SaaS · Revenue Operations" />
                <div style={{ gridColumn: '1 / -1' }}>
                  <FieldBox label="Core value proposition" value={ctx.core_value_proposition || ''} onChange={set('core_value_proposition')} rows={2} placeholder="Consolidates pipeline, call recordings, CRM into single dashboard — eliminates manual updates" />
                </div>
                <FieldBox label="Pricing" value={ctx.pricing || ''} onChange={set('pricing')} placeholder="$180/seat/month · 5-seat minimum · Annual contract" />
                <FieldBox label="Key differentiators" value={ctx.key_differentiators || ''} onChange={set('key_differentiators')} rows={2} placeholder="Real-time live-call coaching vs Gong's post-call only. Native Salesforce write-back." />
                <FieldBox label="Known objections we handle" value={ctx.known_objections || ''} onChange={set('known_objections')} rows={2} placeholder="Budget, adoption, security" />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                {['MEDDIC-aligned', 'Challenger sell', 'Economic buyer focus'].map(tag => (
                  <span key={tag} style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 6,
                    background: tag === 'MEDDIC-aligned' ? `${DARK.purple}33` : tag === 'Challenger sell' ? `${DARK.orange}33` : `${DARK.teal}33`,
                    color: tag === 'MEDDIC-aligned' ? DARK.purple : tag === 'Challenger sell' ? DARK.orange : DARK.teal
                  }}>{tag}</span>
                ))}
              </div>
            </SectionCard>

            {/* 3. Objectives / Goals */}
            <SectionCard title="OBJECTIVES / GOALS" required>
              <GoalItem label="Primary goal" color={DARK.red} value={ctx.primary_goal || ''} onChange={set('primary_goal')} placeholder="Qualify economic buyer. Get Priya to commit to 3-way call with CRO." />
              <GoalItem label="Secondary goal" color={DARK.red} value={ctx.secondary_goal || ''} onChange={set('secondary_goal')} placeholder="Surface business impact of 68% attainment — translate pain to dollar figure." />
              <GoalItem label="Demo focus" color={DARK.orange} value={ctx.demo_focus || ''} onChange={set('demo_focus')} placeholder="Show live-call coaching first (10 min). Defer CRM automation unless asked." />
              <GoalItem label="Objection to pre-empt" color={DARK.orange} value={ctx.objection_to_preempt || ''} onChange={set('objection_to_preempt')} placeholder="Address bad past experience with coaching tool proactively." />
              <GoalItem label="Exit criteria" color={DARK.green} value={ctx.exit_criteria || ''} onChange={set('exit_criteria')} placeholder="CRO intro scheduled, or Priya sends business case email. No 'I'll think about it'." />
            </SectionCard>

            {/* 4. Past Conversations */}
            <SectionCard title="PAST CONVERSATIONS" required={false}>
              {(ctx.past_conversations || []).map((conv, i) => (
                <div key={i} style={{ marginBottom: 16, padding: 12, background: DARK.field, borderRadius: 8, border: `1px solid ${DARK.border}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <input value={conv.date || ''} onChange={e => {
                      const next = [...(ctx.past_conversations || [])];
                      next[i] = { ...next[i], date: e.target.value };
                      setCtx(prev => ({ ...prev, past_conversations: next }));
                    }} placeholder="14 Mar 2026" style={{ padding: 6, background: DARK.bg, border: `1px solid ${DARK.border}`, borderRadius: 4, color: DARK.text, fontSize: 12 }} />
                    <input value={conv.type || ''} onChange={e => {
                      const next = [...(ctx.past_conversations || [])];
                      next[i] = { ...next[i], type: e.target.value };
                      setCtx(prev => ({ ...prev, past_conversations: next }));
                    }} placeholder="SDR intro call" style={{ padding: 6, background: DARK.bg, border: `1px solid ${DARK.border}`, borderRadius: 4, color: DARK.text, fontSize: 12 }} />
                    <input value={conv.duration || ''} onChange={e => {
                      const next = [...(ctx.past_conversations || [])];
                      next[i] = { ...next[i], duration: e.target.value };
                      setCtx(prev => ({ ...prev, past_conversations: next }));
                    }} placeholder="18 min" style={{ padding: 6, background: DARK.bg, border: `1px solid ${DARK.border}`, borderRadius: 4, color: DARK.text, fontSize: 12 }} />
                    <input value={conv.channel || ''} onChange={e => {
                      const next = [...(ctx.past_conversations || [])];
                      next[i] = { ...next[i], channel: e.target.value };
                      setCtx(prev => ({ ...prev, past_conversations: next }));
                    }} placeholder="Zoom" style={{ padding: 6, background: DARK.bg, border: `1px solid ${DARK.border}`, borderRadius: 4, color: DARK.text, fontSize: 12 }} />
                  </div>
                  <textarea value={conv.content || ''} onChange={e => {
                    const next = [...(ctx.past_conversations || [])];
                    next[i] = { ...next[i], content: e.target.value };
                    setCtx(prev => ({ ...prev, past_conversations: next }));
                  }} placeholder="Summary of the conversation..." rows={2} style={{ width: '100%', padding: 8, background: DARK.bg, border: `1px solid ${DARK.border}`, borderRadius: 4, color: DARK.text, fontSize: 12, marginBottom: 8, boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <input value={conv.outcome || ''} onChange={e => {
                      const next = [...(ctx.past_conversations || [])];
                      next[i] = { ...next[i], outcome: e.target.value };
                      setCtx(prev => ({ ...prev, past_conversations: next }));
                    }} placeholder="Outcome: Demo booked" style={{ flex: 1, marginRight: 8, padding: 6, background: DARK.bg, border: `1px solid ${DARK.border}`, borderRadius: 4, color: DARK.text, fontSize: 12 }} />
                    <button onClick={() => setCtx(prev => ({ ...prev, past_conversations: (prev.past_conversations || []).filter((_, j) => j !== i) }))}
                      style={{ padding: '6px 10px', fontSize: 11, background: 'transparent', border: `1px solid ${DARK.red}66`, borderRadius: 4, color: DARK.red, cursor: 'pointer' }}>Remove</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setCtx(prev => ({ ...prev, past_conversations: [...(prev.past_conversations || []), { date: '', type: '', duration: '', channel: '', content: '', outcome: '' }] }))}
                style={{ padding: '8px 14px', fontSize: 12, background: DARK.field, border: `1px solid ${DARK.border}`, borderRadius: 6, color: DARK.text, cursor: 'pointer', marginBottom: 16 }}>
                + Add conversation
              </button>
              <FieldBox label="Open objections from history" value={ctx.open_objections_from_history || ''} onChange={set('open_objections_from_history')} placeholder="Bad past experience with coaching tool · Economic buyer not looped in" />
            </SectionCard>

            <button onClick={handleGenerate} disabled={loading || !hasRequired}
              style={{ width: '100%', padding: 14, background: DARK.accent, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Generating...' : 'Generate call plan'}
            </button>
            {planError && (
              <div style={{ marginTop: 12, padding: 12, background: `${DARK.red}22`, border: `1px solid ${DARK.red}66`, borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 13, color: DARK.red }}>{planError}</p>
              </div>
            )}
          </div>

          {/* Right: Call plan output */}
          <div style={{ position: 'sticky', top: 24 }}>
            {!plan && <div style={{ color: DARK.label, marginTop: 60, textAlign: 'center' }}>Fill in required context and generate your plan</div>}
            {plan && (
              <div style={{ background: DARK.card, borderRadius: 12, padding: 20, border: `1px solid ${DARK.border}` }}>
                <h2 style={{ marginBottom: 16, fontSize: 18 }}>Call plan</h2>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: DARK.label, textTransform: 'uppercase', marginBottom: 8 }}>MEDDIC gaps</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries((plan.meddic_gaps as Record<string, boolean>) || {}).map(([k, filled]) => (
                      <span key={k} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: filled ? `${DARK.green}33` : DARK.field, color: filled ? DARK.green : DARK.label }}>
                        {filled ? '✓ ' : ''}{MEDDIC_LABELS[k] || k}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: DARK.label, textTransform: 'uppercase', marginBottom: 8 }}>Priority questions</p>
                  {((plan.questions as Array<{ question: string; meddic_field: string; why: string; priority: number }>) || []).map((q, i) => (
                    <div key={i} style={{ background: DARK.field, borderRadius: 8, padding: 12, marginBottom: 8, borderLeft: `3px solid ${DARK.accent}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: DARK.accent }}>{MEDDIC_LABELS[q.meddic_field] || q.meddic_field}</span>
                        <span style={{ fontSize: 10, color: DARK.label }}>#{q.priority}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13 }}>&quot;{q.question}&quot;</p>
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: DARK.label }}>{q.why}</p>
                    </div>
                  ))}
                </div>
                {plan.watch_for && (
                  <div style={{ background: `${DARK.orange}22`, border: `1px solid ${DARK.orange}66`, borderRadius: 8, padding: 12, marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: DARK.orange, margin: '0 0 4px' }}>Watch for</p>
                    <p style={{ margin: 0, fontSize: 13, color: DARK.text }}>{String(plan.watch_for)}</p>
                  </div>
                )}
                <button onClick={launchCopilot}
                  style={{ width: '100%', padding: 12, background: DARK.green, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Start copilot when call begins →
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
