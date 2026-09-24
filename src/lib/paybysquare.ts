import 'server-only';
import { CurrencyCode, PaymentOptions, encode } from 'bysquare/pay';
import QRCode from 'qrcode';

/**
 * Verified against the bysquare v4 TypeScript README (xseman/bysquare) on
 * 2026-09-22 - https://github.com/xseman/bysquare/blob/master/typescript/README.md
 * Import path is `bysquare/pay` (not the package root), `type`/`currencyCode`
 * are enum values (not raw strings), and `beneficiary.name` is required.
 */
export async function generateTopUpQrDataUrl(params: {
  transactionId: number;
  amount: number;
  variableSymbol: string;
  iban: string;
  beneficiaryName: string;
}): Promise<string> {
  const payBySquareString = encode({
    invoiceId: `REZ-${params.transactionId}`,
    payments: [
      {
        type: PaymentOptions.PaymentOrder,
        currencyCode: CurrencyCode.EUR,
        amount: params.amount,
        variableSymbol: params.variableSymbol,
        paymentNote: 'Dobitie kreditu REZERVACIE',
        beneficiary: { name: params.beneficiaryName },
        bankAccounts: [{ iban: params.iban }]
      }
    ]
  });

  return QRCode.toDataURL(payBySquareString, { errorCorrectionLevel: 'M', margin: 1, width: 300 });
}
