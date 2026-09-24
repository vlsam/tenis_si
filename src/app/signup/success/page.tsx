import { PageHeader } from '@/components/ui/PageHeader';

export default function SignupSuccessPage() {
  return (
    <div className="mx-auto max-w-sm">
      <PageHeader
        title="Skoro hotovo"
        subtitle="Poslali sme vám potvrdzovací e-mail. Kliknite na odkaz v ňom, aby ste mohli konto použiť."
      />
    </div>
  );
}
