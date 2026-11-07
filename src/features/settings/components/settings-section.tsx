interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

/** One block of the settings page: explanation on the left, card on the right (stacked on phones). */
export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="grid gap-4 border-b py-8 first:pt-0 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10">
      <div className="space-y-1">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-xl border bg-card p-5 sm:p-6">{children}</div>
    </section>
  );
}
