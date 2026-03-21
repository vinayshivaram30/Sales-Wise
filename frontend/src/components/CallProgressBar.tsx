type Step = 'precall' | 'live' | 'postcall';

const STEPS: { key: Step; label: string }[] = [
  { key: 'precall', label: 'Pre-call' },
  { key: 'live', label: 'Live' },
  { key: 'postcall', label: 'Post-call' },
];

export default function CallProgressBar({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex(s => s.key === current);
  return (
    <div className="border-b border-dark-border bg-dark-bg px-6 py-3">
      <div className="mx-auto flex max-w-[1120px] items-center gap-2">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`h-px w-8 ${done ? 'bg-accent' : 'bg-dark-border'}`} />
              )}
              <div className="flex items-center gap-1.5">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  active ? 'bg-accent text-white' :
                  done ? 'bg-accent/20 text-accent' :
                  'bg-dark-border text-dark-label'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium transition-colors ${
                  active ? 'text-accent' :
                  done ? 'text-dark-label' :
                  'text-dark-muted'
                }`}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
