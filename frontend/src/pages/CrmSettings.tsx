import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getCrmStatus, disconnectCrm, getCrmAuthorizeUrl } from '../lib/api';

interface CrmStatus {
  connected: boolean;
  provider: string;
  instance_url?: string;
  last_sync?: string;
}

export default function CrmSettings() {
  const [status, setStatus] = useState<CrmStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      const s = await getCrmStatus();
      setStatus(s);
    } catch {
      setStatus({ connected: false, provider: 'salesforce' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await disconnectCrm();
      setStatus({ connected: false, provider: 'salesforce' });
    } finally {
      setDisconnecting(false);
    }
  }

  function handleConnect() {
    window.location.href = getCrmAuthorizeUrl();
  }

  return (
    <div className="mx-auto max-w-2xl py-2">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-bold text-dark-text font-display mb-2">Integrations</h1>
      <p className="text-dark-label text-sm mb-8">Connect your CRM for automatic call summary sync</p>

      {/* Salesforce Card */}
      <div className="rounded-xl border border-dark-border bg-dark-surface p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dark-card flex items-center justify-center text-lg font-bold text-[#00A1E0]">
              SF
            </div>
            <div>
              <h2 className="text-base font-semibold text-dark-text">Salesforce</h2>
              <p className="text-xs text-dark-muted">Auto-sync call summaries as Tasks</p>
            </div>
          </div>
          {!loading && (
            status?.connected ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                <CheckCircle className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-dark-muted">
                <XCircle className="w-3.5 h-3.5" />
                Disconnected
              </span>
            )
          )}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-2/3 rounded bg-dark-border" />
            <div className="h-10 rounded-lg bg-dark-border" />
          </div>
        ) : status?.connected ? (
          <div>
            <div className="rounded-lg bg-dark-card border border-dark-border p-4 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-label">Instance</span>
                <a
                  href={status.instance_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                >
                  {status.instance_url?.replace('https://', '')}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {status.last_sync && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-dark-label">Last sync</span>
                  <span className="text-dark-text font-mono text-xs">
                    {new Date(status.last_sync).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-dark-muted mb-4">
              Auto-syncs: Call summary, deal stage, next steps
            </p>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full py-2.5 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-40"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect Salesforce'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-dark-label mb-4">
              Connect Salesforce to automatically sync call summaries, deal stages, and next steps after every call.
            </p>
            <button
              onClick={handleConnect}
              className="w-full py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors"
            >
              Connect Salesforce
            </button>
          </div>
        )}
      </div>

      {/* HubSpot — Coming Soon */}
      <div className="mt-4 rounded-xl border border-dark-border bg-dark-surface p-6 opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-dark-card flex items-center justify-center text-lg font-bold text-[#FF7A59]">
            HS
          </div>
          <div>
            <h2 className="text-base font-semibold text-dark-text">HubSpot</h2>
            <span className="inline-flex items-center gap-1 text-xs text-dark-muted">
              <AlertCircle className="w-3 h-3" />
              Coming soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
