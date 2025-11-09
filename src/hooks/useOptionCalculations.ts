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

    // חישוב מקומי לתצוגה מיידית
    const packagingItemsCost = option.items
      .filter(item => item.type === 'packaging')
      .reduce((sum, item) => sum + (item.price || 0), 0);

    const productsCost = option.items
      .filter(item => item.type !== 'packaging')
      .reduce((sum, item) => sum + (item.price || 0), 0);

    const productQuantity = option.items.filter(item => item.type !== 'packaging').length;

    // עדכן רק אם יש שינוי בערכים
    if (
      option.packagingItemsCost !== packagingItemsCost ||
      option.productsCost !== productsCost ||
      option.productQuantity !== productQuantity
    ) {
      isCalculatingRef.current = true;
      
      onUpdate(option.id, {
        ...option,
        packagingItemsCost,
        productsCost,
        productQuantity,
      });

      setTimeout(() => {
        isCalculatingRef.current = false;
      }, 100);
    }
  }, [option.items, option.id, onUpdate]);
}
