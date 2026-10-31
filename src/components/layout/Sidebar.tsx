import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Package,
  Users,
  Wheat,
  Truck,
  Flame,
  FileSpreadsheet,
  UserCheck,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const Sidebar: React.FC = () => {
  const { activeRole } = useStore();

  const navLinks = [
    {
      to: '/',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      roles: ['owner'],
    },
    {
      to: '/sales/new',
      label: 'New Sale (POS)',
      icon: <PlusCircle className="h-4 w-4" />,
      roles: ['owner', 'salesperson'],
    },
    {
      to: '/sales',
      label: 'Sales & Debts',
      icon: <ShoppingBag className="h-4 w-4" />,
      roles: ['owner', 'salesperson'],
    },
    {
      to: '/products',
      label: 'Finished Goods',
      icon: <Package className="h-4 w-4" />,
      roles: ['owner', 'salesperson', 'distributor'],
    },
    {
      to: '/production',
      label: 'Bakehouse Logs',
      icon: <Flame className="h-4 w-4" />,
      roles: ['owner', 'salesperson'],
    },
    {
      to: '/raw-materials',
      label: 'Raw Materials',
      icon: <Wheat className="h-4 w-4" />,
      roles: ['owner'],
    },
    {
      to: '/customers',
      label: 'Customers & Debts',
      icon: <Users className="h-4 w-4" />,
      roles: ['owner', 'salesperson'],
    },
    {
      to: '/distribution',
      label: 'Distributors',
      icon: <Truck className="h-4 w-4" />,
      roles: ['owner', 'distributor'],
    },
    {
      to: '/staff',
      label: 'Staff & Access',
      icon: <UserCheck className="h-4 w-4" />,
      roles: ['owner'],
    },
    {
      to: '/sync-status',
      label: 'Offline Sync Queue',
      icon: <FileSpreadsheet className="h-4 w-4 text-emerald-600" />,
      roles: ['owner', 'salesperson'],
    },
  ];

  const visibleLinks = navLinks.filter((link) => link.roles.includes(activeRole));

  return (
    <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-surface p-4 h-full overflow-y-auto shrink-0 z-30">
      <div className="space-y-1">
        <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {activeRole === 'owner'
            ? 'Management'
            : activeRole === 'salesperson'
            ? 'Sales Counter'
            : 'Distribution'}
        </p>
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end // Exact route matching so /sales does not highlight on /sales/new
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-light text-primary font-bold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>

      {activeRole === 'owner' && (
        <div className="mt-auto pt-6 border-t border-border">
          <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Excel Ready</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Export and import daily records via standardized spreadsheets.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
