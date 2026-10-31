import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { PlusCircle, Phone, AlertCircle, CheckCircle2, Search, Building2, X, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomersPage: React.FC = () => {
  const { customers, addCustomer } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [debtFilter, setDebtFilter] = useState<'all' | 'debtors' | 'settled'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerNotes, setNewCustomerNotes] = useState('');

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDebt =
      debtFilter === 'all'
        ? true
        : debtFilter === 'debtors'
        ? c.currentDebt > 0
        : c.currentDebt === 0;
    return matchesSearch && matchesDebt;
  });

  const totalOutstandingDebt = customers.reduce((sum, c) => sum + c.currentDebt, 0);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName) return;
    addCustomer(newCustomerName, newCustomerPhone, newCustomerNotes);
    setIsAddModalOpen(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Customers & Debtors Ledger
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Credit accounts for key distributors and retail buyers (Crown, Big House, etc.).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-1.5 shadow-sm text-xs">
            <PlusCircle className="h-4 w-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3.5 sm:p-4">
          <span className="text-xs text-muted-foreground">Total Customer Accounts</span>
          <div className="text-lg sm:text-xl font-bold text-foreground mt-1">{customers.length}</div>
        </Card>
        <Card className="p-3.5 sm:p-4">
          <span className="text-xs text-muted-foreground">Debtors (Unpaid Balances)</span>
          <div className="text-lg sm:text-xl font-bold text-destructive mt-1">
            {customers.filter((c) => c.currentDebt > 0).length} active debtors
          </div>
        </Card>
        <Card className="p-3.5 sm:p-4">
          <span className="text-xs text-muted-foreground">Total Receivables Owed</span>
          <div className="text-lg sm:text-xl font-bold text-destructive mt-1">
            {formatCurrency(totalOutstandingDebt)}
          </div>
        </Card>
      </div>

      {/* Search and Debt Filter Pills */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search Crown, Big House, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-3 pl-9 pr-8 rounded-md border border-border bg-surface text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Pills with Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline shrink-0" />
            {[
              { id: 'all', label: 'All Accounts', count: customers.length },
              {
                id: 'debtors',
                label: 'Active Debtors',
                count: customers.filter((c) => c.currentDebt > 0).length,
              },
              {
                id: 'settled',
                label: 'Zero Debt / Settled',
                count: customers.filter((c) => c.currentDebt === 0).length,
              },
            ].map((f) => {
              const isSelected = debtFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setDebtFilter(f.id as any)}
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
      </Card>

      {/* Customer List: Desktop Table + Mobile Cards */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table (>= sm) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Customer / Debtor</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Credit Terms & Notes</th>
                  <th className="px-4 py-3 text-right">Running Debt</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((cust) => {
                  const hasDebt = cust.currentDebt > 0;
                  const isSpecial = cust.name.includes('Crown') || cust.name.includes('Big House');
                  return (
                    <tr key={cust.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
                          {isSpecial && <Building2 className="h-4 w-4 text-primary shrink-0" />}
                          <span>{cust.name}</span>
                        </div>
                        {cust.id === 'cust-walkin' && (
                          <span className="text-[10px] text-muted-foreground">
                            Default register counter account
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{cust.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-muted-foreground">
                          {cust.notes || 'Standard buyer'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-sm">
                        {hasDebt ? (
                          <span className="text-destructive font-bold">{formatCurrency(cust.currentDebt)}</span>
                        ) : (
                          <span className="text-success font-semibold">Settled (₦0.00)</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {hasDebt ? (
                          <Link to="/sales">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2.5 text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100"
                            >
                              View Debts
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">No debt</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< sm) */}
          <div className="block sm:hidden divide-y divide-border">
            {filteredCustomers.map((cust) => {
              const hasDebt = cust.currentDebt > 0;
              const isSpecial = cust.name.includes('Crown') || cust.name.includes('Big House');
              return (
                <div key={cust.id} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                        {isSpecial && <Building2 className="h-4 w-4 text-primary shrink-0" />}
                        <span>{cust.name}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span>{cust.phone}</span>
                      </div>
                    </div>
                    {hasDebt ? (
                      <span className="text-xs font-bold text-destructive px-2 py-0.5 rounded bg-destructive-light">
                        Owes {formatCurrency(cust.currentDebt)}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-success px-2 py-0.5 rounded bg-success-light">
                        Settled
                      </span>
                    )}
                  </div>

                  {cust.notes && (
                    <p className="text-[11px] text-muted-foreground italic bg-muted/30 p-2 rounded">
                      {cust.notes}
                    </p>
                  )}

                  {hasDebt && (
                    <div className="pt-1 flex justify-end">
                      <Link to="/sales" className="w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs text-amber-800 border-amber-300 bg-amber-50"
                        >
                          View Invoices & Settle
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Customer"
        description="Add a retail shop, supermarket, or wholesale account."
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Customer or Business Name
            </label>
            <input
              type="text"
              placeholder="e.g. Crown Stores or Big House Wholesale"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+234 800 000 0000"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Credit Terms / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly settlement via bank transfer"
              value={newCustomerNotes}
              onChange={(e) => setNewCustomerNotes(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Save Customer</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
