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

    // שדות lookup/rollup - באים מאיירטייבל
    const unitsPerCarton = option.unitsPerCarton || 1;
    const packaging = option.items.find(item => item.type === 'packaging')?.name || "";
    const packagingItemsCost = option.packagingItemsCost || 0; // Rollup מאיירטייבל
    const productsCost = option.productsCost || 0; // Rollup מאיירטייבל
    const productQuantity = option.items.filter(item => item.type !== 'packaging').length;

    // נוסחאות מאיירטייבל
    const packageQuantity = quoteData.packageQuantity || 1;
    
    // כמות קרטונים: CEILING({כמות מארזים} / {כמות שנכנסת בקרטון})
    const deliveryBoxesCount = Math.ceil(packageQuantity / unitsPerCarton);

    // תקציב למארז לאחר משלוח: IF({תקציב כולל משלוח}, {תקציב למארז} - ({תמחור משלוח ללקוח} / {כמות מארזים}), {תקציב למארז})
    const includeShipping = quoteData.includeShipping || false;
    const budgetPerPackage = quoteData.budgetPerPackage || 0;
    const shippingPriceToClient = option.shippingPriceBeforeVAT || 0;
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

    // תקציב נותר למוצרים: {מחיר עלות} - ({הובלה במארז} + {עלות מוצרים בפועל} + {עלות מוצרי אריזה ומיתוג} + {הוצאות נוספות} + {עלות עבודת אריזה})
    const additionalExpenses = option.additionalExpenses || 0;
    const budgetRemainingForProducts = costPrice - (deliveryInPackage + productsCost + packagingItemsCost + additionalExpenses + packagingWorkCost);

    // רווח לעסקה בשקלים: {תקציב למארז לאחר משלוח}-{הובלה במארז}-{עלות מוצרים בפועל}-{הוצאות נוספות}-{עלות מוצרי אריזה ומיתוג}-{עלות עבודת אריזה}-({עמלת סוכן %}*{תקציב למארז לאחר משלוח})
    const profitPerDeal = budgetAfterShipping - deliveryInPackage - productsCost - additionalExpenses - packagingItemsCost - packagingWorkCost - (agentCommission * budgetAfterShipping);

    // % רווח בפועל למארז: ({רווח לעסקה בשקלים})/{תקציב למארז לאחר משלוח}
    const actualProfitPercentage = budgetAfterShipping > 0 ? profitPerDeal / budgetAfterShipping : 0;

    // סה"כ רווח לעסקה: {כמות מארזים}*{רווח לעסקה בשקלים}
    const totalDealProfit = packageQuantity * profitPerDeal;

    // הכנסה ללא מע"מ: ({תקציב למארז לפני מע"מ} * {כמות מארזים})+{תמחור לפרויקט ללקוח לפני מע"מ}
    // כרגע מפשט: תקציב*כמות / 1.17
    const revenueWithoutVAT = (budgetPerPackage * packageQuantity) / 1.17;

    // תמחור משלוח ללקוח כולל מע"מ
    const shippingPriceToClientWithVAT = shippingPriceToClient * 1.17;

    // תמחור משלוח סופי - אם לא הוזן, שווה לתמחור ללקוח לפני מע"מ
    const finalShippingPriceToClient = option.finalShippingPriceToClient ?? shippingPriceToClient;

    // עדכן
    if (
      option.deliveryBoxesCount !== deliveryBoxesCount ||
      option.packaging !== packaging ||
      option.packagingWorkCost !== packagingWorkCost ||
      option.costPrice !== costPrice ||
      option.budgetRemainingForProducts !== budgetRemainingForProducts ||
      option.profitPerDeal !== profitPerDeal ||
      option.actualProfitPercentage !== actualProfitPercentage ||
      option.totalDealProfit !== totalDealProfit ||
      option.revenueWithoutVAT !== revenueWithoutVAT ||
      option.shippingPriceToClientWithVAT !== shippingPriceToClientWithVAT ||
      option.shippingPriceToClientBeforeVAT !== shippingPriceToClient
    ) {
      isCalculatingRef.current = true;
      
      onUpdate(option.id, {
        ...option,
        deliveryBoxesCount,
        packaging,
        packagingWorkCost,
        costPrice,
        budgetRemainingForProducts,
        profitPerDeal,
        actualProfitPercentage,
        totalDealProfit,
        revenueWithoutVAT,
        shippingPriceToClientWithVAT,
        shippingPriceToClientBeforeVAT: shippingPriceToClient,
        finalShippingPriceToClient,
        // שמירת הערכים שבאים מאיירטייבל
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
    option.shippingPriceBeforeVAT,
    option.unitsPerCarton,
    option.finalShippingPriceToClient,
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
