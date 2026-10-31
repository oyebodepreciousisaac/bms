import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { localDb, PendingSyncItem } from '../../db/localDb';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatDateTime, formatCurrency } from '../../lib/formatters';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';

export const SyncStatusPage: React.FC = () => {
  const { isOnline, toggleOnline, syncOfflineQueue, pendingSyncCount, sales } = useStore();
  const [queueItems, setQueueItems] = useState<PendingSyncItem[]>([]);
  const [dbSalesCount, setDbSalesCount] = useState<number>(0);

  const loadLocalDbData = async () => {
    try {
      const items = await localDb.syncQueue.toArray();
      setQueueItems(items);
      const sCount = await localDb.sales.count();
      setDbSalesCount(sCount);
    } catch (e) {
      console.warn('Dexie read note:', e);
    }
  };

  useEffect(() => {
    loadLocalDbData();
    const interval = setInterval(loadLocalDbData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClearSynced = async () => {
    await localDb.syncQueue.where('status').equals('synced').delete();
    loadLocalDbData();
  };

  const offlineSales = sales.filter((s) => s.syncStatus === 'saved_locally');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Offline PWA & Cloud Synchronization
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor offline transaction queues, network recovery status, and Dexie IndexedDB storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isOnline ? 'outline' : 'primary'}
            onClick={toggleOnline}
            className={`gap-1.5 text-xs font-bold ${
              isOnline
                ? 'border-success/40 text-success hover:bg-success-light'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span>{isOnline ? 'Simulating Online' : 'Simulating Offline'}</span>
          </Button>

          {pendingSyncCount > 0 && (
            <Button size="sm" onClick={syncOfflineQueue} className="gap-1.5 text-xs shadow-xs font-bold">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sync All Pending ({pendingSyncCount})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Connection State Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              isOnline ? 'bg-success-light text-success' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase font-semibold">Network State</div>
            <div className="text-base font-black text-foreground">
              {isOnline ? 'Connected (Cloud Active)' : 'Offline (Local Safe)'}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase font-semibold">Pending Local Queue</div>
            <div className="text-base font-black text-foreground">
              {pendingSyncCount} transactions
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase font-semibold">IndexedDB Storage</div>
            <div className="text-base font-black text-foreground">
              Dexie.js Active
            </div>
          </div>
        </Card>
      </div>

      {/* Offline Operational Guarantee Notice */}
      <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs text-blue-950 space-y-1">
        <div className="font-bold flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-blue-700" />
          <span>Offline Resilience in Bakery Operations:</span>
        </div>
        <p className="text-[11px] text-blue-900 leading-relaxed">
          When mobile network drops at counter or market depots, sales are written immediately to IndexedDB with <strong>"saved_locally"</strong> status. Printable thermal receipts and invoices work offline without delays. Once network reconnects, transactions are synchronized automatically with idempotent client transaction IDs (UUIDs) to prevent any duplicate entries.
        </p>
      </div>

      {/* Pending Transactions List */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base">Pending Offline Transactions</CardTitle>
            </div>
            {pendingSyncCount > 0 && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {pendingSyncCount} Waiting to Sync
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Receipt / ID</th>
                  <th className="px-4 py-3">Time Recorded</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Sync Status</th>
                  <th className="px-4 py-3">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {offlineSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600/50" />
                        <span className="font-semibold text-xs">All sales and payments are fully synchronized!</span>
                        <span className="text-[11px] text-muted-foreground">
                          Toggle "Offline" in the top bar to test capturing offline receipts.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  offlineSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-bold text-foreground">
                        {sale.receiptNumber}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(sale.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {sale.customerName}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="h-3 w-3" />
                          SAVED LOCALLY
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {sale.recordedBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

