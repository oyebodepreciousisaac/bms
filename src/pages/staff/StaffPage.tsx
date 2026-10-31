import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { UserRole, StaffUser } from '../../types/domain.types';
import { formatDate, formatDateTime } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  Shield,
  Smartphone,
  Truck,
  PlusCircle,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Sparkles,
} from 'lucide-react';

export const StaffPage: React.FC = () => {
  const {
    staffList,
    addStaff,
    toggleStaffStatus,
    resetDemoData,
    clearAllDataToFreshBakery,
    activeRole,
  } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  // Add staff form state
  const [workerName, setWorkerName] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerRole, setWorkerRole] = useState<UserRole>('salesperson');
  const [workerPin, setWorkerPin] = useState('');

  // Confirmation alert state
  const [confirmCleanOpen, setConfirmCleanOpen] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const togglePinVisibility = (staffId: string) => {
    setShowPins((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim() || !workerPhone.trim() || !workerPin.trim()) return;

    await addStaff({
      name: workerName.trim(),
      emailOrPhone: workerPhone.trim(),
      role: workerRole,
      pin: workerPin.trim(),
    });

    setIsAddModalOpen(false);
    setWorkerName('');
    setWorkerPhone('');
    setWorkerPin('');
    setWorkerRole('salesperson');
    setSuccessToast(`Account created for ${workerName}! Worker can log in using phone & PIN.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleResetDemo = () => {
    resetDemoData();
    setSuccessToast('Demo data reloaded (Crown Stores, Big House, test sales, etc.).');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleClearFresh = () => {
    clearAllDataToFreshBakery();
    setConfirmCleanOpen(false);
    setSuccessToast('All test transactions cleared! System is clean for new bakery operations.');
    setTimeout(() => setSuccessToast(''), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Staff Accounts & Worker Access
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage worker logins. Give sales counter staff and drivers their own phone number and 4-digit PIN.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-1.5 shadow-sm text-xs font-bold"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Add Worker Account</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmCleanOpen(true)}
              className="gap-1.5 text-xs text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100"
              title="Reset sales and debts to zero for a clean new bakery rollout"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Clean Slate (New Product)</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleResetDemo}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="Reload realistic test cases (Crown Stores, Big House, etc.)"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reload Demo Cases</span>
            </Button>
          </div>
        </div>

        {/* Operational Training Guidance */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900">
          <span className="font-bold px-1.5 py-0.5 rounded bg-blue-200/60 text-blue-950 shrink-0 uppercase text-[9px]">
            Owner Control
          </span>
          <span className="leading-tight">
            Workers only see what they need: <strong>Sales Agents</strong> only see the POS counter and customer debt receipts; <strong>Drivers</strong> only see their assigned distribution route. Profit margins, baking logs, and staff control are exclusive to the Bakery Owner.
          </span>
        </div>

        {successToast && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}
      </div>

      {/* Staff Directory Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm sm:text-base">Active Worker Credentials</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground">
              {staffList.length} registered accounts
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Worker Name</th>
                  <th className="px-4 py-3">Login Phone / Email</th>
                  <th className="px-4 py-3 text-center">System Role</th>
                  <th className="px-4 py-3 text-center">Login PIN</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            staff.role === 'owner'
                              ? 'bg-amber-100 text-amber-900'
                              : staff.role === 'salesperson'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {staff.role === 'owner' ? (
                            <Shield className="h-3.5 w-3.5" />
                          ) : staff.role === 'salesperson' ? (
                            <Smartphone className="h-3.5 w-3.5" />
                          ) : (
                            <Truck className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <span>{staff.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-foreground font-mono">
                      {staff.emailOrPhone}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          staff.role === 'owner'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : staff.role === 'salesperson'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {staff.role === 'owner'
                          ? 'Owner (Admin)'
                          : staff.role === 'salesperson'
                          ? 'Sales Counter'
                          : 'Route Driver'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5 font-mono bg-muted/60 px-2 py-0.5 rounded border border-border">
                        <span className="font-bold">
                          {showPins[staff.id] ? staff.pin : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(staff.id)}
                          className="text-muted-foreground hover:text-foreground p-0.5"
                          title="Reveal / Hide PIN"
                        >
                          {showPins[staff.id] ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <Badge variant={staff.status === 'active' ? 'success' : 'destructive'}>
                        {staff.status === 'active' ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-[11px]">
                      {staff.lastLoginAt ? formatDateTime(staff.lastLoginAt) : 'Never'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {staff.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => toggleStaffStatus(staff.id)}
                          className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                            staff.status === 'active'
                              ? 'text-destructive hover:bg-destructive/10'
                              : 'text-success hover:bg-success-light'
                          }`}
                        >
                          {staff.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 1. Modal: Add Worker Account */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Worker Account"
        description="Create login credentials for bakery sales agents or route drivers."
      >
        <form onSubmit={handleAddWorker} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Worker Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Joy Ade, Musa Driver, etc."
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Worker Phone Number (Used as Login ID) *
            </label>
            <input
              type="text"
              placeholder="e.g. 08123456789"
              value={workerPhone}
              onChange={(e) => setWorkerPhone(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Assigned Job Role *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWorkerRole('salesperson')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  workerRole === 'salesperson'
                    ? 'border-primary bg-primary-light/50 ring-2 ring-primary/40'
                    : 'border-border bg-surface hover:bg-muted'
                }`}
              >
                <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-primary" />
                  <span>Sales Agent</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Counter POS, debtor receipts, finished goods
                </p>
              </button>

              <button
                type="button"
                onClick={() => setWorkerRole('distributor')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  workerRole === 'distributor'
                    ? 'border-primary bg-primary-light/50 ring-2 ring-primary/40'
                    : 'border-border bg-surface hover:bg-muted'
                }`}
              >
                <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-primary" />
                  <span>Route Driver</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Route stock custody, deliveries & shift returns
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              4-Digit Worker Login PIN *
            </label>
            <input
              type="text"
              placeholder="e.g. 4321"
              maxLength={8}
              value={workerPin}
              onChange={(e) => setWorkerPin(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm font-mono tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              The worker will enter their phone number and this PIN to log in on their mobile phone.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Worker
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Clean Slate Confirmation (New Bakery Rollout) */}
      <Modal
        isOpen={confirmCleanOpen}
        onClose={() => setConfirmCleanOpen(false)}
        title="Start Fresh Bakery (Clean Slate)"
        description="Wipe test sales and reset balances to zero for a brand new live client deployment."
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <span>What this does:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
              <li>Clears demo sales transactions and receipts.</li>
              <li>Resets debtor balances to ₦0 so the client starts with fresh accounts.</li>
              <li>Preserves bread product types, raw materials, and staff logins.</li>
              <li>You can always click "Reload Demo Cases" at any time to restore test data.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmCleanOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleClearFresh}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Confirm Clean Slate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

