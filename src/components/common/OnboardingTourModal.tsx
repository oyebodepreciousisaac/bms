import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  ShoppingBag,
  Users,
  Truck,
  WifiOff,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Printer,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Point of Sale (POS) & Bulk Keying',
      subtitle: 'Counter Checkout for Walk-ins & Distributors',
      badge: 'Step 1 of 4: Counter Sales',
      icon: <ShoppingBag className="h-8 w-8 text-primary" />,
      color: 'from-amber-500/15 to-orange-500/5 border-amber-300',
      description:
        'Fast touch catalog designed for high-speed bakery counters. Tap any loaf to add to cart, or type quantities directly (e.g. 200 or 500 loaves) for wholesale distributors.',
      highlights: [
        'Physical out-of-stock clamping blocks sales of bread not yet baked.',
        'Split payment channels: Cash, Instant Bank Transfer, and Card POS.',
        'Unpaid balances automatically feed into debtor accounts.',
      ],
      illustration: (
        <div className="p-4 rounded-xl bg-surface border border-border space-y-2 text-xs shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="font-bold text-foreground">Jumbo Family Loaf</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              340 in stock
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Type order quantity:</span>
            <span className="font-mono font-bold text-primary text-sm px-2 py-0.5 rounded bg-primary-light">
              500 pcs
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Customer Debts & Partial Payments',
      subtitle: 'Eliminate Uncollected Wholesale Credit',
      badge: 'Step 2 of 4: Debtor Control',
      icon: <Users className="h-8 w-8 text-blue-600" />,
      color: 'from-blue-500/15 to-indigo-500/5 border-blue-300',
      description:
        'Give supermarket and depot distributors custom credit accounts. Keep full transaction history, audit unpaid balances, and record partial repayments.',
      highlights: [
        'Instant visibility into total bakery receivables across all debtors.',
        'Record partial cash/transfer recovery with real-time balance updates.',
        'Print formal debtor account statements on Bluetooth thermal rolls.',
      ],
      illustration: (
        <div className="p-4 rounded-xl bg-surface border border-border space-y-2 text-xs shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="font-bold text-foreground">Crown Supermarket Depot</span>
            <span className="font-bold text-red-600">Owes ₦42,000</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Recent Payment:</span>
            <span className="font-semibold text-emerald-600">+₦20,000 (Transfer)</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Route Logistics & Anti-Loss Protection',
      subtitle: 'Van & Motorbike Distributor Custody',
      badge: 'Step 3 of 4: Route Delivery',
      icon: <Truck className="h-8 w-8 text-emerald-600" />,
      color: 'from-emerald-500/15 to-teal-500/5 border-emerald-300',
      description:
        'Hand crates of bread to motorbike and van drivers. When drivers return, unsold loaves are audited and missing loaves cannot be swept under the rug.',
      highlights: [
        'Unsold loaves are physically returned and restored to bakery inventory.',
        'Missing loaves trigger automatic shortage alerts (anti-theft).',
        'Option to bill missing bread directly to driver debt so the bakery never loses revenue.',
      ],
      illustration: (
        <div className="p-4 rounded-xl bg-surface border border-border space-y-2 text-xs shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="font-bold text-foreground">Sunday (Motorbike 1)</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
              50 Loaves Dispatched
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground flex justify-between">
            <span>Sold: 40 • Returned: 10</span>
            <span className="font-bold text-emerald-600">Balanced (0 Missing)</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Bluetooth Receipts & 100% Offline Mode',
      subtitle: 'Print Thermal Slips & Work Without Internet',
      badge: 'Step 4 of 4: Hardware & Sync',
      icon: <Printer className="h-8 w-8 text-purple-600" />,
      color: 'from-purple-500/15 to-violet-500/5 border-purple-300',
      description:
        'Designed specifically for power cuts and patchy internet. Cashiers keep recording sales offline, and receipts print seamlessly to 58mm/80mm Bluetooth printers.',
      highlights: [
        '1-click print for portable 58mm & 80mm Bluetooth ESC/POS thermal printers.',
        'Office A4 official invoice layout for supermarkets and corporate clients.',
        'Automatic background cloud synchronization the moment connection returns.',
      ],
      illustration: (
        <div className="p-4 rounded-xl bg-surface border border-border space-y-2 text-xs shadow-xs font-mono">
          <div className="text-center font-bold text-[11px] pb-1 border-b border-dashed border-border">
            BMS BAKERY SALES SLIP
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>TOTAL SALE:</span>
            <span className="font-bold text-foreground">₦142,500.00</span>
          </div>
          <div className="text-[10px] text-center text-emerald-600 font-sans font-bold">
            ✓ Auto-Synced to Cloud
          </div>
        </div>
      ),
    },
  ];

  const step = steps[currentStep];

  const handleDismiss = () => {
    try {
      localStorage.setItem('bms_tour_seen', 'true');
    } catch {
      // Ignore private browsing storage restrictions
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      title="BMS v0.1 Quick Start Guide"
      description="Interactive operational walkthrough for bakery owners and counter staff"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Step Progress Pills */}
        <div className="flex items-center gap-1.5">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'bg-primary'
                  : idx < currentStep
                  ? 'bg-primary/40'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Active Step Card */}
        <div
          className={`p-5 rounded-2xl border bg-gradient-to-br ${step.color} space-y-4 transition-all duration-300`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface border border-border text-foreground">
                {step.badge}
              </span>
              <h3 className="text-lg font-bold text-foreground mt-2 leading-tight">
                {step.title}
              </h3>
              <p className="text-xs font-semibold text-primary">{step.subtitle}</p>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border shadow-xs shrink-0">
              {step.icon}
            </div>
          </div>

          <p className="text-xs text-foreground/90 leading-relaxed">{step.description}</p>

          {/* Visual Miniature Illustration */}
          <div>{step.illustration}</div>

          {/* Key Checklist Highlights */}
          <div className="space-y-1.5 pt-1">
            {step.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs text-muted-foreground"
          >
            Skip Guide
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={handlePrev} className="gap-1 text-xs">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </Button>
            )}

            <Button type="button" size="sm" onClick={handleNext} className="gap-1.5 text-xs shadow-xs">
              <span>{currentStep === steps.length - 1 ? 'Start Working in BMS' : 'Next Step'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

