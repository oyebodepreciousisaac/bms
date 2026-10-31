import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../lib/formatters';
import { Flame, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ProductionPage: React.FC = () => {
  const { products, productionBatches, recordProductionBatch } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [quantityProduced, setQuantityProduced] = useState('');
  const [quantityDamaged, setQuantityDamaged] = useState('0');
  const [notes, setNotes] = useState('');

  const handleRecordBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const produced = parseInt(quantityProduced, 10);
    const damaged = parseInt(quantityDamaged, 10) || 0;
    if (!produced || produced <= 0) return;

    recordProductionBatch({
      productId: selectedProductId,
      quantityProduced: produced,
      quantityDamaged: damaged,
      notes,
    });

    setIsModalOpen(false);
    setQuantityProduced('');
    setQuantityDamaged('0');
    setNotes('');
  };

  const netUsablePreview = Math.max(
    0,
    (parseInt(quantityProduced, 10) || 0) - (parseInt(quantityDamaged, 10) || 0)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Bakehouse Production Log
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Record loaves produced and damaged. Usable net loaves automatically increase finished stock.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-1.5 shadow-sm">
          <PlusCircle className="h-4 w-4" />
          <span>Log Baked Batch</span>
        </Button>
      </div>

      {/* Production Batches Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Batch Date</th>
                  <th className="px-4 py-3">Bread Variety</th>
                  <th className="px-4 py-3 text-right">Total Baked</th>
                  <th className="px-4 py-3 text-right">Damaged</th>
                  <th className="px-4 py-3 text-right">Net Usable Added</th>
                  <th className="px-4 py-3">Supervisor / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productionBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatDate(batch.batchDate)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground text-sm">
                      {batch.productName}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {batch.quantityProduced.toLocaleString()} loaves
                    </td>
                    <td className="px-4 py-3 text-right">
                      {batch.quantityDamaged > 0 ? (
                        <span className="text-destructive font-semibold">
                          {batch.quantityDamaged} damaged
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-success font-bold text-sm">
                        +{batch.netUsable.toLocaleString()} loaves
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{batch.recordedBy}</div>
                      {batch.notes && (
                        <div className="text-[10px] text-muted-foreground italic mt-0.5">
                          "{batch.notes}"
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Batch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Bakehouse Batch"
        description="Enter morning or afternoon bake figures. Net usable loaves will increment stock."
      >
        <form onSubmit={handleRecordBatch} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Select Bread Variety
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Currently {p.currentStock} in stock)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Total Loaves Baked
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 350"
                value={quantityProduced}
                onChange={(e) => setQuantityProduced(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Damaged / Defective
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={quantityDamaged}
                onChange={(e) => setQuantityDamaged(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-base font-bold text-destructive focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Real-time Calculation Badge */}
          <div className="bg-success-light/60 border border-success/30 p-3 rounded-lg flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Net Usable Added to Stock:</span>
            <span className="text-base font-bold text-success">+{netUsablePreview} loaves</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Batch Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Oven temperature notes or flour batch number"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Record Batch</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

