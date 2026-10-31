import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatDate, formatDateTime } from '../../lib/formatters';
import { RawMaterialMovementType } from '../../types/domain.types';
import {
  Wheat,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Trash2,
  PackagePlus,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const RawMaterialsPage: React.FC = () => {
  const {
    rawMaterials,
    rawMaterialMovements,
    addRawMaterial,
    recordRawMaterialMovement,
    activeRole,
  } = useStore();

  // Modals state
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);

  // Form states for Receive / Usage
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(rawMaterials[0]?.id || '');
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [movementNotes, setMovementNotes] = useState<string>('');
  const [usageType, setUsageType] = useState<'usage' | 'waste'>('usage');

  // Form states for New Material
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState('50kg Bag');
  const [newMaterialStock, setNewMaterialStock] = useState('20');
  const [newMaterialAlert, setNewMaterialAlert] = useState('5');

  const selectedMaterial = rawMaterials.find((m) => m.id === selectedMaterialId) || rawMaterials[0];

  const handleReceiveStock = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantityInput);
    if (!selectedMaterialId || !qty || qty <= 0) return;

    recordRawMaterialMovement({
      rawMaterialId: selectedMaterialId,
      movementType: 'receipt',
      quantity: qty,
      notes: movementNotes || 'Stock delivery received from vendor',
    });

    setIsReceiveModalOpen(false);
    setQuantityInput('');
    setMovementNotes('');
  };

  const handleRecordUsageOrWaste = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantityInput);
    if (!selectedMaterialId || !qty || qty <= 0) return;

    recordRawMaterialMovement({
      rawMaterialId: selectedMaterialId,
      movementType: usageType,
      quantity: qty,
      notes: movementNotes || (usageType === 'usage' ? 'Used for daily baking cycle' : 'Damaged / expired ingredient'),
    });

    setIsUsageModalOpen(false);
    setQuantityInput('');
    setMovementNotes('');
  };

  const handleAddNewMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialName.trim()) return;

    addRawMaterial({
      name: newMaterialName.trim(),
      unitOfMeasure: newMaterialUnit.trim(),
      initialStock: parseFloat(newMaterialStock) || 0,
      minStockAlert: parseFloat(newMaterialAlert) || 5,
    });

    setIsAddMaterialModalOpen(false);
    setNewMaterialName('');
    setNewMaterialStock('20');
    setNewMaterialAlert('5');
  };

  const lowStockCount = rawMaterials.filter((m) => m.currentStock <= m.minStockAlert).length;

  return (
    <div className="space-y-4">
      {/* Top Header & Operational Guidance */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Raw Materials & Ingredients
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Track flour, sugar, yeast, and butter movements. Simple manual tracking without recipe complexity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setSelectedMaterialId(rawMaterials[0]?.id || '');
                setIsReceiveModalOpen(true);
              }}
              className="gap-1.5 text-xs shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ArrowDownCircle className="h-4 w-4" />
              <span>+ Receive Stock</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedMaterialId(rawMaterials[0]?.id || '');
                setUsageType('usage');
                setIsUsageModalOpen(true);
              }}
              className="gap-1.5 text-xs text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span>Record Usage / Waste</span>
            </Button>

            {activeRole === 'owner' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddMaterialModalOpen(true)}
                className="gap-1.5 text-xs"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Add Ingredient</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900">
          <span className="font-bold px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-950 shrink-0 uppercase text-[9px]">
            Bakery Rule
          </span>
          <span className="leading-tight">
            Raw materials are tracked directly by physical count (bags, tins, cartons). When deliveries arrive or flour is mixed into dough, record it here to maintain accurate physical stock.
          </span>
        </div>
      </div>

      {/* Aggregate Overview KPI Cards - Single Line Layout to Minimize Page Scroll */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card className="p-2.5 sm:p-4 flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
            Tracked Ingredients
          </span>
          <div className="text-sm sm:text-xl font-bold text-foreground mt-0.5 sm:mt-1">
            {rawMaterials.length} <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">items</span>
          </div>
        </Card>

        <Card className="p-2.5 sm:p-4 flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
            Reorder Alerts
          </span>
          <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
            <span className={`text-sm sm:text-xl font-bold ${lowStockCount > 0 ? 'text-destructive' : 'text-success'}`}>
              {lowStockCount} <span className="text-[10px] sm:text-xs font-normal">low</span>
            </span>
            {lowStockCount > 0 && (
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-destructive animate-pulse shrink-0" />
            )}
          </div>
        </Card>

        <Card className="p-2.5 sm:p-4 flex flex-col justify-between">
          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
            Stock Movements
          </span>
          <div className="text-sm sm:text-xl font-bold text-foreground mt-0.5 sm:mt-1">
            {rawMaterialMovements.length} <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">logged</span>
          </div>
        </Card>
      </div>

      {/* Raw Materials Inventory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {rawMaterials.map((rm) => {
          const isLow = rm.currentStock <= rm.minStockAlert;
          return (
            <Card key={rm.id} className="p-4 space-y-3 relative group hover:border-primary/50 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-foreground text-sm leading-tight">{rm.name}</h3>
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">
                    Unit: {rm.unitOfMeasure}
                  </span>
                </div>
                <div
                  className={`p-2 rounded-lg ${
                    isLow
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-primary-light text-primary'
                  }`}
                >
                  <Wheat className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-2 border-t border-border">
                <div>
                  <span className="text-2xl font-black text-foreground">
                    {rm.currentStock}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground ml-1.5">
                    {rm.unitOfMeasure}s
                  </span>
                </div>
                {isLow ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Reorder Alert
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-green-50 px-2 py-0.5 rounded border border-green-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Adequate
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>Alert threshold: &le; {rm.minStockAlert} {rm.unitOfMeasure}s</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMaterialId(rm.id);
                      setIsReceiveModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200"
                  >
                    + Receive
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMaterialId(rm.id);
                      setUsageType('usage');
                      setIsUsageModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200"
                  >
                    - Use
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Stock Movement Audit Log Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base">Stock Movement Audit Trail</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">
              Last {rawMaterialMovements.length} recorded operations
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Raw Material</th>
                  <th className="px-4 py-3 text-center">Movement</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3">Recorded By</th>
                  <th className="px-4 py-3">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rawMaterialMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  rawMaterialMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDateTime(mov.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {mov.rawMaterialName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {mov.movementType === 'receipt' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <ArrowDownCircle className="h-3 w-3" />
                            RECEIVED
                          </span>
                        ) : mov.movementType === 'usage' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            <ArrowUpCircle className="h-3 w-3" />
                            USED IN BAKING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            <AlertCircle className="h-3 w-3" />
                            DAMAGED / WASTE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        <span
                          className={
                            mov.movementType === 'receipt'
                              ? 'text-emerald-700'
                              : mov.movementType === 'waste'
                              ? 'text-destructive'
                              : 'text-foreground'
                          }
                        >
                          {mov.movementType === 'receipt' ? '+' : '-'}
                          {mov.quantity} {mov.unitOfMeasure}s
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {mov.recordedBy}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {mov.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 1. Modal: Receive Material Stock (Vendor Delivery) */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title="Receive Raw Material Delivery"
        description="Record incoming ingredient purchases delivered to the bakery store."
      >
        <form onSubmit={handleReceiveStock} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Select Ingredient *
            </label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {rawMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Current: {m.currentStock} {m.unitOfMeasure}s)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Quantity Received ({selectedMaterial?.unitOfMeasure}s) *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 50"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Vendor Delivery / Invoice Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Flour Mills delivery invoice #FM-4902"
              value={movementNotes}
              onChange={(e) => setMovementNotes(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReceiveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Confirm Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Record Usage or Waste */}
      <Modal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
        title="Record Ingredient Usage / Waste"
        description="Log flour, sugar, or ingredients taken from store for baking or discarded."
      >
        <form onSubmit={handleRecordUsageOrWaste} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUsageType('usage')}
              className={`p-2.5 rounded-md text-xs font-bold border transition-all ${
                usageType === 'usage'
                  ? 'border-primary bg-primary-light text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              Used in Baking
            </button>
            <button
              type="button"
              onClick={() => setUsageType('waste')}
              className={`p-2.5 rounded-md text-xs font-bold border transition-all ${
                usageType === 'waste'
                  ? 'border-destructive bg-destructive/10 text-destructive'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              Damaged / Waste
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Select Ingredient *
            </label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {rawMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Available: {m.currentStock} {m.unitOfMeasure}s)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Quantity ({selectedMaterial?.unitOfMeasure}s) *
            </label>
            <input
              type="number"
              min="1"
              max={selectedMaterial?.currentStock || 9999}
              step="1"
              placeholder="e.g. 10"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Reason / Batch Reference
            </label>
            <input
              type="text"
              placeholder={
                usageType === 'usage'
                  ? 'e.g. Morning dough mixing for 400 loaves'
                  : 'e.g. Wet bag from rain leak in store'
              }
              value={movementNotes}
              onChange={(e) => setMovementNotes(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUsageModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className={
                usageType === 'usage'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-destructive text-destructive-foreground'
              }
            >
              Confirm Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Modal: Add New Ingredient / Raw Material */}
      <Modal
        isOpen={isAddMaterialModalOpen}
        onClose={() => setIsAddMaterialModalOpen(false)}
        title="Add New Raw Material / Ingredient"
        description="Add a new ingredient item to track in the bakery store."
      >
        <form onSubmit={handleAddNewMaterial} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Ingredient / Material Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Sardine Tins, Coconut Flavour, Vegetable Oil..."
              value={newMaterialName}
              onChange={(e) => setNewMaterialName(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Unit of Measure *
              </label>
              <input
                type="text"
                placeholder="e.g. 50kg Bag, Carton, Litre, Tin"
                value={newMaterialUnit}
                onChange={(e) => setNewMaterialUnit(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Initial Stock Count
              </label>
              <input
                type="number"
                min="0"
                value={newMaterialStock}
                onChange={(e) => setNewMaterialStock(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Reorder Alert Threshold
            </label>
            <input
              type="number"
              min="1"
              value={newMaterialAlert}
              onChange={(e) => setNewMaterialAlert(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              System alerts the store owner when stock falls to or below this number.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddMaterialModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Ingredient
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
