import { IPlainTransactionObject, Transaction } from '@multiversx/sdk-core/out';
import { processBase64Fields } from '@multiversx/sdk-js-web-wallet-io/out/helpers';
import { buildWalletQueryString } from './buildWalletQueryString';

export const buildTransactionsQueryString = ({
  transactions,
  callbackUrl
}: {
  transactions: Transaction[];
  callbackUrl?: string;
}): string => {
  const jsonToSend: Record<string, (string | number | undefined)[]> = {};
  transactions.map((tx) => {
    const plainTx = processBase64Fields(tx.toPlainObject()).decode();

    for (const txProp in plainTx) {
      if (
        plainTx.hasOwnProperty(txProp) &&
        !jsonToSend.hasOwnProperty(txProp)
      ) {
        jsonToSend[txProp] = [];
      }
      const value = plainTx[txProp as keyof IPlainTransactionObject];
      jsonToSend[txProp].push(value);
    }
  });

  return buildWalletQueryString({
    params: { ...jsonToSend, callbackUrl }
  });
};
