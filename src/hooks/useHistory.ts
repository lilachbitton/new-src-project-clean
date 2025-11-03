"use client";

import { useReducer, useCallback } from 'react';
import { QuoteOption } from '@/types';

type HistoryState = {
  history: QuoteOption[][];
  index: number;
};

type HistoryAction = 
  | { type: 'ADD'; payload: QuoteOption[] }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'INITIALIZE'; payload: QuoteOption[] }
  | { type: 'CLEAR' };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'ADD': {
      // Remove any history after current index (for redo functionality)
      const newHistory = state.history.slice(0, state.index + 1);
      
      // Add new state to history
      newHistory.push(JSON.parse(JSON.stringify(action.payload)));
      
      // Limit history size to 50 entries
      if (newHistory.length > 50) {
        newHistory.shift();
        return { history: newHistory, index: state.index };
      } else {
        return { history: newHistory, index: state.index + 1 };
      }
    }
    
    case 'UNDO':
      if (state.index > 0) {
        return { ...state, index: state.index - 1 };
      }
      return state;
    
    case 'REDO':
      if (state.index < state.history.length - 1) {
        return { ...state, index: state.index + 1 };
      }
      return state;
    
    case 'INITIALIZE':
      return {
        history: [JSON.parse(JSON.stringify(action.payload))],
        index: 0
      };
    
    case 'CLEAR':
      return { history: [], index: -1 };
    
    default:
      return state;
  }
}

export function useHistory() {
  const [state, dispatch] = useReducer(historyReducer, { history: [], index: -1 });

  const addToHistory = useCallback((options: QuoteOption[]) => {
    dispatch({ type: 'ADD', payload: options });
  }, []);

  const undo = useCallback((): QuoteOption[] | null => {
    if (state.index > 0) {
      dispatch({ type: 'UNDO' });
      return JSON.parse(JSON.stringify(state.history[state.index - 1]));
    }
    return null;
  }, [state.history, state.index]);

  const redo = useCallback((): QuoteOption[] | null => {
    if (state.index < state.history.length - 1) {
      dispatch({ type: 'REDO' });
      return JSON.parse(JSON.stringify(state.history[state.index + 1]));
    }
    return null;
  }, [state.history, state.index]);

  const canUndo = state.index > 0;
  const canRedo = state.index < state.history.length - 1;

  const initializeHistory = useCallback((initialOptions: QuoteOption[]) => {
    dispatch({ type: 'INITIALIZE', payload: initialOptions });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  return {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    initializeHistory,
    clearHistory,
    historyLength: state.history.length,
    currentIndex: state.index,
  };
}