import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ShoppingBag,
  Package,
  Users,
  Truck,
  Flame,
  Wheat,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  X,
  Menu,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OnboardingTourModal } from '../common/OnboardingTourModal';

export const MobileNav: React.FC = () => {
  const { activeRole } = useStore();
  const navigate = useNavigate();
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const handleNavClick = (path: string) => {
    setIsHubOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/98 backdrop-blur-md pb-safe">
        <div className="flex h-16 items-center justify-around px-1">
          {activeRole === 'distributor' ? (
            <>
              <NavLink
                to="/distribution"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`
                }
              >
                <Truck className="h-5 w-5" />
                <span>My Route</span>
              </NavLink>
              <NavLink
                to="/products"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`
                }
              >
                <Package className="h-5 w-5" />
                <span>Catalog</span>
              </NavLink>
            </>
          ) : activeRole === 'salesperson' ? (
            <>
              <NavLink
                to="/sales/new"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`
                }
              >
                <PlusCircle className="h-5 w-5" />
                <span>New Sale</span>
              </NavLink>
              <NavLink
                to="/sales"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`
                }
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Sales</span>
              </NavLink>
              <NavLink
                to="/customers"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`
                }
              >
                <Users className="h-5 w-5" />
                <span>Debtors</span>
              </NavLink>
              <NavLink
                to="/products"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`
                }
              >
                <Package className="h-5 w-5" />
                <span>Stock</span>
              </NavLink>
            </>
          ) : (
            // Owner / Admin Mobile Console - Most Critical Daily Levers
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Overview</span>
              </NavLink>

              <NavLink
                to="/sales/new"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <PlusCircle className="h-5 w-5 text-primary" />
                <span className="font-bold text-primary">New Sale</span>
              </NavLink>

              <NavLink
                to="/sales"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <ShoppingBag className="h-5 w-5" />
                <span>Sales</span>
              </NavLink>

              <NavLink
                to="/distribution"
                end
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Truck className="h-5 w-5" />
                <span>Routes</span>
              </NavLink>

              <button
                type="button"
                onClick={() => setIsHubOpen(true)}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                  isHubOpen ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Menu className="h-5 w-5" />
                <span>Admin Hub</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Admin Quick-Access Mobile Drawer / Bottom Sheet */}
      {isHubOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsHubOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-surface rounded-t-2xl border-t border-border p-5 space-y-4 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">Bakery Owner Admin Hub</h3>
                <p className="text-xs text-muted-foreground">Quick management access on mobile</p>
              </div>
              <button
                type="button"
                onClick={() => setIsHubOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleNavClick('/customers')}
                className="p-3 rounded-xl border border-border bg-muted/30 text-left hover:border-primary transition-all flex items-start gap-2.5"
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-foreground block">Customer Debts</span>
                  <span className="text-[10px] text-muted-foreground">Credit ledger & balances</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/products')}
                className="p-3 rounded-xl border border-border bg-muted/30 text-left hover:border-primary transition-all flex items-start gap-2.5"
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-foreground block">Bread Catalog</span>
                  <span className="text-[10px] text-muted-foreground">Stock & prices</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/production')}
                className="p-3 rounded-xl border border-border bg-muted/30 text-left hover:border-primary transition-all flex items-start gap-2.5"
              >
                <div className="p-2 rounded-lg bg-orange-100 text-orange-700 shrink-0">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-foreground block">Bakehouse Logs</span>
                  <span className="text-[10px] text-muted-foreground">Shifts & damaged bread</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/raw-materials')}
                className="p-3 rounded-xl border border-border bg-muted/30 text-left hover:border-primary transition-all flex items-start gap-2.5"
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <Wheat className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-foreground block">Raw Materials</span>
                  <span className="text-[10px] text-muted-foreground">Flour & sugar stock</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/staff')}
                className="p-3 rounded-xl border border-border bg-muted/30 text-left hover:border-primary transition-all flex items-start gap-2.5"
              >
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-foreground block">Staff & PINs</span>
                  <span className="text-[10px] text-muted-foreground">Worker logins & roles</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('/sync-status')}
                className="p-3 rounded-xl border border-border bg-muted/30 text-left hover:border-primary transition-all flex items-start gap-2.5"
              >
                <div className="p-2 rounded-lg bg-cyan-100 text-cyan-700 shrink-0">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-foreground block">Offline Sync</span>
                  <span className="text-[10px] text-muted-foreground">Queue & cloud database</span>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsHubOpen(false);
                  setIsTourOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-primary-light/40 border border-primary/30 text-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary-light"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Open BMS App Tour & Training Guide</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tour Modal */}
      <OnboardingTourModal isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
    </>
  );
};
