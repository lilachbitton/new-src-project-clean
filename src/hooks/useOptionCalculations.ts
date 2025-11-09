import { useEffect, useRef, useMemo } from 'react';
import { QuoteOption, QuoteData } from '@/types';

export function useOptionCalculations(
  option: QuoteOption,
  quoteData: QuoteData,
  onUpdate: (optionId: string, updatedOption: QuoteOption) => void
) {
  const previousValuesRef = useRef<string>('');

  const calculationInputs = useMemo(() => {
    const items = option.items.map(item => `${item.id}-${item.price}-${item.type}`).join(',');
    return `${items}|${option.additionalExpenses}|${option.packagingWorkCost}|${option.profitTarget}|${option.agentCommission}|${quoteData.budgetPerPackage}|${quoteData.packageQuantity}|${quoteData.profitTarget}|${quoteData.agentCommission}`;
  }, [
    option.items,
    option.additionalExpenses,
    option.packagingWorkCost,
    option.profitTarget,
    option.agentCommission,
    quoteData.budgetPerPackage,
    quoteData.packageQuantity,
    quoteData.profitTarget,
    quoteData.agentCommission,
  ]);

  useEffect(() => {
    if (previousValuesRef.current === calculationInputs) return;
    previousValuesRef.current = calculationInputs;
    if (!option || !quoteData) return;

    // יעד רווחיות - בתצוגה %
    const profitTarget = option.profitTarget !== undefined ? option.profitTarget : (quoteData.profitTarget || 36);
    const profitTargetDisplay = profitTarget; // כבר באחוזים

    // עמלת סוכן - בתצוגה %
    const agentCommission = option.agentCommission !== undefined ? option.agentCommission : (quoteData.agentCommission || 0);
    const agentCommissionDisplay = agentCommission; // כבר באחוזים

    // מחיר עלות - סכום כל המוצרים
    const costPrice = option.items.reduce((sum, item) => sum + (item.price || 0), 0);

    // הוצאות נוספות
    const additionalExpenses = option.additionalExpenses || 0;

    // עלות עבודת אריזה
    const packagingWorkCost = option.packagingWorkCost || 0;

    // עלות מוצרי אריזה ומיתוג
    const packagingItemsCost = option.items
      .filter(item => item.type === 'packaging')
      .reduce((sum, item) => sum + (item.price || 0), 0);

    // עלות מוצרים בפועל
    const productsCost = option.items
      .filter(item => item.type !== 'packaging')
      .reduce((sum, item) => sum + (item.price || 0), 0);

    // תקציב נותר למוצרים
    const budgetPerPackage = quoteData.budgetPerPackage || 0;
    const budgetRemainingForProducts = budgetPerPackage - 
      (packagingItemsCost + packagingWorkCost + additionalExpenses + 
       (budgetPerPackage * agentCommission / 100) + 
       (budgetPerPackage * profitTarget / 100));

    // כמות מוצרים
    const productQuantity = quoteData.packageQuantity || 0;

    // % רווח בפועל למארז
    const actualProfitPercentage = budgetPerPackage > 0
      ? ((budgetPerPackage - costPrice - packagingWorkCost - additionalExpenses) / budgetPerPackage) * 100
      : 0;

    // רווח לעסקה בשקלים
    const actualProfit = budgetPerPackage - costPrice - packagingWorkCost - additionalExpenses;
    const profitPerDeal = actualProfit * productQuantity;

    // סה"כ רווח לעסקה
    const totalDealProfit = profitPerDeal;

    // הכנסה ללא מע"מ
    const revenueWithoutVAT = (budgetPerPackage * productQuantity) / 1.17;

    const updatedOption: QuoteOption = {
      ...option,
      profitTargetDisplay,
      agentCommissionDisplay,
      costPrice,
      additionalExpenses,
      packagingWorkCost,
      packagingItemsCost,
      productsCost,
      budgetRemainingForProducts,
      productQuantity,
      actualProfitPercentage,
      profitPerDeal,
      totalDealProfit,
      revenueWithoutVAT,
    };

    const hasChanges = 
      option.profitTargetDisplay !== profitTargetDisplay ||
      option.agentCommissionDisplay !== agentCommissionDisplay ||
      option.costPrice !== costPrice ||
      option.packagingItemsCost !== packagingItemsCost ||
      option.productsCost !== productsCost ||
      option.budgetRemainingForProducts !== budgetRemainingForProducts ||
      option.productQuantity !== productQuantity ||
      option.actualProfitPercentage !== actualProfitPercentage ||
      option.profitPerDeal !== profitPerDeal ||
      option.totalDealProfit !== totalDealProfit ||
      option.revenueWithoutVAT !== revenueWithoutVAT;

    if (hasChanges) {
      onUpdate(option.id, updatedOption);
    }
  }, [calculationInputs, option, quoteData, onUpdate]);
}
