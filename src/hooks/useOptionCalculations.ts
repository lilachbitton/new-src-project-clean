import { useEffect, useRef, useMemo, useState } from 'react';
import { QuoteOption, QuoteData } from '@/types';

export function useOptionCalculations(
  option: QuoteOption,
  quoteData: QuoteData,
  onUpdate: (optionId: string, updatedOption: QuoteOption) => void
) {
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

    // תמחור לפרויקט כולל מע"מ: {תמחור לפרויקט לפני מע"מ}*1.18
    const projectPriceBeforeVAT = option.projectPriceBeforeVAT || 0;
    const projectPriceWithVAT = projectPriceBeforeVAT * 1.18;

    // תמחור לפרויקט ללקוח לפני מע"מ: IF({תמחור לפרויקט לפני מע"מ} < 600, {תמחור לפרויקט לפני מע"מ} * 1.1, {תמחור לפרויקט לפני מע"מ})
    const projectPriceToClientBeforeVAT = projectPriceBeforeVAT < 600 
      ? projectPriceBeforeVAT * 1.1 
      : projectPriceBeforeVAT;

    // תמחור לפרויקט ללקוח כולל מע"מ: {תמחור לפרויקט ללקוח לפני מע"מ}*1.18
    const projectPriceToClientWithVAT = projectPriceToClientBeforeVAT * 1.18;

    // תקציב למארז לאחר משלוח
    const includeShipping = quoteData.includeShipping || false;
    const budgetPerPackage = quoteData.budgetPerPackage || 0;
    const shippingPriceToClient = option.shippingPriceToClient || 0;
    const budgetAfterShipping = includeShipping 
      ? budgetPerPackage - (shippingPriceToClient / packageQuantity)
      : budgetPerPackage;

    // מחיר עלות: {תקציב למארז לאחר משלוח}*(1-{יעד רווחיות}-{עמלת סוכן %})
    const profitTarget = option.profitTarget || quoteData.profitTarget || 0.36;
    const agentCommission = option.agentCommission || quoteData.agentCommission || 0;
    const costPrice = budgetAfterShipping * (1 - profitTarget - agentCommission);

    // הובלה במארז
    const deliveryInPackage = includeShipping ? (shippingPriceToClient / packageQuantity) : 0;

    // עלות עבודת אריזה: {כמות מוצרים}*0.5+IF(FIND("קופסת",{מוצרי אריזה ומיתוג}),2,1)
    const hasBox = option.items.some(item => item.type === 'packaging' && item.name?.includes('קופסת'));
    const packagingWorkCost = productQuantity * 0.5 + (hasBox ? 2 : 1);

    // תקציב נותר למוצרים
    const additionalExpenses = option.additionalExpenses || 0;
    const budgetRemainingForProducts = costPrice - (deliveryInPackage + productsCost + packagingItemsCost + additionalExpenses + packagingWorkCost);

    // רווח לעסקה בשקלים
    const profitPerDeal = budgetAfterShipping - deliveryInPackage - productsCost - additionalExpenses - packagingItemsCost - packagingWorkCost - (agentCommission * budgetAfterShipping);

    // % רווח בפועל למארז
    const actualProfitPercentage = budgetAfterShipping > 0 ? profitPerDeal / budgetAfterShipping : 0;

    // סה"כ רווח לעסקה
    const totalDealProfit = packageQuantity * profitPerDeal;

    // הכנסה ללא מע"מ: ({תקציב למארז לפני מע"מ} * {כמות מארזים})+{תמחור לפרויקט ללקוח לפני מע"מ}
    const revenueWithoutVAT = (budgetPerPackage * packageQuantity) + projectPriceToClientBeforeVAT;

    // רווח בפועל למארז
    const actualProfit = profitPerDeal;

    // עדכן רק אם השתנו הערכים (כולל packageId ו-packageNumber)
    onUpdate(option.id, {
      ...option,
      deliveryBoxesCount,
      projectPriceWithVAT,
      projectPriceToClientBeforeVAT,
      projectPriceToClientWithVAT,
      packagingWorkCost,
      costPrice,
      budgetRemainingForProducts,
      profitPerDeal,
      actualProfitPercentage,
      totalDealProfit,
      revenueWithoutVAT,
      productQuantity,
      packagingItemsCost,
      productsCost,
      actualProfit,
      // שמור את שדות המארז
      packageId: option.packageId,
      packageNumber: option.packageNumber,
      image: option.image
    });
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
    quoteData.packageQuantity,
    quoteData.profitTarget,
    quoteData.agentCommission,
    quoteData.includeShipping,
    option.id,
    onUpdate
  ]);
}
