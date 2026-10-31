import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ExcelImportModal } from '../../components/common/ExcelImportModal';
import { AddProductModal } from '../../components/common/AddProductModal';
import { Product } from '../../types/domain.types';
import { Package, Edit2, AlertTriangle, CheckCircle2, Search, FileSpreadsheet, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProductsPage: React.FC = () => {
  const { products, updateProductPrice, activeRole } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [editPriceInput, setEditPriceInput] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEditPrice = (product: Product) => {
    setSelectedProductForEdit(product);
    setEditPriceInput(product.unitPrice.toString());
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForEdit) return;
    const price = parseFloat(editPriceInput);
    if (price && price > 0) {
      updateProductPrice(selectedProductForEdit.id, price);
      setSelectedProductForEdit(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Finished Goods Inventory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor bread stock levels and update unit prices across the bakery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeRole === 'owner' && (
            <>
              <Button
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-1.5 text-xs shadow-xs"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Bread Variety</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="gap-1.5 text-xs text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Import Excel</span>
              </Button>
            </>
          )}
          <Link to="/production">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <Package className="h-4 w-4" />
              <span>Log Baked Batch</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and summary */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search bread varieties or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-3 pl-9 rounded-md border border-border bg-surface text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div>
              Catalog: <span className="font-bold text-foreground">{products.length} items</span>
            </div>
            <div>
              In Stock:{' '}
              <span className="font-bold text-foreground">
                {products.reduce((acc, p) => acc + p.currentStock, 0).toLocaleString()} loaves
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Products Content: Desktop Table + Mobile Cards */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3 text-center">Stock Status</th>
                  {activeRole === 'owner' && <th className="px-4 py-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => {
                  const isLow = product.currentStock <= product.minStockAlert;
                  return (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground text-sm">{product.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Alert threshold: {product.minStockAlert} loaves
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground uppercase">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-sm text-foreground">
                        {formatCurrency(product.unitPrice)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm font-bold text-foreground">
                          {product.currentStock.toLocaleString()}
                        </span>{' '}
                        <span className="text-[10px] text-muted-foreground">loaves</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive-light text-destructive border border-destructive/20">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-light text-success border border-success/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Healthy
                          </span>
                        )}
                      </td>
                      {activeRole === 'owner' && (
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditPrice(product)}
                            className="h-7 text-xs px-2.5 gap-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit Price</span>
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< sm) */}
          <div className="block sm:hidden divide-y divide-border">
            {filteredProducts.map((product) => {
              const isLow = product.currentStock <= product.minStockAlert;
              return (
                <div key={product.id} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-foreground">{product.name}</div>
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                        {product.category}
                      </span>
                    </div>
                    {isLow ? (
                      <span className="text-[11px] font-bold text-destructive px-2 py-0.5 rounded bg-destructive-light">
                        Low Stock
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-success px-2 py-0.5 rounded bg-success-light">
                        In Stock
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded text-xs">
                    <div>
                      <span className="text-muted-foreground">Price:</span>{' '}
                      <span className="font-bold text-foreground text-sm">
                        {formatCurrency(product.unitPrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Available:</span>{' '}
                      <span className={`font-bold ${isLow ? 'text-destructive' : 'text-foreground'}`}>
                        {product.currentStock} loaves
                      </span>
                    </div>
                  </div>

                  {activeRole === 'owner' && (
                    <div className="pt-1 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditPrice(product)}
                        className="w-full h-8 text-xs gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Update Price</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Price Modal */}
      <Modal
        isOpen={!!selectedProductForEdit}
        onClose={() => setSelectedProductForEdit(null)}
        title="Edit Product Price"
        description={selectedProductForEdit ? `Update selling price for ${selectedProductForEdit.name}` : ''}
      >
        {selectedProductForEdit && (
          <form onSubmit={handleSavePrice} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Unit Selling Price (₦)
              </label>
              <input
                type="number"
                min="50"
                step="50"
                value={editPriceInput}
                onChange={(e) => setEditPriceInput(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-border bg-surface text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Updating this price will immediately apply to all new sales and POS entries.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedProductForEdit(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Save New Price</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>
      {/* Add Bread Variety Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
