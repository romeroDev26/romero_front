import { useEffect, useState } from 'react';

/** Wait briefly for the two uploads without leaving a permanent polling loop. */
export function useReprogrammedTicketPolling(invoiceId: number, needsRefresh: boolean, refetch: (options: { cancelRefetch: boolean }) => Promise<unknown>) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    setTimedOut(false);
    if (!needsRefresh) return;
    const interval = setInterval(() => { void refetch({ cancelRefetch: false }); }, 2000);
    const timeout = setTimeout(() => { clearInterval(interval); setTimedOut(true); }, 60_000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [invoiceId, needsRefresh, refetch]);
  return needsRefresh && !timedOut;
}
