import React, { useState, useEffect } from 'react';
import { bakeryBranding } from '../../config/branding.config';
import { useStore } from '../../context/StoreContext';
import { SyncIndicator } from '../feedback/SyncIndicator';
import { Store, LogOut, Shield, Smartphone, Truck, User, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { OnboardingTourModal } from '../common/OnboardingTourModal';

export const Navbar: React.FC = () => {
  const { currentUser, logout, activeRole } = useStore();
  const navigate = useNavigate();
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Auto-launch guide for first time users
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('bms_tour_seen');
    if (!hasSeenTour) {
      setIsTourOpen(true);
    }
  }, []);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner (Admin)', icon: <Shield className="h-3 w-3" />, color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'salesperson':
        return { label: 'Sales Counter', icon: <Smartphone className="h-3 w-3" />, color: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'distributor':
        return { label: 'Route Driver', icon: <Truck className="h-3 w-3" />, color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      default:
        return { label: 'Staff', icon: <User className="h-3 w-3" />, color: 'bg-muted text-foreground border-border' };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role || activeRole);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/98 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-3.5 sm:px-6 max-w-7xl mx-auto w-full">
          {/* Bakery Brand Identity: Clean Icon + "BMS v0.1" */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Store className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                {bakeryBranding.businessName}
              </span>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                v0.1
              </span>
            </div>
          </Link>

          {/* Right controls: Help Guide + Network Status + Logged-in Staff + Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Interactive App Guide / Walkthrough Launcher */}
            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Open BMS App Tour & Training Guide"
            >
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Guide & Tour</span>
            </button>

            {/* Real Network Sync Indicator */}
            <SyncIndicator />

            {/* Logged in Staff Identity Card */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-border">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-foreground leading-tight truncate max-w-[150px]">
                  {currentUser ? currentUser.name : 'Bakery Owner'}
                </span>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${roleInfo.color}`}
                  >
                    {roleInfo.icon}
                    <span>{roleInfo.label}</span>
                  </span>
                </div>
              </div>

              {/* Logout Action */}
              <button
                type="button"
                onClick={handleSignOut}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Sign Out of Session"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Onboarding Tour Modal */}
      <OnboardingTourModal isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
    </>
  );
};
