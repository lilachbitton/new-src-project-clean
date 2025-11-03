"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Product, Package, SortOption, SORT_OPTIONS } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { usePackages } from '@/hooks/usePackages';
import { Search, Filter, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';

interface ProductSidebarProps {
  onProductDrag?: (product: Product) => void;
  onPackageDrag?: (pkg: Package) => void;
}

export function ProductSidebar({ 
  onProductDrag, 
  onPackageDrag 
}: ProductSidebarProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'branding' | 'packages'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<SortOption>('all');
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);

  // טעינת נתונים מאיירטייבל
  const { 
    products, 
    loading: productsLoading, 
    error: productsError, 
    refetch: refetchProducts,
    count: productsCount 
  } = useProducts();
  
  const { 
    packages, 
    loading: packagesLoading, 
    error: packagesError, 
    refetch: refetchPackages,
    count: packagesCount 
  } = usePackages();

  // Filter and sort products
  const getFilteredProducts = (productList: Product[]) => {
    let filtered = productList.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.price?.toString() === searchTerm;
      return matchesSearch;
    });

    if (filterType === "priceHighToLow") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (filterType === "priceLowToHigh") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    return filtered;
  };

  // Filter packages
  const getFilteredPackages = () => {
    let filtered = packages.filter((pkg) => {
      const matchesSearch =
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.packagePrice?.toString() === searchTerm;
      return matchesSearch;
    });

    if (filterType === "priceHighToLow") {
      filtered.sort((a, b) => (b.packagePrice || 0) - (a.packagePrice || 0));
    } else if (filterType === "priceLowToHigh") {
      filtered.sort((a, b) => (a.packagePrice || 0) - (b.packagePrice || 0));
    }

    return filtered;
  };

  // Categorize products by type
  const categorizeProducts = (productList: Product[]) => {
    return productList.reduce(
      (acc, product) => {
        if (product.type === 'packaging') {
          acc.brandingProducts.push(product);
        } else {
          acc.regularProducts.push(product);
        }
        return acc;
      },
      { regularProducts: [] as Product[], brandingProducts: [] as Product[] }
    );
  };

  const handleDragStart = (e: React.DragEvent, item: Product | Package) => {
    e.dataTransfer.setData("application/json", JSON.stringify(item));
  };

  const handleRefresh = async () => {
    await Promise.all([refetchProducts(), refetchPackages()]);
  };

  const categorizedProducts = categorizeProducts(getFilteredProducts(products));
  const filteredPackages = getFilteredPackages();

  // Loading state
  if (productsLoading || packagesLoading) {
    return (
      <Card className="sticky top-6 h-[calc(100vh-12rem)] bg-white border-2 border-blue-100 shadow-lg">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען מוצרים ומארזים...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (productsError || packagesError) {
    return (
      <Card className="sticky top-6 h-[calc(100vh-12rem)] bg-white border-2 border-red-100 shadow-lg">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">שגיאה בטעינת נתונים</p>
            {productsError && <p className="text-sm text-gray-600 mb-2">מוצרים: {productsError}</p>}
            {packagesError && <p className="text-sm text-gray-600 mb-4">מארזים: {packagesError}</p>}
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 ml-1" />
              נסה שוב
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-6 h-[calc(100vh-12rem)] bg-white border-2 border-blue-100 shadow-lg">
      
      {/* Header */}
      <CardHeader className="border-b bg-white/80 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-800">פריטים זמינים</h2>
              <p className="text-xs text-gray-500">
                {productsCount} מוצרים, {packagesCount} מארזים פעילים
              </p>
            </div>
            
            <div className="flex gap-2">
              {/* Refresh Button */}
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="רענן נתונים"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              
              {/* Sort Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as SortOption)}
                className="h-8 px-2 text-sm border rounded-md"
              >
                {Object.entries(SORT_OPTIONS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="חיפוש לפי שם או מחיר..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white pr-10 py-2 text-sm"
            />
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-4 h-[calc(100%-12rem)] overflow-y-auto">
        
        {/* Tabs */}
        <div className="w-full mb-4 bg-gray-100 rounded-lg flex p-0.5 gap-0.5">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 text-xs py-2 px-1 rounded-md transition-colors ${
              activeTab === 'products' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            מוצרים ({categorizedProducts.regularProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex-1 text-xs py-2 px-1 rounded-md transition-colors text-center ${
              activeTab === 'branding' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            מוצרי מיתוג<br />ואריזה ({categorizedProducts.brandingProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex-1 text-xs py-2 px-1 rounded-md transition-colors ${
              activeTab === 'packages' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            מארזים ({filteredPackages.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-2 overflow-y-auto">
          
          {/* Regular Products Tab */}
          {activeTab === 'products' && (
            <>
              {categorizedProducts.regularProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  לא נמצאו מוצרים
                </div>
              ) : (
                categorizedProducts.regularProducts.map((product) => (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, product)}
                    className="flex justify-between items-start p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-move active:scale-95 hover:border-blue-300"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-800 mb-1">
                        {product.marketingDescription || product.name}
                      </div>
                      {product.details && (
                        <div className="text-xs text-gray-500 mb-1">{product.details}</div>
                      )}
                      {product.inventory && (
                        <div className="text-xs text-blue-600">מלאי: {product.inventory}</div>
                      )}
                    </div>
                    {product.price && (
                      <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md mr-2">
                        ₪{product.price}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* Branding Products Tab */}
          {activeTab === 'branding' && (
            <>
              {categorizedProducts.brandingProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  לא נמצאו מוצרי מיתוג ואריזה
                </div>
              ) : (
                categorizedProducts.brandingProducts.map((product) => (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, product)}
                    className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-move active:scale-95 hover:border-blue-300"
                  >
                    <div className="font-medium text-sm text-gray-800">
                      {product.marketingDescription || product.name}
                    </div>
                    {product.details && (
                      <div className="text-xs text-gray-600 mb-1">{product.details}</div>
                    )}
                    {product.inventory && (
                      <div className="text-xs text-blue-600 mb-1">מלאי: {product.inventory}</div>
                    )}
                    {product.price && (
                      <div className="text-sm font-semibold text-gray-700 mt-1">
                        ₪{product.price}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* Packages Tab */}
          {activeTab === 'packages' && (
            <>
              {filteredPackages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  לא נמצאו מארזים פעילים
                </div>
              ) : (
                filteredPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, pkg)}
                    className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-move group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-800">{pkg.name}</div>
                        <div className="text-sm font-semibold text-green-600">₪{pkg.packagePrice}</div>
                        {pkg.parallelPackages && pkg.parallelPackages.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            כולל {pkg.parallelPackages.length} מארזים מקבילים
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPackage(expandedPackage === pkg.id ? null : pkg.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronDown 
                          className={`w-4 h-4 transform transition-transform ${
                            expandedPackage === pkg.id ? "rotate-180" : ""
                          }`} 
                        />
                      </button>
                    </div>
                    
                    {/* Expanded Package Details */}
                    {expandedPackage === pkg.id && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600">
                          {pkg.items.length > 0 && (
                            <>
                              <div className="font-medium mb-1">מוצרים ({pkg.items.length}):</div>
                              {pkg.items.slice(0, 3).map((item) => (
                                <div key={item.id} className="pr-2">
                                  • {item.marketingDescription || item.name}
                                </div>
                              ))}
                              {pkg.items.length > 3 && (
                                <div className="pr-2 text-gray-400">
                                  ועוד {pkg.items.length - 3} מוצרים...
                                </div>
                              )}
                            </>
                          )}
                          
                          {pkg.packagingItems && pkg.packagingItems.length > 0 && (
                            <>
                              <div className="font-medium mt-2 mb-1">אריזה ומיתוג ({pkg.packagingItems.length}):</div>
                              {pkg.packagingItems.slice(0, 3).map((item) => (
                                <div key={item.id} className="pr-2">
                                  • {item.marketingDescription || item.name}
                                </div>
                              ))}
                              {pkg.packagingItems.length > 3 && (
                                <div className="pr-2 text-gray-400">
                                  ועוד {pkg.packagingItems.length - 3} פריטים...
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}