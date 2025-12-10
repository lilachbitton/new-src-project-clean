"use client";

import React from 'react';
import { QuoteData } from '@/types';
import { MessageSquare } from 'lucide-react';

interface QuoteCommentsProps {
  quoteData: QuoteData;
  isReviewMode: boolean;
  onUpdate: (updatedData: Partial<QuoteData>) => void;
}

export function QuoteComments({ quoteData, isReviewMode, onUpdate }: QuoteCommentsProps) {
  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      ...quoteData,
      quoteComments: e.target.value
    });
  };

  // אם אין הערות ולא במצב review - אל תציג כלום
  if (!quoteData.quoteComments && !isReviewMode) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          חידודי לקוח להצעה
        </h3>
        {!isReviewMode && quoteData.quoteComments && (
          <span className="text-sm text-gray-500">(מבתאל)</span>
        )}
      </div>

      {isReviewMode ? (
        <textarea
          value={quoteData.quoteComments || ''}
          onChange={handleCommentsChange}
          placeholder="הזיני כאן הערות וחידודים להצעה..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          rows={4}
        />
      ) : (
        <div className="bg-purple-50 border-r-4 border-indigo-600 p-4 rounded-lg">
          <p className="text-gray-800 whitespace-pre-wrap">
            {quoteData.quoteComments}
          </p>
        </div>
      )}
    </div>
  );
}
