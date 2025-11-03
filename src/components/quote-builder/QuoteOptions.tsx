"use client";

import React from 'react';
import { QuoteData, QuoteOption } from '@/types';
import { QuoteOptionCard } from './QuoteOptionCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface QuoteOptionsProps {
  quoteData: QuoteData | null;
  onUpdate: (data: QuoteData | null) => void;
  onUpdateOption: (optionId: string, updatedOption: QuoteOption) => void;
  onAddOption: () => void;
  onDeleteOption: (optionId: string) => void;
  onDuplicateOption: (optionId: string) => void;
}

export function QuoteOptions({ 
  quoteData, 
  onUpdate, 
  onUpdateOption,
  onAddOption,
  onDeleteOption,
  onDuplicateOption 
}: QuoteOptionsProps) {
  if (!quoteData || !quoteData.options) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-500 mb-4">אין אופציות להצגה</p>
          <Button onClick={onAddOption}>
            <Plus className="w-4 h-4 ml-2" />
            הוסף אופציה ראשונה
          </Button>
        </div>
      </div>
    );
  }

  // Separate relevant and irrelevant options
  const relevantOptions = quoteData.options.filter(option => !option.isIrrelevant);
  const irrelevantOptions = quoteData.options.filter(option => option.isIrrelevant);

  return (
    <div className="space-y-6">
      
      {/* Relevant Options */}
      <div className="grid grid-cols-2 gap-6">
        {relevantOptions.map((option) => (
          <QuoteOptionCard
            key={option.id}
            option={option}
            quoteData={quoteData}
            onUpdate={onUpdateOption}
            onDelete={onDeleteOption}
            onDuplicate={onDuplicateOption}
            showDeleteButton={quoteData.options.length > 1}
          />
        ))}

        {/* Add Option Button */}
        <div className="flex items-center justify-center min-h-[300px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
          <Button 
            onClick={onAddOption}
            variant="ghost"
            className="h-auto py-4 px-6 text-gray-600 hover:text-blue-600"
          >
            <Plus className="w-6 h-6 ml-2" />
            הוסף אופציה חדשה
          </Button>
        </div>
      </div>

      {/* Irrelevant Options (if any) */}
      {irrelevantOptions.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-600 mb-4 pb-2 border-b border-gray-300">
            אופציות לא רלוונטיות
          </h3>
          <div className="grid grid-cols-2 gap-6 opacity-60">
            {irrelevantOptions.map((option) => (
              <QuoteOptionCard
                key={option.id}
                option={option}
                quoteData={quoteData}
                onUpdate={onUpdateOption}
                onDelete={onDeleteOption}
                onDuplicate={onDuplicateOption}
                showDeleteButton={quoteData.options.length > 1}
                isIrrelevant={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}