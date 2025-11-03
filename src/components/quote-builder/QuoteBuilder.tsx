"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useQuoteData } from '@/hooks/useQuoteData';
import { useHistory } from '@/hooks/useHistory';
import { CustomerInfo } from './CustomerInfo';
import { QuoteOptions } from './QuoteOptions';
import { ProductSidebar } from './ProductSidebar';
import { QuoteActions } from './QuoteActions';

interface QuoteBuilderProps {
  quoteId?: string;
  searchParams?: {
    recordId?: string;
    quoteId?: string;
    quoteNumber?: string;
    profitUnit?: string;
  };
}

export function QuoteBuilder({ quoteId, searchParams }: QuoteBuilderProps) {
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('מאתחל...');
  const hasLoadedRef = useRef(false);
  
  const {
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
  } = useQuoteData();

  const {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    initializeHistory,
  } = useHistory();

  // טען נתונים מאיירטייבל או אתחל הצעה חדשה - רק פעם אחת!
  useEffect(() => {
    if (hasLoadedRef.current) {
      setDebugInfo('כבר טענו, מדלג');
      return;
    }

    const loadData = async () => {
      try {
        const targetQuoteId = searchParams?.quoteId || quoteId;
        setDebugInfo(`מנסה לטעון quoteId: ${targetQuoteId}`);
        
        if (targetQuoteId && targetQuoteId.startsWith('rec')) {
          console.log('🔄 טוען הצעת מחיר מאיירטייבל:', targetQuoteId);
          setDebugInfo(`טוען מאיירטייבל: ${targetQuoteId}`);
          hasLoadedRef.current = true;
          
          const loadedData = await loadQuoteFromAirtable(targetQuoteId);
          setDebugInfo(`נטען: ${loadedData?.quoteNumber || 'לא ידוע'}`);
          
          if (loadedData?.options) {
            initializeHistory(loadedData.options);
          }
        } else if (!quoteData && !hasLoadedRef.current) {
          console.log('🆕 מאתחל הצעת מחיר חדשה');
          setDebugInfo('מאתחל הצעה חדשה');
          hasLoadedRef.current = true;
          
          const initialData = initializeQuoteData(
            searchParams?.recordId,
            searchParams?.quoteNumber
          );
          setDebugInfo(`אותחל: ${initialData.quoteNumber}`);
          initializeHistory(initialData.options);
        } else {
          setDebugInfo('לא מתאים לתנאים');
        }
      } catch (error: any) {
        console.error('❌ שגיאה בטעינת נתונים:', error);
        setDebugInfo(`שגיאה: ${error.message}`);
        setLoadingError('שגיאה בטעינת הצעת המחיר. אנא נסה שנית.');
        hasLoadedRef.current = false;
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUndo = useCallback(() => {
    const previousOptions = undo();
    if (previousOptions && quoteData) {
      updateQuoteData({
        ...quoteData,
        options: previousOptions
      });
    }
  }, [undo, quoteData, updateQuoteData]);

  const handleRedo = useCallback(() => {
    const nextOptions = redo();
    if (nextOptions && quoteData) {
      updateQuoteData({
        ...quoteData,
        options: nextOptions
      });
    }
  }, [redo, quoteData, updateQuoteData]);

  const handleSave = useCallback(async () => {
    try {
      await saveQuoteToAirtable();
      alert('✅ הצעת המחיר נשמרה בהצלחה!');
    } catch (error) {
      console.error('שגיאה בשמירה:', error);
      alert('❌ שגיאה בשמירת הצעת המחיר. אנא נסה שנית.');
    }
  }, [saveQuoteToAirtable]);

  const handleSend = useCallback(() => {
    console.log('Sending quote:', quoteData);
    alert('הצעת המחיר נשלחה!');
  }, [quoteData]);

  const handleUpdateOption = useCallback((optionId: string, updatedOption: any) => {
    updateOption(optionId, updatedOption);
    if (quoteData?.options) {
      setTimeout(() => addToHistory(quoteData.options), 0);
    }
  }, [updateOption, quoteData, addToHistory]);

  const handleAddOption = useCallback(() => {
    addOption();
    if (quoteData?.options) {
      setTimeout(() => addToHistory(quoteData.options), 0);
    }
  }, [addOption, quoteData, addToHistory]);

  const handleDeleteOption = useCallback((optionId: string) => {
    deleteOption(optionId);
    if (quoteData?.options) {
      setTimeout(() => addToHistory(quoteData.options), 0);
    }
  }, [deleteOption, quoteData, addToHistory]);

  const handleDuplicateOption = useCallback((optionId: string) => {
    duplicateOption(optionId);
    if (quoteData?.options) {
      setTimeout(() => addToHistory(quoteData.options), 0);
    }
  }, [duplicateOption, quoteData, addToHistory]);

  const handleCustomerInfoUpdate = useCallback((updatedData: any) => {
    updateQuoteData(updatedData);
  }, [updateQuoteData]);

  // Debug info display
  console.log('🔍 QuoteBuilder state:', {
    isLoading,
    hasQuoteData: !!quoteData,
    quoteNumber: quoteData?.quoteNumber,
    debugInfo,
    loadingError,
  });

  // Loading state
  if (isLoading || !quoteData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl mb-2">טוען נתוני הצעת מחיר...</p>
          <p className="text-gray-500 text-sm">{debugInfo}</p>
          <p className="text-gray-400 text-xs mt-4">
            isLoading: {isLoading ? 'כן' : 'לא'} | 
            quoteData: {quoteData ? 'יש' : 'אין'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadingError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌</div>
          <p className="text-gray-800 font-semibold mb-2">{loadingError}</p>
          <p className="text-gray-600 text-sm mb-4">{debugInfo}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            נסה שנית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-6">
      <div className="max-w-[1800px] mx-auto">
        
        {/* Header with actions */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {quoteData ? `הצעת מחיר מספר ${quoteData.quoteNumber}` : "בונה הצעות מחיר"}
            </h1>
            
            {/* Customer Info Section */}
            <CustomerInfo 
              quoteData={quoteData}
              onUpdate={handleCustomerInfoUpdate}
            />
          </div>
          
          {/* Action buttons */}
          <QuoteActions 
            quoteData={quoteData}
            onSave={handleSave}
            onSend={handleSend}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            isSaving={isSaving}
          />
        </div>

        {/* Main content: Sidebar + Quote Options */}
        <div className="grid grid-cols-[250px_1fr] gap-12">
          
          {/* Left sidebar with products */}
          <ProductSidebar />
          
          {/* Right side with quote options */}
          <QuoteOptions 
            quoteData={quoteData}
            onUpdate={handleCustomerInfoUpdate}
            onUpdateOption={handleUpdateOption}
            onAddOption={handleAddOption}
            onDeleteOption={handleDeleteOption}
            onDuplicateOption={handleDuplicateOption}
          />
        </div>
      </div>
    </div>
  );
}