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

    // חישובי בסיס
    const packagingItemsCost = option.items
      .filter(item => item.type === 'packaging')
      .reduce((sum, item) => sum + (item.price || 0), 0);

    const productsCost = option.items
      .filter(item => item.type !== 'packaging')
      .reduce((sum, item) => sum + (item.price || 0), 0);

    const productQuantity = option.items.filter(item => item.type !== 'packaging').length;

    // עלות עבודת אריזה (נוסחה מאיירטייבל)
    const packagingWorkCost = productQuantity * 0.5 + (option.items.some(item => item.name?.includes('קופסת')) ? 2 : 1);

    // תקציב נותר למוצרים
    const budgetPerPackage = quoteData.budgetPerPackage || 0;
    const profitTarget = option.profitTarget || quoteData.profitTarget || 0.36;
    const agentCommission = option.agentCommission || quoteData.agentCommission || 0;
    const additionalExpenses = option.additionalExpenses || 0;
    const shippingCostPerUnit = option.includeShipping && option.shippingCost ? option.shippingCost / (quoteData.packageQuantity || 1) : 0;

    const budgetRemainingForProducts = budgetPerPackage - 
      (shippingCostPerUnit + productsCost + packagingItemsCost + additionalExpenses + packagingWorkCost);

    // % רווח בפועל למארז
    const actualProfitPercentage = budgetPerPackage > 0
      ? ((budgetPerPackage - productsCost - packagingItemsCost - packagingWorkCost - additionalExpenses) / budgetPerPackage)
      : 0;

    // רווח לעסקה בשקלים
    const actualProfit = budgetPerPackage - productsCost - packagingItemsCost - packagingWorkCost - additionalExpenses - (budgetPerPackage * agentCommission);
    const profitPerDeal = actualProfit * (quoteData.packageQuantity || 1);

    // סה"כ רווח לעסקה
    const totalDealProfit = profitPerDeal;

    // הכנסה ללא מע"מ
    const revenueWithoutVAT = (budgetPerPackage * (quoteData.packageQuantity || 1)) / 1.17;

    // עדכן רק אם יש שינוי
    if (
      option.packagingItemsCost !== packagingItemsCost ||
      option.productsCost !== productsCost ||
      option.productQuantity !== productQuantity ||
      option.packagingWorkCost !== packagingWorkCost ||
      option.budgetRemainingForProducts !== budgetRemainingForProducts ||
      option.actualProfitPercentage !== actualProfitPercentage ||
      option.profitPerDeal !== profitPerDeal ||
      option.totalDealProfit !== totalDealProfit ||
      option.revenueWithoutVAT !== revenueWithoutVAT
    ) {
      isCalculatingRef.current = true;
      
      onUpdate(option.id, {
        ...option,
        packagingItemsCost,
        productsCost,
        productQuantity,
        packagingWorkCost,
        budgetRemainingForProducts,
        actualProfitPercentage,
        profitPerDeal,
        totalDealProfit,
        revenueWithoutVAT,
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
    option.shippingCost,
    option.includeShipping,
    quoteData.budgetPerPackage,
    quoteData.packageQuantity,
    quoteData.profitTarget,
    quoteData.agentCommission,
    option.id,
    onUpdate
  ]);
}
