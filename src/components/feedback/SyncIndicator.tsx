import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Link } from 'react-router-dom';

export const SyncIndicator: React.FC = () => {
  const { isOnline, pendingSyncCount } = useStore();

  return (
    <div className="flex items-center gap-2">
      {/* Real connection status pill */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
          isOnline
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-100 text-amber-800 border-amber-300'
        }`}
        title={isOnline ? 'Network Connected (Cloud Active)' : 'Offline (Saving Safely to Device)'}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
          }`}
        />
        <span className="hidden xs:inline">{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Pending Sync badge with link to sync queue */}
      {pendingSyncCount > 0 && (
        <Link
          to="/sync-status"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
          title="Pending offline transactions waiting to sync"
        >
          <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
          <span>Sync ({pendingSyncCount})</span>
        </Link>
      )}
    </div>
  );
};
