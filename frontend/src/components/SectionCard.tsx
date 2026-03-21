interface SectionCardProps {
  /** Overline title (rendered uppercase) */
  title: string;
  /** Optional icon before the title */
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-dark-label">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
