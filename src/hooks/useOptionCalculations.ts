import { useEffect, useRef, useMemo } from 'react';
import { QuoteOption, QuoteData } from '@/types';

export function useOptionCalculations(
  option: QuoteOption,
  quoteData: QuoteData,
  onUpdate: (optionId: string, updatedOption: QuoteOption) => void
) {
  const prevCalculatedRef = useRef<any>(null);
  
  // Track items and package changes with useMemo
  const itemsHash = useMemo(() => {
    return JSON.stringify({
      items: option.items.map(i => ({ 
        id: i.id, 
        price: i.price, 
        type: i.type, 
        name: i.name 
      })),
      packageId: option.packageId,
      packageNumber: option.packageNumber,
      image: option.image
    });
  }, [option.items, option.packageId, option.packageNumber, option.image]);

  useEffect(() => {
    if (!option || !quoteData) return;

    // שדות lookup - באים מאיירטייבל
    const unitsPerCarton = option.unitsPerCarton || 1;
    const packaging = option.packaging || "";
    
    // חישוב עלות מוצרי אריזה
    const packagingItemsCost = option.items
      .filter(item => item.type === 'packaging')
      .reduce((sum, item) => sum + (item.price || 0), 0);
    
    // חישוב עלות מוצרים
    const productsCost = option.items
      .filter(item => item.type !== 'packaging')
      .reduce((sum, item) => sum + (item.price || 0), 0);
    
    const productQuantity = option.items.filter(item => item.type !== 'packaging').length;

    const packageQuantity = quoteData.packageQuantity || 1;
    
    // כמות קרטונים להובלה: CEILING({כמות מארזים} / {כמות שנכנסת בקרטון})
    const deliveryBoxesCount = Math.ceil(packageQuantity / unitsPerCarton);

    // חישובי תמחור לפרויקט - משתמשים ב"תמחור משלוח ללקוח" (לא מחיר מהספק!)
    const shippingPriceToClient = option.shippingPriceToClient || 0;
    
    // תמחור לפרויקט לפני מע"מ: משלוח ללקוח (כפי שהוזן ידנית)
    const projectPriceBeforeVAT = shippingPriceToClient;
    const projectPriceWithVAT = projectPriceBeforeVAT * 1.18;

    // תמחור לפרויקט ללקוח לפני מע"מ: IF(תמחור < 600, תמחור * 1.1, תמחור)
    const projectPriceToClientBeforeVAT = projectPriceBeforeVAT < 600 
      ? projectPriceBeforeVAT * 1.1 
      : projectPriceBeforeVAT;

    // תמחור לפרויקט ללקוח כולל מע"מ: {תמחור לפרויקט ללקוח לפני מע"מ}*1.18
    const projectPriceToClientWithVAT = projectPriceToClientBeforeVAT * 1.18;

    // תקציב למארז - אם כולל מע"מ, הורד 18%
    const includeShipping = quoteData.includeShipping || false;
    const includeVAT = quoteData.includeVAT || false;
    let budgetPerPackage = quoteData.budgetPerPackage || 0;
    
    // אם המחיר כולל מץ"מ - הורד 18%
    if (includeVAT) {
      budgetPerPackage = budgetPerPackage / 1.18;
    }
    
    // מחיר עלות: {תקציב למארז}*(1-{יעד רווחיות}-{עמלת סוכן %})
    // שים לב: לא מורידים משלוח כאן!
    const profitTarget = (option.profitTarget || quoteData.profitTarget || 36) / 100;
    const agentCommission = (option.agentCommission || quoteData.agentCommission || 0) / 100;
    const costPrice = budgetPerPackage * (1 - profitTarget - agentCommission);

    // מחיר משלוח למארז (מחושב מ"תמחור משלוח ללקוח")
    const shippingCostPerPackage = includeShipping ? (shippingPriceToClient / packageQuantity) : 0;

    // הובלה במארז
    const deliveryInPackage = includeShipping ? (shippingPriceToClient / packageQuantity) : 0;

    // עלות עבודת אריזה: {כמות מוצרים}*0.5+IF(FIND("קופסת",{מוצרי אריזה ומיתוג}),2,1)
    const hasBox = option.items.some(item => item.type === 'packaging' && item.name?.includes('קופסת'));
    const packagingWorkCost = productQuantity * 0.5 + (hasBox ? 2 : 1);

    // תקציב נותר למוצרים
    const additionalExpenses = option.additionalExpenses || 0;
    const budgetRemainingForProducts = costPrice - (deliveryInPackage + productsCost + packagingItemsCost + additionalExpenses + packagingWorkCost);

    // רווח לעסקה בשקלים
    const profitPerDeal = budgetPerPackage - deliveryInPackage - productsCost - additionalExpenses - packagingItemsCost - packagingWorkCost - (agentCommission * budgetPerPackage);

    // % רווח בפועל למארז
    const actualProfitPercentage = budgetPerPackage > 0 ? profitPerDeal / budgetPerPackage : 0;

    // סה"כ רווח לעסקה
    const totalDealProfit = packageQuantity * profitPerDeal;

    // הכנסה ללא מע"מ: ({תקציב למארז לפני מע"מ} * {כמות מארזים})+{תמחור לפרויקט ללקוח לפני מע"מ}
    const revenueWithoutVAT = (budgetPerPackage * packageQuantity) + projectPriceToClientBeforeVAT;

    // רווח בפועל למארז
    const actualProfit = profitPerDeal;

    // עדכן רק שדות חישוביים, לא לדרוס שדות של המארז או ערכי קלט
    const calculatedFields = {
      deliveryBoxesCount,
      projectPriceWithVAT,
      projectPriceToClientBeforeVAT,
      projectPriceToClientWithVAT,
      packagingWorkCost,
      costPrice,
      shippingCostPerPackage,
      budgetRemainingForProducts,
      profitPerDeal,
      actualProfitPercentage,
      totalDealProfit,
      revenueWithoutVAT,
      productQuantity,
      packagingItemsCost,
      productsCost,
      actualProfit
      // לא כוללים profitTarget ו-agentCommission - אלה שדות קלט!
    };

    // בדוק אם השדות המחושבים השתנו מאז העידכון האחרון
    const calculatedFieldsHash = JSON.stringify(calculatedFields);
    
    if (prevCalculatedRef.current !== calculatedFieldsHash) {
      prevCalculatedRef.current = calculatedFieldsHash;
      
      // עדכן רק את השדות המחושבים, לא את שדות המארז
      onUpdate(option.id, {
        ...option,
        ...calculatedFields
      });
    }
  }, [
    itemsHash,
    option.additionalExpenses,
    option.profitTarget,
    option.agentCommission,
    option.shippingPriceToClient,
    option.unitsPerCarton,
    option.packaging,
    option.projectPriceBeforeVAT,
    quoteData.budgetPerPackage,
    quoteData.includeVAT,
    quoteData.packageQuantity,
    quoteData.profitTarget,
    quoteData.agentCommission,
    quoteData.includeShipping,
    option.id
    // הסרנו onUpdate מכאן כדי למנוע infinite loop
  ]);
}
