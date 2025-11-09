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
    if (!quoteData) return;
    
    setQuoteData(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  }, [quoteData]);

  const updateBudgetBeforeVAT = useCallback((value: number | null) => {
    if (!quoteData) return;
    
    const withVAT = value ? parseFloat((value * 1.18).toFixed(2)) : null;
    setQuoteData(prev => prev ? {
      ...prev,
      budgetBeforeVAT: value,
      budgetWithVAT: withVAT
    } : null);
  }, [quoteData]);

  const updateBudgetWithVAT = useCallback((value: number | null) => {
    if (!quoteData) return;
    
    const beforeVAT = value ? parseFloat((value / 1.18).toFixed(2)) : null;
    setQuoteData(prev => prev ? {
      ...prev,
      budgetWithVAT: value,
      budgetBeforeVAT: beforeVAT
    } : null);
  }, [quoteData]);

  const addOption = useCallback(() => {
    if (!quoteData) return;
    
    const newOption: QuoteOption = {
      id: String.fromCharCode(65 + quoteData.options.length), // A, B, C...
      title: `אופציה ${quoteData.options.length + 1}`,
      items: [],
      total: 0,
      isCollapsed: false,
      isIrrelevant: false,
    };

    setQuoteData(prev => prev ? {
      ...prev,
      options: [...prev.options, newOption]
    } : null);
  }, [quoteData]);

  const updateOption = useCallback((optionId: string, updatedOption: QuoteOption) => {
    if (!quoteData) return;
    
    setQuoteData(prev => prev ? {
      ...prev,
      options: prev.options.map(option =>
        option.id === optionId ? updatedOption : option
      )
    } : null);
  }, [quoteData]);

  const deleteOption = useCallback((optionId: string) => {
    if (!quoteData || quoteData.options.length <= 1) return;
    
    setQuoteData(prev => prev ? {
      ...prev,
      options: prev.options.filter(option => option.id !== optionId)
    } : null);
  }, [quoteData]);

  const duplicateOption = useCallback((optionId: string) => {
    if (!quoteData) return;
    
    const optionToDuplicate = quoteData.options.find(opt => opt.id === optionId);
    if (!optionToDuplicate) return;

    const newOption: QuoteOption = {
      ...optionToDuplicate,
      id: String.fromCharCode(65 + quoteData.options.length),
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

    setQuoteData(prev => prev ? {
      ...prev,
      options: [...prev.options, newOption]
    } : null);
  }, [quoteData]);

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
    if (!quoteData) {
      console.warn('אין נתוני הצעת מחיר לשמירה');
      return;
    }

    setIsSaving(true);
    try {
      console.log('💾 שומר הצעת מחיר לאיירטייבל:', quoteData.quoteNumber);
      
      const response = await fetch('/api/save-quote-to-airtable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to save quote to Airtable');
      }

      const result = await response.json();
      console.log('✅ הצעת מחיר נשמרה בהצלחה:', result);
      
      // עדכן את ה-Record ID וה-Option IDs אחרי שמירה מוצלחת (אבל שמור את התמונות)
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
      
      return result;
    } catch (error) {
      console.error('❌ שגיאה בשמירת הצעת מחיר:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [quoteData]);

  // Initialize with default data if none provided
  const initializeQuoteData = useCallback((recordId?: string, quoteNumber?: string) => {
    const initialQuoteData: QuoteData = {
      id: recordId || `quote-${Date.now()}`,
      quoteNumber: quoteNumber || '1',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      budgetBeforeVAT: null,
      budgetWithVAT: null,
      packageQuantity: null,
      profitTarget: 36,
      agentCommission: 0,
      options: [{
        id: 'A',
        title: 'אופציה 1',
        items: [],
        total: 0,
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
