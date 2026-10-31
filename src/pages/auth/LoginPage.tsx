import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { bakeryBranding } from '../../config/branding.config';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import {
  Store,
  Shield,
  Smartphone,
  Truck,
  Lock,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { login, loginAs, staffList } = useStore();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = await login(identifier, pin);
    if (res.success) {
      navigate('/');
    } else {
      setErrorMessage(res.error || 'Invalid credentials');
    }
  };

  const handleQuickLogin = (staffId: string) => {
    const staff = staffList.find((s) => s.id === staffId);
    if (staff) {
      loginAs(staff);
      if (staff.role === 'salesperson') {
        navigate('/sales/new');
      } else if (staff.role === 'distributor') {
        navigate('/distribution');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* App Logo & Branding */}
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <Store className="h-6 w-6" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <h2 className="text-center text-2xl font-black tracking-tight text-foreground">
            {bakeryBranding.businessName}
          </h2>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
            v0.1
          </span>
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Secure operational access for Bakery Owner, Sales Agents & Drivers.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        {/* Sign In Card */}
        <Card className="p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-xs text-destructive font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Phone Number or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 08012345678 or owner@bakery.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full h-10 px-3 pl-9 rounded-md border border-border bg-surface text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                4-Digit Worker PIN or Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••"
                  maxLength={16}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full h-10 px-3 pl-9 rounded-md border border-border bg-surface text-sm font-mono tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <Button type="submit" className="w-full h-10 gap-2 font-bold shadow-xs">
              <span>Sign In to Bakery System</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Logins for Client Review */}
          <div className="mt-6 pt-5 border-t border-border">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center mb-3">
              Quick Worker Access (One-Tap Demo Switch)
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('staff-owner')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border hover:border-primary/60 hover:bg-muted/40 transition-all text-left text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Bakery Owner (Laptop Admin)</div>
                    <div className="text-[10px] text-muted-foreground">owner@bakery.com • PIN: 1234</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-primary">Login &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff-sales-1')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border hover:border-primary/60 hover:bg-muted/40 transition-all text-left text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Sales Agent Blessing (Phone POS)</div>
                    <div className="text-[10px] text-muted-foreground">08012345678 • PIN: 1111</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-primary">Login &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff-dist-1')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border hover:border-primary/60 hover:bg-muted/40 transition-all text-left text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Distributor Sunday (Route Driver)</div>
                    <div className="text-[10px] text-muted-foreground">08034567890 • PIN: 3333</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-primary">Login &rarr;</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Informative Guidance */}
        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 leading-relaxed">
          <strong>How Worker Accounts Work:</strong> The bakery owner creates workers from the <em>"Staff & Access"</em> menu. Workers log in using their own phone number and a 4-digit PIN on mobile phones to record counter sales or manage route deliveries.
        </div>
      </div>
    </div>
  );
};

