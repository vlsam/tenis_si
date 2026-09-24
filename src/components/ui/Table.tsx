/**
 * Shared table primitives - every admin/data table in the app (admin/users,
 * admin/orders, admin/credit/pending, admin/users/[id], credit/topup,
 * cennik) hand-rolled the same `<table className="w-full text-sm">` /
 * header-row / border-t row markup. Restyling a table now means editing
 * this one file instead of six pages.
 */
export function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full text-sm">{children}</table>;
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="text-left text-neutral-500 dark:text-neutral-400">{children}</tr>
    </thead>
  );
}

export function Th({ children }: { children?: React.ReactNode }) {
  return <th className="pb-2 pr-4 font-medium">{children}</th>;
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="border-t border-neutral-200 dark:border-neutral-700">{children}</tr>;
}

export function Td({ children }: { children?: React.ReactNode }) {
  return <td className="py-2 pr-4">{children}</td>;
}
