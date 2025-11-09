import { useEffect, useRef, useMemo } from 'react';
import { QuoteOption, QuoteData } from '@/types';

export function useOptionCalculations(
  option: QuoteOption,
  quoteData: QuoteData,
  onUpdate: (optionId: string, updatedOption: QuoteOption) => void
) {
  const previousValuesRef = useRef<string>('');

  // Create a string representation of all calculation inputs
  const calculationInputs = useMemo(() => {
    const items = option.items.map(item => `${item.id}-${item.price}-${item.type}`).join(',');
    return `${items}|${option.additionalExpenses}|${option.packagingWorkCost}|${option.profitTarget}|${option.agentCommission}|${quoteData.budgetPerPackage}|${quoteData.packageQuantity}|${quoteData.profitTarget}|${quoteData.agentCommission}|${quoteData.includeVAT}`;
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
    quoteData.includeVAT,
  ]);

  useEffect(() => {
    // Only run if inputs have changed
    if (previousValuesRef.current === calculationInputs) {
      return;
    }
    previousValuesRef.current = calculationInputs;

    if (!option || !quoteData) return;

    // חישוב עלות מוצרי אריזה
    const packagingItemsCost = option.items
      .filter(item => item.type === 'packaging')
      .reduce((sum, item) => sum + (item.price || 0), 0);

    // חישוב עלות מוצרים בפועל
    const productsCost = option.items
      .filter(item => item.type !== 'packaging')
      .reduce((sum, item) => sum + (item.price || 0), 0);

    // מחיר עלות = סכום כל המוצרים (אריזה + מוצרים)
    const costPrice = packagingItemsCost + productsCost;

    // תקציב למארז (מתוך QuoteData)
    const budgetPerPackage = quoteData.budgetPerPackage || 0;

    // יעד רווחיות (מתוך QuoteData או default)
    const profitTarget = option.profitTarget !== undefined ? option.profitTarget : (quoteData.profitTarget || 36);

    // עמלת סוכן (מתוך QuoteData או מהאופציה)
    const agentCommission = option.agentCommission !== undefined ? option.agentCommission : (quoteData.agentCommission || 0);

    // הוצאות נוספות
    const additionalExpenses = option.additionalExpenses || 0;

    // עלות עבודת אריזה
    const packagingWorkCost = option.packagingWorkCost || 0;

    // תקציב נותר למוצרים
    // נוסחה: תקציב למארז - (עלות אריזה + עלות עבודת אריזה + הוצאות נוספות + עמלת סוכן + יעד רווחיות)
    const budgetRemainingForProducts = budgetPerPackage - 
      (packagingItemsCost + packagingWorkCost + additionalExpenses + 
       (budgetPerPackage * agentCommission / 100) + 
       (budgetPerPackage * profitTarget / 100));

    // כמות מוצרים (לפי כמות המארזים)
    const productQuantity = quoteData.packageQuantity || 0;

    // % רווח בפועל למארז
    // נוסחה: ((תקציב למארז - מחיר עלות - עלות עבודת אריזה - הוצאות נוספות) / תקציב למארז) * 100
    const actualProfitPercentage = budgetPerPackage > 0
      ? ((budgetPerPackage - costPrice - packagingWorkCost - additionalExpenses) / budgetPerPackage) * 100
      : 0;

    // רווח בפועל למארז (בשקלים)
    const actualProfit = budgetPerPackage - costPrice - packagingWorkCost - additionalExpenses;

    // רווח לעסקה בשקלים
    // נוסחה: רווח למארז * כמות מארזים
    const profitPerDeal = actualProfit * productQuantity;

    // סה"כ רווח לעסקה (זהה לרווח לעסקה)
    const totalDealProfit = profitPerDeal;

    // הכנסה ללא מע"מ
    // נוסחה: (תקציב למארז * כמות מארזים) / 1.18
    const revenueWithoutVAT = quoteData.includeVAT
      ? (budgetPerPackage * productQuantity) / 1.18
      : budgetPerPackage * productQuantity;

    // עדכן את האופציה עם כל החישובים
    const updatedOption: QuoteOption = {
      ...option,
      packagingItemsCost,
      productsCost,
      costPrice,
      budgetRemainingForProducts,
      productQuantity,
      actualProfitPercentage,
      actualProfit,
      profitPerDeal,
      totalDealProfit,
      revenueWithoutVAT,
    };

    // רק אם יש שינוי בערכים, עדכן
    const hasChanges = 
      option.packagingItemsCost !== packagingItemsCost ||
      option.productsCost !== productsCost ||
      option.costPrice !== costPrice ||
      option.budgetRemainingForProducts !== budgetRemainingForProducts ||
      option.productQuantity !== productQuantity ||
      option.actualProfitPercentage !== actualProfitPercentage ||
      option.actualProfit !== actualProfit ||
      option.profitPerDeal !== profitPerDeal ||
      option.totalDealProfit !== totalDealProfit ||
      option.revenueWithoutVAT !== revenueWithoutVAT;

    if (hasChanges) {
      onUpdate(option.id, updatedOption);
    }
  }, [calculationInputs, option, quoteData, onUpdate]);
}
