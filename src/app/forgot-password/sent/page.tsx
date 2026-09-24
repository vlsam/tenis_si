import { PageHeader } from '@/components/ui/PageHeader';

export default function ForgotPasswordSentPage() {
  return (
    <div className="mx-auto max-w-sm">
      <PageHeader
        title="Skontrolujte e-mail"
        subtitle="Ak s touto adresou existuje účet, poslali sme naň odkaz na obnovu hesla."
      />
    </div>
  );
}
