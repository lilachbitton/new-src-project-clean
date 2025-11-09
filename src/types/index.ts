// Base types for the quote builder system
export interface Item {
  id: string;
  name: string;
  details: string;
  price?: number;
  type?: 'product' | 'packaging';
  isCustom?: boolean;
  isEditable?: boolean;
  productType?: string;
  marketingDescription?: string;
  inventory?: string;
  boxesPerCarton?: number;
}

export interface QuoteOption {
  id: string;
  airtableId?: string; // ID מאיירטייבל
  packageId?: string; // ID של המארז מאיירטייבל
  title: string;
  items: Item[];
  total: number;
  image?: string | null;
  
  // Calculation fields
  profitTarget?: number; // יעד רווחיות
  profitTargetDisplay?: number; // יעד רווחיות לתצוגה
  agent?: string; // סוכן
  agentCommission?: number; // עמלת סוכן %
  agentCommissionDisplay?: number; // עמלת סוכן לתצוגה
  costPrice?: number; // מחיר עלות
  additionalExpenses?: number; // הוצאות נוספות
  packagingWorkCost?: number; // עלות עבודת אריזה
  packagingItemsCost?: number; // עלות מוצרי אריזה ומיתוג
  productsCost?: number; // עלות מוצרים בפועל
  budgetRemainingForProducts?: number; // תקציב נותר למוצרים
  productQuantity?: number; // כמות מוצרים
  actualProfitPercentage?: number; // % רווח בפועל למארז
  profitPerDeal?: number; // רווח לעסקה בשקלים
  totalDealProfit?: number; // סה"כ רווח לעסקה
  revenueWithoutVAT?: number; // הכנסה ללא מע"מ
  actualProfit?: number; // רווח בפועל למארז (בשקלים)
  
  // Shipping fields
  shippingCost?: number;
  includeShipping?: boolean;
  deliveryCompany?: string; // חברת משלוחים (מושך מאיירטייבל)
  deliveryBoxesCount?: number | null; // כמות קרטונים - שדה חישובי
  unitsPerCarton?: number; // כמות שנכנסת בקרטון - סטטי
  packaging?: string; // אריזה - מוצר האריזה שנבחר
  shippingPriceBeforeVAT?: number; // תמחור משלוח לפני מע"מ - קלט עלות מחברת משלוחים
  shippingPriceToClientWithVAT?: number; // תמחור משלוח ללקוח כולל מע"מ - חישובי
  shippingPriceToClientBeforeVAT?: number; // תמחור משלוח ללקוח לפני מע"מ - חישובי 
  finalShippingPriceToClient?: number; // תמחור משלוח סופי ללקוח - קלט (מתמלא אוטומטית מהחישובי אבל ניתן לשינוי)
  
  // Status fields
  status?: string;
  internalStatus?: string;
  
  // UI state
  isCollapsed?: boolean;
  isIrrelevant?: boolean;
}

export interface QuoteData {
  id: string; // Airtable record ID
  quoteNumber: string;
  
  // Customer info
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerNotes?: string;
  customerPreferences?: string;
  
  // Dates
  deliveryDate?: string;
  deliveryTime?: string;
  
  // Budget fields
  budgetBeforeVAT: number | null;
  budgetWithVAT: number | null;
  budgetPerPackage?: number | null;
  packageQuantity?: number | null;
  includeVAT?: boolean;
  includeShipping?: boolean;
  
  // Profitability
  profitTarget?: number;
  agentCommission?: number;
  agent?: string | null;
  
  // Delivery
  deliveryAddress?: string;
  deliveryType?: string;
  
  // Customer preferences
  celebration?: string;
  giftRecipients?: string;
  customerCard?: string;
  customerSticker?: string;
  preferredPackaging?: string;
  
  // Status
  status?: string;
  
  // Opportunity
  opportunityId?: string | null;
  occasion?: string[];
  
  // Options
  options: QuoteOption[];
}

export interface Product {
  id: string;
  name: string;
  details?: string;
  price?: number;
  productType?: string;
  marketingDescription?: string;
  inventory?: string;
  boxesPerCarton?: number;
  type?: 'product' | 'packaging';
}

export interface Package {
  id: string;
  name: string;
  packagePrice?: number;
  items: Product[];
  packagingItems?: Product[];
  parallelPackages?: string[];
  imageUrl?: string;
}

export interface Catalog {
  id: string;
  name: string;
}

export type SortOption = "all" | "priceHighToLow" | "priceLowToHigh";

export const SORT_OPTIONS: Record<SortOption, string> = {
  all: "הכל",
  priceHighToLow: "מחיר - מהיקר לזול",
  priceLowToHigh: "מחיר - מהזול ליקר",
} as const;
