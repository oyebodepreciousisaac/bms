/**
 * Centralised Bakery Branding Configuration
 * 
 * IMPORTANT: This file is the single source of truth for bakery branding.
 * The client can freely request changes to the business name, logo, contact
 * details, currency symbols, and receipt messages without altering application logic.
 */

export interface BakeryBrandingConfig {
  /** The operational display name of the system */
  businessName: string;
  appVersion: string;
  /** Short tagline used on invoices and dashboard headers */
  tagline: string;
  /** Primary contact phone number */
  phone: string;
  /** Optional secondary phone or WhatsApp line */
  whatsappPhone?: string;
  /** Physical bakery operating address */
  address: string;
  /** Business email for enquiries or statements */
  email: string;
  /** Currency configuration */
  currency: {
    symbol: string;
    code: string;
    locale: string;
  };
  /** Bank settlement details for commercial invoices */
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  /** Receipt and invoice printing configuration */
  receipt: {
    headerGreeting: string;
    footerMessage: string;
    notice: string;
    showLogo: boolean;
    logoUrl?: string;
  };
  /** System visual identity configuration (provisional palette) */
  theme: {
    themeName: string;
    primaryHue: string;
  };
}

export const bakeryBranding: BakeryBrandingConfig = {
  businessName: "BMS",
  appVersion: "BMS v0.1",
  tagline: "Bakery Management System",
  phone: "+234 803 123 4567",
  whatsappPhone: "+234 803 123 4567",
  address: "14 Commercial Road, Ikeja, Lagos",
  email: "billing@bms.local",
  currency: {
    symbol: "₦",
    code: "NGN",
    locale: "en-NG",
  },
  bankDetails: {
    bankName: "Zenith Bank Plc",
    accountName: "Bakery Operations Enterprise",
    accountNumber: "1012345678",
  },
  receipt: {
    headerGreeting: "Thank you for your patronage!",
    footerMessage: "Please verify all loaves and recorded payments before dispatch.",
    notice: "Commercial invoices must be settled according to agreed credit terms.",
    showLogo: false,
  },
  theme: {
    themeName: "Clean Professional Bakery",
    primaryHue: "Amber / Terracotta",
  },
};

