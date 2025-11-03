"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { QuoteData } from '@/types';
import { Save, Send, Undo, Redo, Loader2 } from 'lucide-react';

interface QuoteActionsProps {
  quoteData: QuoteData | null;
  onSave: () => void;
  onSend: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isSaving?: boolean;
}

export function QuoteActions({ 
  quoteData, 
  onSave, 
  onSend, 
  onUndo, 
  onRedo, 
  canUndo = false, 
  canRedo = false,
  isSaving = false,
}: QuoteActionsProps) {
  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-md">
      
      {/* Save Button */}
      <Button 
        onClick={onSave}
        className="bg-green-600 hover:bg-green-700 text-white"
        disabled={!quoteData || isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            שומר...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 ml-2" />
            שמור הצעת מחיר
          </>
        )}
      </Button>

      {/* Send Button */}
      <Button 
        onClick={onSend}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        disabled={!quoteData || isSaving}
      >
        <Send className="w-4 h-4 ml-2" />
        שלח הצעת מחיר
      </Button>

      {/* Undo/Redo Buttons */}
      {(onUndo || onRedo) && (
        <div className="flex items-center gap-2 border-r pr-4 mr-4">
          {onUndo && (
            <Button
              onClick={onUndo}
              disabled={!canUndo || isSaving}
              variant="outline"
              size="icon"
              title="ביטול פעולה אחרונה (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
          )}
          
          {onRedo && (
            <Button
              onClick={onRedo}
              disabled={!canRedo || isSaving}
              variant="outline"
              size="icon"
              title="שחזור פעולה (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}