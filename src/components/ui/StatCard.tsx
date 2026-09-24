export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-1 text-center">
      <p className="text-base font-bold text-court sm:text-lg lg:text-xl">{value}</p>
      <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  );
}
