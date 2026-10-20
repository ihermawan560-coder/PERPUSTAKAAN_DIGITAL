import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CloudCheck } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-amber-600 text-white px-4 py-2 text-xs font-semibold shadow-xl border border-amber-500 animate-in slide-in-from-bottom duration-300 no-print">
      <WifiOff className="w-4 h-4 text-amber-200 animate-pulse shrink-0" />
      <span>Mode Offline — Data tersimpan aman di perangkat dan akan disinkronkan saat terhubung kembali.</span>
    </div>
  );
};
