/**
 * Every page hand-rolled its own `<h1 className="mb-... text-2xl
 * font-bold">` (with small, inconsistent spacing variants). One component
 * so a future visual refresh (font, size, spacing, a breadcrumb, whatever)
 * is a single-file change instead of touching every page in the app.
 */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
    </div>
  );
}
