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

  // Reconcile form state: maps productId -> { sold: string, returned: string, damaged: string }
  const [reconcileInputs, setReconcileInputs] = useState<
    Record<string, { sold: string; returned: string; damaged: string }>
  >({});
  const [shortageResolution, setShortageResolution] = useState<
    'debited_to_driver' | 'bakery_loss_approved' | 'must_return'
  >('must_return');
  const [reconcileNotes, setReconcileNotes] = useState('');

  const handleOpenReconcile = (alloc: DistributorAllocation) => {
    setAllocationForReconcile(alloc);
    const initialInputs: Record<string, { sold: string; returned: string; damaged: string }> = {};
    alloc.items.forEach((item) => {
      initialInputs[item.productId] = {
        sold: item.quantitySold > 0 ? item.quantitySold.toString() : item.quantityAllocated.toString(),
        returned: item.quantityReturned > 0 ? item.quantityReturned.toString() : '0',
        damaged: item.quantityDamaged ? item.quantityDamaged.toString() : '0',
      };
    });
    setReconcileInputs(initialInputs);
    setShortageResolution('must_return');
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
      const input = reconcileInputs[item.productId] || { sold: '0', returned: '0', damaged: '0' };
      const sold = parseInt(input.sold, 10) || 0;
      const returned = parseInt(input.returned, 10) || 0;
      const damaged = parseInt(input.damaged, 10) || 0;
      const shortage = Math.max(0, item.quantityAllocated - (sold + returned + damaged));
      return {
        productId: item.productId,
        quantitySold: sold,
        quantityReturned: returned,
        quantityDamaged: damaged,
        quantityShortage: shortage,
      };
    });

    // Integrity check: sold + returned + damaged cannot exceed allocated
    const hasOverAllocated = formattedItems.some((fi) => {
      const orig = allocationForReconcile.items.find((i) => i.productId === fi.productId);
      return orig && fi.quantitySold + fi.quantityReturned + (fi.quantityDamaged || 0) > orig.quantityAllocated;
    });

    if (hasOverAllocated) {
      alert('Error: Reported Sold + Returned + Damaged exceeds originally allocated loaves!');
      return;
    }

    const totalMissing = formattedItems.reduce((acc, fi) => acc + (fi.quantityShortage || 0), 0);

    if (totalMissing > 0 && shortageResolution === 'must_return') {
      alert(
        `Cannot close reconciliation: ${totalMissing} loaves are missing from driver custody! The driver must physically return the remaining bread, or you must bill it to driver debt.`
      );
      return;
    }

    reconcileAllocation({
      allocationId: allocationForReconcile.id,
      items: formattedItems,
      shortageResolution:
        totalMissing > 0 && shortageResolution !== 'must_return' ? shortageResolution : 'none',
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
                    {alloc.shortageTotalValue && alloc.shortageTotalValue > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                        {alloc.shortageResolution === 'debited_to_driver'
                          ? `Shortage: ${formatCurrency(alloc.shortageTotalValue)} (Billed)`
                          : `Loss: ${formatCurrency(alloc.shortageTotalValue)} (Approved)`}
                      </span>
                    ) : null}
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
          description="Enter verified route sales, unsold loaves returned, and audit any missing stock."
          maxWidth="lg"
        >
          {(() => {
            // Calculate total missing across all allocated lines
            let totalMissingLoaves = 0;
            let totalMissingValue = 0;
            let hasOverAllocated = false;

            allocationForReconcile.items.forEach((item) => {
              const input = reconcileInputs[item.productId] || {
                sold: item.quantityAllocated.toString(),
                returned: '0',
                damaged: '0',
              };
              const soldNum = parseInt(input.sold, 10) || 0;
              const retNum = parseInt(input.returned, 10) || 0;
              const damNum = parseInt(input.damaged, 10) || 0;
              const totalAccounted = soldNum + retNum + damNum;

              if (totalAccounted > item.quantityAllocated) {
                hasOverAllocated = true;
              } else {
                const diff = item.quantityAllocated - totalAccounted;
                if (diff > 0) {
                  totalMissingLoaves += diff;
                  const prod = products.find((p) => p.id === item.productId);
                  totalMissingValue += diff * (prod?.unitPrice || 0);
                }
              }
            });

            return (
              <form onSubmit={handleSubmitReconciliation} className="space-y-4">
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {allocationForReconcile.items.map((item) => {
                    const input = reconcileInputs[item.productId] || {
                      sold: item.quantityAllocated.toString(),
                      returned: '0',
                      damaged: '0',
                    };
                    const soldNum = parseInt(input.sold, 10) || 0;
                    const retNum = parseInt(input.returned, 10) || 0;
                    const damNum = parseInt(input.damaged, 10) || 0;
                    const diff = item.quantityAllocated - (soldNum + retNum + damNum);

                    return (
                      <div
                        key={item.productId}
                        className="p-3 rounded-lg border border-border bg-muted/20 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-sm text-foreground">
                          <span>{item.productName}</span>
                          <span className="text-muted-foreground text-xs font-semibold">
                            Dispatched: {item.quantityAllocated} loaves
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                              Sold / Delivered *
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={item.quantityAllocated}
                              value={input.sold}
                              onChange={(e) =>
                                setReconcileInputs((prev) => ({
                                  ...prev,
                                  [item.productId]: {
                                    ...prev[item.productId],
                                    sold: e.target.value,
                                    returned: prev[item.productId]?.returned || '0',
                                    damaged: prev[item.productId]?.damaged || '0',
                                  },
                                }))
                              }
                              className="w-full h-8 px-2 rounded border border-border bg-surface text-xs font-bold text-foreground"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                              Returned Unsold *
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={item.quantityAllocated}
                              value={input.returned}
                              onChange={(e) =>
                                setReconcileInputs((prev) => ({
                                  ...prev,
                                  [item.productId]: {
                                    ...prev[item.productId],
                                    sold: prev[item.productId]?.sold || '0',
                                    returned: e.target.value,
                                    damaged: prev[item.productId]?.damaged || '0',
                                  },
                                }))
                              }
                              className="w-full h-8 px-2 rounded border border-border bg-surface text-xs font-bold text-emerald-700"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                              Transit Damaged
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={item.quantityAllocated}
                              value={input.damaged}
                              onChange={(e) =>
                                setReconcileInputs((prev) => ({
                                  ...prev,
                                  [item.productId]: {
                                    ...prev[item.productId],
                                    sold: prev[item.productId]?.sold || '0',
                                    returned: prev[item.productId]?.returned || '0',
                                    damaged: e.target.value,
                                  },
                                }))
                              }
                              className="w-full h-8 px-2 rounded border border-border bg-surface text-xs font-bold text-amber-700"
                            />
                          </div>
                        </div>

                        {diff !== 0 && (
                          <div
                            className={`text-[11px] font-bold flex items-center gap-1 pt-1 ${
                              diff > 0 ? 'text-destructive' : 'text-red-700'
                            }`}
                          >
                            <AlertCircle className="h-3 w-3" />
                            <span>
                              {diff > 0
                                ? `${diff} loaves missing / not returned!`
                                : `Error: Exceeds allocated quantity by ${Math.abs(diff)} loaves!`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Anti-Shrinkage & Unreturned Bread Protection Section */}
                {totalMissingLoaves > 0 && (
                  <div className="p-3.5 rounded-lg bg-red-50/80 border border-red-200 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-red-900">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <span>
                        Unreturned Bread Alert: {totalMissingLoaves} Loaves Missing ({formatCurrency(totalMissingValue)})
                      </span>
                    </div>
                    <p className="text-[11px] text-red-800 leading-tight">
                      This distributor has not returned all bread. To prevent shrinkage, the system blocks blind reconciliation. Choose how this missing stock must be accounted for:
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-start gap-2.5 p-2 rounded-md bg-surface border border-red-200 cursor-pointer hover:bg-muted/30">
                        <input
                          type="radio"
                          name="shortageResolution"
                          value="debited_to_driver"
                          checked={shortageResolution === 'debited_to_driver'}
                          onChange={() => setShortageResolution('debited_to_driver')}
                          className="mt-0.5 text-primary"
                        />
                        <div>
                          <span className="font-bold text-foreground block">
                            Option 1: Bill Shortage to Distributor Debt (Recommended)
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            Automatically debits {formatCurrency(totalMissingValue)} to {allocationForReconcile.distributorName}'s ledger. Recovered from salary or next remittance.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2 rounded-md bg-surface border border-red-200 cursor-pointer hover:bg-muted/30">
                        <input
                          type="radio"
                          name="shortageResolution"
                          value="bakery_loss_approved"
                          checked={shortageResolution === 'bakery_loss_approved'}
                          onChange={() => setShortageResolution('bakery_loss_approved')}
                          className="mt-0.5 text-primary"
                        />
                        <div>
                          <span className="font-bold text-foreground block">
                            Option 2: Authorized Manager Transit Loss (Write-Off)
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            Bakery absorbs loss (e.g. rain damage, vehicle accident). Requires authorization explanation below.
                          </span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2 rounded-md bg-surface border border-red-200 cursor-pointer hover:bg-muted/30">
                        <input
                          type="radio"
                          name="shortageResolution"
                          value="must_return"
                          checked={shortageResolution === 'must_return'}
                          onChange={() => setShortageResolution('must_return')}
                          className="mt-0.5 text-primary"
                        />
                        <div>
                          <span className="font-bold text-foreground block">
                            Option 3: Driver Must Bring Back Loaves (Hold Reconciliation)
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            Lock reconciliation. Shift cannot be closed until the driver physically brings the remaining loaves to the bakehouse.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Reconciliation Notes / Settlement Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cash remitted to cashier Ada, all unsold bread returned in good condition"
                    value={reconcileNotes}
                    onChange={(e) => setReconcileNotes(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required={totalMissingLoaves > 0 && shortageResolution === 'bakery_loss_approved'}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAllocationForReconcile(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={hasOverAllocated || (totalMissingLoaves > 0 && shortageResolution === 'must_return')}
                    className={`gap-1.5 ${
                      totalMissingLoaves > 0 && shortageResolution === 'debited_to_driver'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {hasOverAllocated
                        ? 'Invalid Quantities'
                        : totalMissingLoaves > 0 && shortageResolution === 'must_return'
                        ? `Locked: ${totalMissingLoaves} Loaves Missing`
                        : totalMissingLoaves > 0 && shortageResolution === 'debited_to_driver'
                        ? `Reconcile & Debit ${formatCurrency(totalMissingValue)}`
                        : 'Complete Reconciliation'}
                    </span>
                  </Button>
                </div>
              </form>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
