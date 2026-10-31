import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { DistributorAllocation } from '../../types/domain.types';
import {
  Truck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  PlusCircle,
  ClipboardCheck,
  Package,
  Calendar,
  Filter,
} from 'lucide-react';

export const DistributionPage: React.FC = () => {
  const { allocations, products, createAllocation, reconcileAllocation, activeRole } = useStore();

  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'reconciled'>('all');
  const [isNewAllocationModalOpen, setIsNewAllocationModalOpen] = useState(false);
  const [allocationForReconcile, setAllocationForReconcile] = useState<DistributorAllocation | null>(null);

  // New allocation form state
  const [distributorName, setDistributorName] = useState('');
  const [routeNotes, setRouteNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantityAllocated: number }[]>([
    { productId: products[0]?.id || '', quantityAllocated: 50 },
  ]);

  // Reconcile form state: maps productId -> { sold: number, returned: number }
  const [reconcileInputs, setReconcileInputs] = useState<Record<string, { sold: string; returned: string }>>({});
  const [reconcileNotes, setReconcileNotes] = useState('');

  const handleOpenReconcile = (alloc: DistributorAllocation) => {
    setAllocationForReconcile(alloc);
    const initialInputs: Record<string, { sold: string; returned: string }> = {};
    alloc.items.forEach((item) => {
      initialInputs[item.productId] = {
        sold: item.quantitySold > 0 ? item.quantitySold.toString() : item.quantityAllocated.toString(),
        returned: item.quantityReturned > 0 ? item.quantityReturned.toString() : '0',
      };
    });
    setReconcileInputs(initialInputs);
    setReconcileNotes(`Shift reconciliation for ${alloc.distributorName}`);
  };

  const handleAddItemRow = () => {
    const unselected = products.find((p) => !selectedItems.some((i) => i.productId === p.id));
    if (unselected) {
      setSelectedItems((prev) => [...prev, { productId: unselected.id, quantityAllocated: 20 }]);
    }
  };

  const handleRemoveItemRow = (idx: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateItemRow = (idx: number, field: 'productId' | 'quantityAllocated', val: any) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleSubmitNewAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorName.trim() || selectedItems.length === 0) return;

    createAllocation({
      distributorName: distributorName.trim(),
      notes: routeNotes.trim() || 'Daily route delivery',
      items: selectedItems.filter((i) => i.quantityAllocated > 0),
    });

    setIsNewAllocationModalOpen(false);
    setDistributorName('');
    setRouteNotes('');
    setSelectedItems([{ productId: products[0]?.id || '', quantityAllocated: 50 }]);
  };

  const handleSubmitReconciliation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationForReconcile) return;

    const formattedItems = allocationForReconcile.items.map((item) => {
      const input = reconcileInputs[item.productId] || { sold: '0', returned: '0' };
      return {
        productId: item.productId,
        quantitySold: parseInt(input.sold, 10) || 0,
        quantityReturned: parseInt(input.returned, 10) || 0,
      };
    });

    reconcileAllocation({
      allocationId: allocationForReconcile.id,
      items: formattedItems,
      notes: reconcileNotes,
    });

    setAllocationForReconcile(null);
  };

  const filteredAllocations = allocations.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header & Staff Training Rule */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Distributor Stock & Reconciliation
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Hand over bread into route custody, track delivered sales, and return unsold stock.
            </p>
          </div>

          {activeRole === 'owner' && (
            <Button
              size="sm"
              onClick={() => setIsNewAllocationModalOpen(true)}
              className="gap-1.5 shadow-sm text-xs"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ New Dispatch Allocation</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900">
          <span className="font-bold px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-950 shrink-0 uppercase text-[9px]">
            Operational Rule
          </span>
          <span className="leading-tight">
            Handing bread over to a driver/distributor transfers custody, not revenue. Revenue is officially recorded when route deliveries are confirmed and unsold loaves are returned to the bakehouse.
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline mr-1" />
          {[
            { id: 'all', label: 'All Routes', count: allocations.length },
            {
              id: 'assigned',
              label: 'In Transit / Pending',
              count: allocations.filter((a) => a.status === 'assigned').length,
            },
            {
              id: 'reconciled',
              label: 'Reconciled',
              count: allocations.filter((a) => a.status === 'reconciled').length,
            },
          ].map((f) => {
            const isSelected = filterStatus === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap min-h-[32px] ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'bg-muted text-muted-foreground hover:bg-border active:scale-95'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-background/80 text-muted-foreground'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Allocation Cards */}
      <div className="space-y-4">
        {filteredAllocations.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            No route allocations found in this view.
          </Card>
        ) : (
          filteredAllocations.map((alloc) => {
            const totalAllocatedLoaves = alloc.items.reduce((s, i) => s + i.quantityAllocated, 0);
            const totalSoldLoaves = alloc.items.reduce((s, i) => s + i.quantitySold, 0);
            const totalReturnedLoaves = alloc.items.reduce((s, i) => s + i.quantityReturned, 0);
            const totalPendingLoaves = totalAllocatedLoaves - totalSoldLoaves - totalReturnedLoaves;

            return (
              <Card key={alloc.id} className="p-4 sm:p-5 hover:border-primary/40 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary-light text-primary">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm sm:text-base">
                        {alloc.distributorName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Dispatched {formatDate(alloc.allocationDate)} • {alloc.notes}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={alloc.status === 'reconciled' ? 'success' : 'warning'}>
                      {alloc.status === 'reconciled' ? 'Reconciled & Settled' : 'In Transit / Custody'}
                    </Badge>

                    {alloc.status === 'assigned' && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenReconcile(alloc)}
                        className="h-7 text-xs px-2.5 gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        <span>Reconcile Shift</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Allocated Items Breakdown */}
                <div className="py-3">
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center justify-between">
                    <span>Allocated Bread Breakdown</span>
                    <span className="text-[11px] font-normal normal-case">
                      Total Loaves: <strong>{totalAllocatedLoaves}</strong>
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 border-y border-border text-muted-foreground uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Item</th>
                          <th className="py-2 px-3 text-right">Allocated</th>
                          <th className="py-2 px-3 text-right">Sold / Delivered</th>
                          <th className="py-2 px-3 text-right">Returned</th>
                          <th className="py-2 px-3 text-right">Status / Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {alloc.items.map((item, idx) => {
                          const pending =
                            item.quantityAllocated - item.quantitySold - item.quantityReturned;
                          return (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="py-2 px-3 font-semibold text-foreground">
                                {item.productName}
                              </td>
                              <td className="py-2 px-3 text-right font-bold">
                                {item.quantityAllocated} loaves
                              </td>
                              <td className="py-2 px-3 text-right text-success font-semibold">
                                {item.quantitySold} loaves
                              </td>
                              <td className="py-2 px-3 text-right text-amber-700">
                                {item.quantityReturned} loaves
                              </td>
                              <td className="py-2 px-3 text-right font-bold">
                                {alloc.status === 'reconciled' ? (
                                  <span className="text-success inline-flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Balanced
                                  </span>
                                ) : pending > 0 ? (
                                  <span className="text-destructive">{pending} in field</span>
                                ) : (
                                  <span className="text-success">0</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Reconciliation Totals */}
                <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between text-xs gap-3">
                  <div className="text-muted-foreground">
                    Allocated Bread Value:{' '}
                    <span className="font-bold text-foreground">
                      {formatCurrency(alloc.totalAllocatedValue)}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    Collections Reported:{' '}
                    <span className="font-bold text-success text-sm">
                      {formatCurrency(alloc.totalCollectedValue)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* 1. Modal: New Dispatch Allocation */}
      <Modal
        isOpen={isNewAllocationModalOpen}
        onClose={() => setIsNewAllocationModalOpen(false)}
        title="New Distributor Dispatch Allocation"
        description="Hand over bread loaves to a driver or route distributor. Bread is deducted from bakery inventory."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitNewAllocation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Distributor / Route Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Sunday Okafor (Motorbike Route 1)"
                value={distributorName}
                onChange={(e) => setDistributorName(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Destination / Route Coverage
              </label>
              <input
                type="text"
                placeholder="e.g. Ojota, Maryland, Mende retail shops"
                value={routeNotes}
                onChange={(e) => setRouteNotes(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Bread Varieties to Allocate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Bread Quantities to Allocate *
              </label>
              {selectedItems.length < products.length && (
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  + Add Another Bread Variety
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedItems.map((item, idx) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/40 border border-border"
                  >
                    <select
                      value={item.productId}
                      onChange={(e) => handleUpdateItemRow(idx, 'productId', e.target.value)}
                      className="flex-1 h-9 px-2 rounded border border-border bg-surface text-xs font-medium text-foreground"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Available: {p.currentStock})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max={product?.currentStock || 9999}
                        value={item.quantityAllocated}
                        onChange={(e) =>
                          handleUpdateItemRow(
                            idx,
                            'quantityAllocated',
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="w-20 h-9 px-2 text-center rounded border border-border bg-surface text-xs font-bold text-foreground"
                        required
                      />
                      <span className="text-[11px] text-muted-foreground">loaves</span>
                    </div>

                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-destructive hover:bg-destructive/10 p-1 rounded"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewAllocationModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Confirm & Dispatch
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Reconcile Route Shift */}
      {allocationForReconcile && (
        <Modal
          isOpen={true}
          onClose={() => setAllocationForReconcile(null)}
          title={`Reconcile Shift: ${allocationForReconcile.distributorName}`}
          description="Enter verified sales and unsold loaves returned to the bakehouse."
          maxWidth="lg"
        >
          <form onSubmit={handleSubmitReconciliation} className="space-y-4">
            <div className="space-y-3">
              {allocationForReconcile.items.map((item) => {
                const input = reconcileInputs[item.productId] || {
                  sold: item.quantityAllocated.toString(),
                  returned: '0',
                };
                const soldNum = parseInt(input.sold, 10) || 0;
                const retNum = parseInt(input.returned, 10) || 0;
                const diff = item.quantityAllocated - (soldNum + retNum);

                return (
                  <div
                    key={item.productId}
                    className="p-3 rounded-lg border border-border bg-muted/20 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-sm text-foreground">
                      <span>{item.productName}</span>
                      <span className="text-muted-foreground text-xs font-semibold">
                        Allocated: {item.quantityAllocated} loaves
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Loaves Sold / Delivered *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantityAllocated}
                          value={input.sold}
                          onChange={(e) =>
                            setReconcileInputs((prev) => ({
                              ...prev,
                              [item.productId]: { ...prev[item.productId], sold: e.target.value },
                            }))
                          }
                          className="w-full h-9 px-2.5 rounded border border-border bg-surface text-xs font-bold text-foreground"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Loaves Returned Unsold *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantityAllocated}
                          value={input.returned}
                          onChange={(e) =>
                            setReconcileInputs((prev) => ({
                              ...prev,
                              [item.productId]: { ...prev[item.productId], returned: e.target.value },
                            }))
                          }
                          className="w-full h-9 px-2.5 rounded border border-border bg-surface text-xs font-bold text-amber-700"
                          required
                        />
                      </div>
                    </div>

                    {diff !== 0 && (
                      <div className="text-[11px] font-bold text-destructive flex items-center gap-1 pt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>
                          Discrepancy: {Math.abs(diff)} loaves {diff > 0 ? 'missing / unaccounted' : 'over allocated'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Reconciliation Notes / Cash Settlement Details
              </label>
              <input
                type="text"
                placeholder="e.g. Cash remitted to cashier Ada, all unsold bread returned in good condition"
                value={reconcileNotes}
                onChange={(e) => setReconcileNotes(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAllocationForReconcile(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Complete Reconciliation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
