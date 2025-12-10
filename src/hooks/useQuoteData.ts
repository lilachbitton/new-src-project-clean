"use client";

import { useState, useCallback, useEffect } from 'react';
import { QuoteData, QuoteOption } from '@/types';

export function useQuoteData(initialData?: QuoteData | null) {
  const [quoteData, setQuoteData] = useState<QuoteData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateQuoteData = useCallback((updatedData: QuoteData | null) => {
    setQuoteData(updatedData);
  }, []);

  const updateCustomerField = useCallback((field: keyof QuoteData, value: any) => {
    setQuoteData(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

  const updateBudgetBeforeVAT = useCallback((value: number | undefined) => {
    setQuoteData(prev => {
      if (!prev) return null;
      
      const withVAT = value ? parseFloat((value * 1.18).toFixed(2)) : undefined;
      return {
        ...prev,
        budgetBeforeVAT: value,
        budgetWithVAT: withVAT
      };
    });
  }, []);

  const updateBudgetWithVAT = useCallback((value: number | undefined) => {
    setQuoteData(prev => {
      if (!prev) return null;
      
      const beforeVAT = value ? parseFloat((value / 1.18).toFixed(2)) : undefined;
      return {
        ...prev,
        budgetWithVAT: value,
        budgetBeforeVAT: beforeVAT
      };
    });
  }, []);

  const addOption = useCallback(() => {
    setQuoteData(prev => {
      if (!prev) return null;
      
      const newOption: QuoteOption = {
        id: String.fromCharCode(65 + prev.options.length), // A, B, C...
        title: `אופציה ${prev.options.length + 1}`,
        items: [],
        total: 0,
        additionalExpenses: 16, // ברירת מחדל 16 ש"ח
        agentCommission: prev.agentCommission || 0, // העמלה מההזדמנות
        isCollapsed: false,
        isIrrelevant: false,
      };

      return {
        ...prev,
        options: [...prev.options, newOption]
      };
    });
  }, []);

  const updateOption = useCallback((optionId: string, updatedOption: QuoteOption) => {
    setQuoteData(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        options: prev.options.map(option =>
          option.id === optionId ? { ...updatedOption } : option
        )
      };
    });
  }, []);

  const deleteOption = useCallback((optionId: string) => {
    setQuoteData(prev => {
      if (!prev || prev.options.length <= 1) return prev;
      
      return {
        ...prev,
        options: prev.options.filter(option => option.id !== optionId)
      };
    });
  }, []);

  const duplicateOption = useCallback((optionId: string) => {
    setQuoteData(prev => {
      if (!prev) return null;
      
      const optionToDuplicate = prev.options.find(opt => opt.id === optionId);
      if (!optionToDuplicate) return prev;

      const newOption: QuoteOption = {
        ...optionToDuplicate,
        id: String.fromCharCode(65 + prev.options.length),
        airtableId: undefined, // אל תשכפל את airtableId
        title: `${optionToDuplicate.title} (עותק)`,
        items: optionToDuplicate.items.map(item => ({
          ...item,
          // שמור על ID המקורי של המוצרים מאיירטייבל
        })),
        packageNumber: optionToDuplicate.packageNumber, // שמור מספר מארז
        image: optionToDuplicate.image, // שכפל גם את התמונה
        isCollapsed: false,
      };

      return {
        ...prev,
        options: [...prev.options, newOption]
      };
    });
  }, []);

  // טעינת הצעת מחיר מאיירטייבל
  const loadQuoteFromAirtable = useCallback(async (quoteId: string) => {
    setIsLoading(true);
    try {
      console.log('📥 טוען הצעת מחיר מאיירטייבל:', quoteId);
      
      const response = await fetch(`/api/get-quote-from-airtable?quoteId=${quoteId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load quote from Airtable');
      }

      const data = await response.json();
      console.log('✅ הצעת מחיר נטענה בהצלחה:', data);
      
      setQuoteData(data);
      return data;
    } catch (error) {
      console.error('❌ שגיאה בטעינת הצעת מחיר:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // שמירת הצעת מחיר לאיירטייבל
  const saveQuoteToAirtable = useCallback(async () => {
    // קבל את ה-quoteData הנוכחי מה-state
    setQuoteData(currentData => {
      if (!currentData) {
        console.warn('אין נתוני הצעת מחיר לשמירה');
        return currentData;
      }

      // התחל שמירה ב-async
      (async () => {
        setIsSaving(true);
        try {
          console.log('💾 שומר הצעת מחיר לאיירטייבל:', currentData.quoteNumber);
          
          const response = await fetch('/api/save-quote-to-airtable', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(currentData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || 'Failed to save quote to Airtable');
          }

          const result = await response.json();
          console.log('✅ הצעת מחיר נשמרה בהצלחה:', result);
          
          // עדכן את ה-Record ID וה-Option IDs אחרי שמירה מוצלחת
          if (result.quoteRecordId) {
            setQuoteData(prev => {
              if (!prev) return null;
              
              // עדכן גם את ה-airtableId של כל אופציה
              const updatedOptions = prev.options.map((option, index) => {
                if (result.optionIds && result.optionIds[index]) {
                  return {
                    ...option,
                    airtableId: result.optionIds[index]
                  };
                }
                return option;
              });
              
              return {
                ...prev,
                id: result.quoteRecordId,
                options: updatedOptions
              };
            });
          }
        } catch (error) {
          console.error('❌ שגיאה בשמירת הצעת מחיר:', error);
          throw error;
        } finally {
          setIsSaving(false);
        }
      })();

      return currentData;
    });
  }, []);

  // Initialize with default data if none provided
  const initializeQuoteData = useCallback((recordId?: string, quoteNumber?: string) => {
    const initialQuoteData: QuoteData = {
      id: recordId || `quote-${Date.now()}`,
      quoteNumber: quoteNumber || '1',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      budgetBeforeVAT: undefined,
      budgetWithVAT: undefined,
      packageQuantity: undefined,
      profitTarget: 36,
      agentCommission: 0,
      options: [{
        id: 'A',
        title: 'אופציה 1',
        items: [],
        total: 0,
        additionalExpenses: 16, // ברירת מחדל 16 ש"ח
        agentCommission: 0, // ברירת מחדל של עמלה
        isCollapsed: false,
        isIrrelevant: false,
      }],
      includeShipping: false,
    };

    setQuoteData(initialQuoteData);
    return initialQuoteData;
  }, []);

  return {
    quoteData,
    isLoading,
    isSaving,
    updateQuoteData,
    updateCustomerField,
    updateBudgetBeforeVAT,
    updateBudgetWithVAT,
    addOption,
    updateOption,
    deleteOption,
    duplicateOption,
    initializeQuoteData,
    loadQuoteFromAirtable,
    saveQuoteToAirtable,
  };
}
