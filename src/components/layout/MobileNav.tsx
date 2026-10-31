import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ShoppingBag, Package, Users, Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const MobileNav: React.FC = () => {
  const { activeRole } = useStore();

  const getMobileLinks = () => {
    if (activeRole === 'distributor') {
      return [
        { to: '/distribution', label: 'Assigned', icon: <Truck className="h-5 w-5" /> },
        { to: '/products', label: 'Catalog', icon: <Package className="h-5 w-5" /> },
      ];
    }

    if (activeRole === 'salesperson') {
      return [
        { to: '/sales/new', label: 'New Sale', icon: <PlusCircle className="h-5 w-5" /> },
        { to: '/sales', label: 'Sales & Debts', icon: <ShoppingBag className="h-5 w-5" /> },
        { to: '/products', label: 'Stock', icon: <Package className="h-5 w-5" /> },
        { to: '/customers', label: 'Customers', icon: <Users className="h-5 w-5" /> },
      ];
    }

    // Owner mobile view
    return [
      { to: '/', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" /> },
      { to: '/sales/new', label: 'New Sale', icon: <PlusCircle className="h-5 w-5" /> },
      { to: '/sales', label: 'Sales', icon: <ShoppingBag className="h-5 w-5" /> },
      { to: '/products', label: 'Stock', icon: <Package className="h-5 w-5" /> },
      { to: '/customers', label: 'Debts', icon: <Users className="h-5 w-5" /> },
    ];
  };

  const links = getMobileLinks();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/98 backdrop-blur-md pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end // Exact matching so /sales does not stay active on /sales/new
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-full transition-colors ${isActive ? 'bg-primary-light text-primary' : ''}`}>
                  {link.icon}
                </div>
                <span>{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
