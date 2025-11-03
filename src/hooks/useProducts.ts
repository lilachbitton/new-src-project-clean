"use client";

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Hook: טוען מוצרים...');
      
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'שגיאה לא ידועה');
      }
      
      console.log(`✅ Hook: נטענו ${result.data.length} מוצרים`);
      setProducts(result.data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בטעינת מוצרים';
      console.error('❌ Hook: שגיאה בטעינת מוצרים:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const refetch = async () => {
    await loadProducts();
  };

  return { 
    products, 
    loading, 
    error,
    refetch,
    count: products.length
  };
}
