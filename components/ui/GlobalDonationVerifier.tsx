'use client';

import { useState, useEffect, useCallback } from 'react';
import { verifyCryptoTransaction, CryptoNetwork } from '@/lib/crypto-verify';
import { ValidationFeedbackModal } from '@/components/ui/ValidationFeedbackModal';
import { clearSupportAccess, getSupportAccess, grantSupportAccess, MONTH_ACCESS_MS } from '@/lib/support-access';

export function GlobalDonationVerifier() {
  const [validationMessage, setValidationMessage] = useState<{
    type: 'success' | 'error';
    title: string;
    text: string;
  } | null>(null);

  const checkAndVerify = useCallback(async () => {
    try {
      const verifyDataStr = localStorage.getItem('zivox_donation_verify');
      if (!verifyDataStr) return;

      const verifyData = JSON.parse(verifyDataStr);
      if (verifyData && verifyData.status === 'pending' && verifyData.txid && verifyData.coin) {
        // Lock verification status immediately to prevent duplicate runs
        verifyData.status = 'verifying';
        localStorage.setItem('zivox_donation_verify', JSON.stringify(verifyData));

        const EXPECTED_ADDRESSES: Record<string, string> = {
          usdt: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd',
          usdc: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd',
          eth: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd',
          bnb: '0xba3898d8b3d232111a2193c4d330e53cf4cf38cd',
          btc: 'bc1q7rdc229skeumz0tfecmqnajhkw9s97ttrl0hgq'
        };

        const NETWORK_MAP: Record<string, CryptoNetwork> = {
          usdt: 'polygon',
          usdc: 'polygon',
          eth: 'ethereum',
          bnb: 'bsc',
          btc: 'bitcoin'
        };

        const addr = EXPECTED_ADDRESSES[verifyData.coin];
        const net = NETWORK_MAP[verifyData.coin];

        if (addr && net) {
          console.log(`[ZIVOX Global] Verifying TxID: ${verifyData.txid} on ${net}...`);
          const res = await verifyCryptoTransaction(verifyData.txid, net, addr);

          if (res.isValid) {
            // Success!
            verifyData.status = 'verified';
            localStorage.setItem('zivox_donation_verify', JSON.stringify(verifyData));
            
            grantSupportAccess(MONTH_ACCESS_MS);

            setValidationMessage({
              type: 'success',
              title: 'Premium Unlocked!',
              text: 'Your transaction was verified successfully. Enjoy 1 month of uninterrupted streaming!'
            });

            // Notify other components (like VideoPlayer)
            window.dispatchEvent(new Event('zivox_donation_update'));
          } else if (!res.isPending) {
            // Failed verification
            if (!getSupportAccess().isActive) {
              clearSupportAccess();
            }
            localStorage.removeItem('zivox_donation_verify');

            let text = 'Your transaction could not be verified.';
            if (res.reason === 'not_found') text = 'Transaction ID not found on the blockchain. Please check for typos.';
            if (res.reason === 'too_old') text = 'This transaction is older than 30 days. Please make a new donation to renew premium.';
            if (res.reason === 'wrong_address') text = 'This transaction was not sent to our official wallet address.';

            setValidationMessage({
              type: 'error',
              title: 'Verification Failed',
              text
            });

            // Notify other components
            window.dispatchEvent(new Event('zivox_donation_update'));
          } else {
            // Network / RPC rate limit, revert status to pending so it can retry later
            verifyData.status = 'pending';
            localStorage.setItem('zivox_donation_verify', JSON.stringify(verifyData));
          }
        }
      }
    } catch (e) {
      console.error('[ZIVOX Global] Error in verification:', e);
      // Revert status to pending in case of error
      try {
        const verifyDataStr = localStorage.getItem('zivox_donation_verify');
        if (verifyDataStr) {
          const verifyData = JSON.parse(verifyDataStr);
          if (verifyData.status === 'verifying') {
            verifyData.status = 'pending';
            localStorage.setItem('zivox_donation_verify', JSON.stringify(verifyData));
          }
        }
      } catch (err) {}
    }
  }, []);

  useEffect(() => {
    // 1. Initial check on mount
    checkAndVerify();

    // 2. Setup interval check (e.g. check every 4 seconds for new pendings)
    const interval = setInterval(checkAndVerify, 4000);

    // 3. Listen to explicit trigger events
    window.addEventListener('zivox_donation_update', checkAndVerify);

    return () => {
      clearInterval(interval);
      window.removeEventListener('zivox_donation_update', checkAndVerify);
    };
  }, [checkAndVerify]);

  if (!validationMessage) return null;

  return (
    <ValidationFeedbackModal
      message={validationMessage}
      onClose={() => setValidationMessage(null)}
    />
  );
}
