import { useEffect, useRef } from 'react';
import { QuoteOption, QuoteData } from '@/types';

export function useOptionCalculations(
  option: QuoteOption,
  quoteData: QuoteData,
  onUpdate: (optionId: string, updatedOption: QuoteOption) => void
) {
  const isCalculatingRef = useRef(false);

  useEffect(() => {
    if (isCalculatingRef.current) return;
    if (!option || !quoteData) return;

    // שדות lookup - באים מאיירטייבל
    const unitsPerCarton = option.unitsPerCarton || 1;
    const packaging = option.packaging || "";
    
    // שדות rollup - באים מאיירטייבל
    const packagingItemsCost = option.packagingItemsCost || 0;
    const productsCost = option.productsCost || 0;
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

    // עדכן
    if (
      option.deliveryBoxesCount !== deliveryBoxesCount ||
      option.projectPriceWithVAT !== projectPriceWithVAT ||
      option.projectPriceToClientBeforeVAT !== projectPriceToClientBeforeVAT ||
      option.projectPriceToClientWithVAT !== projectPriceToClientWithVAT ||
      option.packagingWorkCost !== packagingWorkCost ||
      option.costPrice !== costPrice ||
      option.budgetRemainingForProducts !== budgetRemainingForProducts ||
      option.profitPerDeal !== profitPerDeal ||
      option.actualProfitPercentage !== actualProfitPercentage ||
      option.totalDealProfit !== totalDealProfit ||
      option.revenueWithoutVAT !== revenueWithoutVAT
    ) {
      isCalculatingRef.current = true;
      
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
        productsCost
      });

      setTimeout(() => {
        isCalculatingRef.current = false;
      }, 100);
    }
  }, [
    option.items,
    option.additionalExpenses,
    option.profitTarget,
    option.agentCommission,
    option.shippingPriceToClient,
    option.unitsPerCarton,
    option.packaging,
    option.projectPriceBeforeVAT,
    option.packagingItemsCost,
    option.productsCost,
    quoteData.budgetPerPackage,
    quoteData.packageQuantity,
    quoteData.profitTarget,
    quoteData.agentCommission,
    quoteData.includeShipping,
    option.id,
    onUpdate
  ]);
}
