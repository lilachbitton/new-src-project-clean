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
  packageNumber?: string | undefined; // מספר מארז - להפעלת אוטומציה של תמונה
  title: string;
  items: Item[];
  total: number;
  image?: string | undefined;
  
  // Calculation fields
  profitTarget?: number; // יעד רווחיות
  profitTargetDisplay?: number; // יעד רווחיות לתצוגה
  agent?: string; // סוכן
  agentCommission?: number; // עמלת סוכן %
  agentCommissionDisplay?: number; // עמלת סוכן לתצוגה
  costPrice?: number; // מחיר עלות
  shippingCostPerPackage?: number; // מחיר משלוח למארז
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
  
  // Shipping fields - מאיירטייבל
  deliveryCompany?: string; // fldZ6awiJutIW9Xys - חברת משלוחים
  packaging?: string; // fldKIHATOl5fs0fNe - אריזה (lookup)
  unitsPerCarton?: number; // fldlUzUgYtCzHqMUH - כמות שנכנסת בקרטון (lookup)
  deliveryBoxesCount?: number; // fldgFizG5ulcqnOGh - כמות קרטונים להובלה (formula)
  finalDeliveryBoxes?: number; // כמות קרטונים סופית להובלה (ניתן לעריכה)
  deliveryBreakdown?: string; // פירוט החלוקה (אוטומטי)
  shippingCompanyCost?: number; // fldJA3rlQKTvVEEj7 - עלות חברת משלוחים (קלט)
  shippingPriceToClient?: number; // fldSvnNx86B5x79U9 - תמחור משלוח ללקוח (קלט)
  projectPriceBeforeVAT?: number; // fld0xt9R9bJ4dEPHt - תמחור לפרויקט לפני מע"מ (קלט)
  projectPriceWithVAT?: number; // fldRYo0QG6AhcqCcU - תמחור לפרויקט כולל מע"מ (formula)
  projectPriceToClientBeforeVAT?: number; // fld9unHyYU9yivqTo - תמחור לפרויקט ללקוח לפני מע"מ (formula)
  projectPriceToClientWithVAT?: number; // fldd84rqvGunQcnrC - תמחור לפרויקט ללקוח כולל מע"מ (formula)
  
  // Status fields
  status?: string;
  internalStatus?: string;
  isSelected?: boolean; // אופציה נבחרת
  
  // Comments from reviewer
  optionComments?: string; // חידודי לקוח לאופציה - fldLI1FNqKuQhZynP
  
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
  budgetBeforeVAT: number | undefined;
  budgetWithVAT: number | undefined;
  budgetPerPackage?: number | undefined;
  packageQuantity?: number | undefined;
  includeVAT?: boolean;
  includeShipping?: boolean;
  
  // Profitability
  profitTarget?: number;
  agentCommission?: number;
  agent?: string | undefined;
  
  // Delivery
  deliveryAddress?: string;
  deliveryType?: string;
  distribution?: string; // הפצה מהזדמנות המכירה
  
  // Customer preferences
  celebration?: string;
  giftRecipients?: string;
  customerCard?: string;
  customerSticker?: string;
  preferredPackaging?: string;
  
  // Status
  status?: string;
  
  // Comments from reviewer
  quoteComments?: string; // חידודי לקוח להצעה - fldof9wwajUBJMwrF
  
  // Opportunity
  opportunityId?: string | undefined;
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
  packageNumber?: string | undefined;
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
