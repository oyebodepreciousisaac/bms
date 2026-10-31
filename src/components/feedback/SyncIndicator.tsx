import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Link } from 'react-router-dom';

export const SyncIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingSyncCount } = useStore();

  return (
    <div className="flex items-center gap-2">
      {/* Real connection & automated sync status pill */}
      {isSyncing ? (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-blue-50 text-blue-700 border-blue-200 transition-colors shadow-xs"
          title="Seamless automatic background synchronization in progress"
        >
          <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
          <span>Syncing...</span>
        </div>
      ) : isOnline ? (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 transition-colors"
          title="Network Connected — Realtime automatic cloud synchronization active"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="hidden xs:inline">Connected</span>
        </div>
      ) : (
        <Link
          to="/sync-status"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 transition-colors"
          title="Offline mode: Sales are queued locally in IndexedDB and will auto-sync once connected"
        >
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Offline {pendingSyncCount > 0 ? `(${pendingSyncCount} Queued)` : ''}</span>
        </Link>
      )}

      {/* Subtle indicator if items are queued and not currently syncing */}
      {!isSyncing && pendingSyncCount > 0 && isOnline && (
        <Link
          to="/sync-status"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
          title="Transactions auto-syncing shortly"
        >
          <RefreshCw className="h-2.5 w-2.5 text-amber-600" />
          <span>{pendingSyncCount} pending</span>
        </Link>
      )}
    </div>
  );
};
