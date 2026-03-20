type Step = 'precall' | 'live' | 'postcall';

const STEPS: { key: Step; label: string }[] = [
  { key: 'precall', label: 'Pre-call' },
  { key: 'live', label: 'Live' },
  { key: 'postcall', label: 'Post-call' },
];

export default function CallProgressBar({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex(s => s.key === current);
  return (
    <div className="border-b border-[#2a2a3a] bg-[#0a0a0f] px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-2">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step.key} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`h-px w-8 ${done ? 'bg-indigo-500' : 'bg-[#2a2a3a]'}`} />
              )}
              <div className="flex items-center gap-1.5">
                <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                  active ? 'bg-indigo-500 text-white' :
                  done ? 'bg-indigo-500/20 text-indigo-400' :
                  'bg-[#2a2a3a] text-[#8b8ba0]'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium transition-colors ${
                  active ? 'text-indigo-400' :
                  done ? 'text-[#8b8ba0]' :
                  'text-[#5a5a70]'
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
