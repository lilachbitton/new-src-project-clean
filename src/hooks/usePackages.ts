"use client";

import { useState, useEffect } from 'react';
import { Package } from '@/types';

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPackages() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Hook: טוען מארזים פעילים...');
        
        const response = await fetch('/api/packages');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'שגיאה לא ידועה');
        }
        
        console.log(`✅ Hook: נטענו ${result.data.length} מארזים פעילים`);
        setPackages(result.data);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'שגיאה בטעינת מארזים';
        console.error('❌ Hook: שגיאה בטעינת מארזים:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadPackages();
  }, []);

  const refetch = async () => {
    await loadPackages();
  };

  return { 
    packages, 
    loading, 
    error,
    refetch,
    count: packages.length
  };
}