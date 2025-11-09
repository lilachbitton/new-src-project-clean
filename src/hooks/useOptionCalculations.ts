import { useEffect } from 'react';
import { QuoteOption, QuoteData } from '@/types';

// Hook זה כבר לא מבצע חישובים - כל הנתונים מגיעים מאיירטייבל
export function useOptionCalculations(
  option: QuoteOption,
  quoteData: QuoteData,
  onUpdate: (optionId: string, updatedOption: QuoteOption) => void
) {
  // ה-hook הזה כעת ריק - כל החישובים מגיעים מאיירטייבל
  useEffect(() => {
    // לא עושים כלום - רק שומרים את ה-interface
  }, []);
}
