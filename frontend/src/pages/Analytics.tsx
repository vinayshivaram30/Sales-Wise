import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target } from 'lucide-react';
import { getAnalyticsSummary } from '../lib/api';

interface AnalyticsData {
  total_calls: number;
  calls_this_week: number;
  avg_deal_score: number;
  avg_framework_coverage: number;
  framework_breakdown: Record<string, number>;
  top_objections: { text: string; count: number }[];
  deal_stage_distribution: Record<string, number>;
  trend: { week: string; calls: number; avg_score: number }[];
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    setError('');
    try {
      const d = await getAnalyticsSummary();
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-10">
        <h1 className="text-2xl font-bold text-dark-text font-display mb-8">Performance</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-dark-border bg-dark-surface p-5 animate-pulse">
              <div className="h-4 w-1/2 rounded bg-dark-border mb-3" />
              <div className="h-8 w-1/3 rounded bg-dark-border" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-10">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button onClick={loadAnalytics} className="text-sm text-indigo-400 hover:text-indigo-300">Retry</button>
        </div>
      </div>
    );
  }

  if (!data || data.total_calls === 0) {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-10">
        <h1 className="text-2xl font-bold text-dark-text font-display mb-8">Performance</h1>
        <div className="rounded-xl border border-dark-border bg-dark-surface p-12 text-center">
          <BarChart3 className="w-10 h-10 text-dark-muted mx-auto mb-3" />
          <p className="text-dark-label text-sm mb-1">Complete your first call to see analytics.</p>
          <p className="text-dark-muted text-xs">Your performance data will appear here after calls are completed.</p>
        </div>
      </div>
    );
  }

  const maxStageCount = Math.max(...Object.values(data.deal_stage_distribution), 1);

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-10">
      <h1 className="text-2xl font-bold text-dark-text font-display mb-2">Performance</h1>
      <p className="text-dark-label text-sm mb-8">Last 8 weeks</p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center gap-2 text-dark-label mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Total Calls</span>
          </div>
          <p className="text-3xl font-bold text-dark-text font-mono tabular-nums">
            {data.total_calls}
          </p>
          <p className="text-xs text-dark-muted mt-1">{data.calls_this_week} this week</p>
        </div>
        <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center gap-2 text-dark-label mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Avg Deal Score</span>
          </div>
          <p className="text-3xl font-bold text-dark-text font-mono tabular-nums">
            {data.avg_deal_score}%
          </p>
        </div>
        <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center gap-2 text-dark-label mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm">Framework Coverage</span>
          </div>
          <p className="text-3xl font-bold text-dark-text font-mono tabular-nums">
            {Math.round(data.avg_framework_coverage * 100)}%
          </p>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Framework Breakdown */}
        <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-dark-label mb-4">Framework Usage</h2>
          <div className="flex flex-col gap-2">
            {Object.entries(data.framework_breakdown).map(([fw, count]) => (
              <div key={fw} className="flex items-center justify-between">
                <span className="text-sm text-dark-text">{fw}</span>
                <span className="text-sm font-medium text-indigo-400 font-mono tabular-nums">
                  {count} ({data.total_calls > 0 ? Math.round(count / data.total_calls * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Objections */}
        <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-dark-label mb-4">Top Objections</h2>
          {data.top_objections.length === 0 ? (
            <p className="text-sm text-dark-muted italic">No objections recorded yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.top_objections.slice(0, 5).map((obj, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-dark-text capitalize">{obj.text}</span>
                  <span className="inline-flex items-center rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-medium text-indigo-400 font-mono">
                    {obj.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deal Stage Distribution */}
      <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-dark-label mb-4">Deal Stage Distribution</h2>
        <div className="flex flex-col gap-3">
          {Object.entries(data.deal_stage_distribution).map(([stage, count]) => (
            <div key={stage} className="flex items-center gap-3">
              <span className="text-sm text-dark-text w-28 shrink-0">{stage}</span>
              <div className="flex-1 h-2 bg-dark-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(count / maxStageCount) * 100}%`, opacity: 0.6 + (count / maxStageCount) * 0.4 }}
                />
              </div>
              <span className="text-sm text-dark-label font-mono tabular-nums w-8 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
