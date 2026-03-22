import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCall, updateProductDefaults } from '../lib/api';
import { Chrome, Package, Rocket, ChevronRight, X } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [productName, setProductName] = useState('');
  const [valueProposition, setValueProposition] = useState('');
  const [pricing, setPricing] = useState('');
  const [callName, setCallName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const steps = [
    { icon: Chrome, label: 'Extension', title: 'Install the Chrome extension' },
    { icon: Package, label: 'Product', title: 'Set up your product info' },
    { icon: Rocket, label: 'First call', title: 'Create your first call' },
  ];

  async function handleSaveDefaults() {
    if (!productName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await updateProductDefaults({
        product_name: productName.trim(),
        core_value_proposition: valueProposition.trim() || undefined,
        pricing: pricing.trim() || undefined,
      });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCall() {
    if (!callName.trim()) return;
    setSaving(true);
    setError('');
    try {
      const call = await createCall({
        name: callName.trim(),
        contact_name: '',
        company_name: '',
        goal: 'Discovery',
      });
      localStorage.setItem('onboarding_complete', 'true');
      onComplete();
      navigate(`/calls/${call.id}/precall`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create call');
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    localStorage.setItem('onboarding_complete', 'true');
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-[520px] rounded-2xl border border-dark-border bg-dark-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
          <h2 className="text-lg font-bold text-dark-text font-display">Get started with Sales-Wise</h2>
          <button onClick={handleSkip} className="text-dark-muted hover:text-dark-label transition-colors" aria-label="Skip onboarding">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 px-6 pt-5">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i < step ? 'bg-success text-white' : i === step ? 'bg-accent text-white' : 'bg-dark-border text-dark-muted'
              }`}>
                {i < step ? '\u2713' : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? 'text-dark-text' : 'text-dark-muted'}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-success' : 'bg-dark-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 py-6">
          {step === 0 && (
            <div>
              <p className="text-sm text-dark-label mb-4">
                Sales-Wise uses a Chrome extension to provide live coaching during Google Meet calls.
              </p>
              <a
                href="https://chromewebstore.google.com/detail/sales-wise"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-dark-border bg-dark-card p-4 transition hover:border-accent/50 hover:bg-dark-card/80"
              >
                <Chrome className="h-8 w-8 text-accent shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-dark-text text-sm">Install Sales-Wise for Chrome</p>
                  <p className="text-xs text-dark-label mt-0.5">Opens Chrome Web Store in a new tab</p>
                </div>
                <ChevronRight className="h-4 w-4 text-dark-muted" />
              </a>
              <p className="text-xs text-dark-muted mt-4">
                Already installed? Great — you can skip this step.
              </p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors">
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm text-dark-label mb-4">
                Enter your product info once — it auto-fills on every call so you never retype it.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-dark-label block mb-1">Product name *</label>
                  <input
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="e.g. Acme CRM"
                    className="w-full p-2.5 bg-dark-card border border-dark-border rounded-lg text-dark-text text-sm outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-label block mb-1">Core value proposition</label>
                  <textarea
                    value={valueProposition}
                    onChange={e => setValueProposition(e.target.value)}
                    placeholder="What problem does your product solve?"
                    rows={2}
                    className="w-full p-2.5 bg-dark-card border border-dark-border rounded-lg text-dark-text text-sm outline-none focus:border-accent resize-y"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-label block mb-1">Pricing</label>
                  <input
                    value={pricing}
                    onChange={e => setPricing(e.target.value)}
                    placeholder="e.g. $99/seat/month"
                    className="w-full p-2.5 bg-dark-card border border-dark-border rounded-lg text-dark-text text-sm outline-none focus:border-accent"
                  />
                </div>
              </div>
              {error && <p className="mt-2 text-xs text-danger">{error}</p>}
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-lg border border-dark-border text-dark-label text-sm hover:bg-dark-card transition-colors">
                  Back
                </button>
                <button onClick={handleSaveDefaults} disabled={saving || !productName.trim()} className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save & continue'}
                </button>
                <button onClick={() => setStep(2)} className="px-4 py-2.5 text-xs text-dark-muted hover:text-dark-label transition-colors">
                  Skip
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-dark-label mb-4">
                Name your first call — you'll fill in the details on the next screen.
              </p>
              <div>
                <label className="text-xs text-dark-label block mb-1">Call name</label>
                <input
                  value={callName}
                  onChange={e => setCallName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCall()}
                  placeholder="e.g. Acme Corp — Discovery"
                  className="w-full p-2.5 bg-dark-card border border-dark-border rounded-lg text-dark-text text-sm outline-none focus:border-accent"
                />
              </div>
              {error && <p className="mt-2 text-xs text-danger">{error}</p>}
              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-lg border border-dark-border text-dark-label text-sm hover:bg-dark-card transition-colors">
                  Back
                </button>
                <button onClick={handleCreateCall} disabled={saving || !callName.trim()} className="flex-1 py-2.5 rounded-lg bg-success text-white text-sm font-semibold hover:bg-success/90 transition-colors disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create call & start prep'}
                </button>
                <button onClick={handleSkip} className="px-4 py-2.5 text-xs text-dark-muted hover:text-dark-label transition-colors">
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
