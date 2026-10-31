import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useStore } from '../../context/StoreContext';
import { PlusCircle, CheckCircle2, Package } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
  const { addProduct } = useStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bread');
  const [customCategory, setCustomCategory] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [initialStock, setInitialStock] = useState('100');
  const [minAlert, setMinAlert] = useState('20');

  const standardCategories = ['Bread', 'Specialty', 'Pastries', 'Healthy', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const price = parseFloat(unitPrice);
    if (!price || price <= 0) return;

    const resolvedCategory = category === 'Other' && customCategory.trim() ? customCategory.trim() : category;

    addProduct({
      name: name.trim(),
      category: resolvedCategory,
      unitPrice: price,
      initialStock: parseInt(initialStock, 10) || 0,
      minStockAlert: parseInt(minAlert, 10) || 20,
    });

    // Reset and close
    setName('');
    setUnitPrice('');
    setCustomCategory('');
    setInitialStock('100');
    setMinAlert('20');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Bakery Product / Bread Variety"
      description="Define your own bread types, custom categories, unit prices, and initial stock."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Bread Variety / Item Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Sardine Bread, Agege Loaf, Butter Rolls..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {standardCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Unit Selling Price (₦) *
            </label>
            <input
              type="number"
              min="50"
              step="50"
              placeholder="e.g. 1500"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        {category === 'Other' && (
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Custom Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. Confectionery or Snacks"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Opening Stock (Loaves)
            </label>
            <input
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Low Stock Alert Level
            </label>
            <input
              type="number"
              min="5"
              value={minAlert}
              onChange={(e) => setMinAlert(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="gap-1.5 font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Save & Add to Catalog</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

