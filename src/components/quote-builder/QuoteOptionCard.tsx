"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { QuoteData, QuoteOption, Item } from '@/types';
import { useOptionCalculations } from '@/hooks/useOptionCalculations';
import { ShippingSection } from './ShippingSection';
import { 
  ChevronDown, 
  Copy, 
  Trash, 
  Plus, 
  GripVertical,
  MoreVertical 
} from 'lucide-react';

interface QuoteOptionCardProps {
  option: QuoteOption;
  quoteData: QuoteData;
  onUpdate: (optionId: string, updatedOption: QuoteOption) => void;
  onDelete: (optionId: string) => void;
  onDuplicate: (optionId: string) => void;
  showDeleteButton: boolean;
  isIrrelevant?: boolean;
}

export function QuoteOptionCard({
  option,
  quoteData,
  onUpdate,
  onDelete,
  onDuplicate,
  showDeleteButton,
  isIrrelevant = false
}: QuoteOptionCardProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [showRowActions, setShowRowActions] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [quickPanelCollapsed, setQuickPanelCollapsed] = useState(false);

  // שימוש ב-hook לחישובים אוטומטיים
  useOptionCalculations(option, quoteData, onUpdate);

  const handleTitleChange = (title: string) => {
    onUpdate(option.id, { ...option, title });
  };

  const handleToggleCollapse = () => {
    onUpdate(option.id, { ...option, isCollapsed: !option.isCollapsed });
  };

  const handleStatusChange = (newStatus: string) => {
    onUpdate(option.id, { 
      ...option, 
      status: newStatus
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const itemData = JSON.parse(e.dataTransfer.getData("application/json"));
      
      // Handle package drop
      if (itemData.items) {
        const regularItems = itemData.items.map((item: any) => ({
          id: item.id,
          name: item.marketingDescription || item.name,
          details: item.details || "",
          price: item.price || 0,
          type: "product" as const,
          productType: item.productType || "",
          isEditable: false,
        }));

        const packagingItems = itemData.packagingItems ? 
          itemData.packagingItems.map((item: any) => ({
            id: item.id,
            name: item.marketingDescription || item.name,
            details: item.details || "",
            price: item.price || 0,
            type: "packaging" as const,
            productType: item.productType || "",
            isEditable: false,
          })) : [];

        let packagingName = '';
        let unitsPerCarton: number | undefined = undefined;
        
        if (itemData.packagingItems) {
          const packagingItem = itemData.packagingItems.find((item: any) => 
            item.productType === 'אריזה'
          );
          
          if (packagingItem) {
            packagingName = packagingItem.marketingDescription || packagingItem.name || '';
            unitsPerCarton = packagingItem.boxesPerCarton || undefined;
          }
        }

        onUpdate(option.id, {
          ...option,
          packageId: itemData.id,
          packageNumber: itemData.packageNumber || null,
          title: itemData.name,
          items: [...regularItems, ...packagingItems],
          total: itemData.packagePrice || 0,
          image: itemData.imageUrl || null,
          packaging: packagingName,
          unitsPerCarton: unitsPerCarton,
        });
      } else {
        const newItem: Item = {
          id: itemData.id,
          name: itemData.marketingDescription || itemData.name,
          details: itemData.details || "",
          price: itemData.price || 0,
          type: ["אריזה", "מיתוג", "קיטלוג"].some(t => 
            itemData.productType?.includes(t)
          ) ? "packaging" : "product",
          productType: itemData.productType || "",
          isEditable: false,
        };

        const updatedItems = [...option.items, newItem];
        
        let packagingName = option.packaging || '';
        let unitsPerCarton: number | undefined = option.unitsPerCarton;
        
        if (newItem.type === 'packaging' && itemData.productType === 'אריזה') {
          packagingName = itemData.marketingDescription || itemData.name || '';
          unitsPerCarton = itemData.boxesPerCarton || undefined;
        }

        onUpdate(option.id, {
          ...option,
          items: updatedItems,
          packaging: packagingName,
          unitsPerCarton: unitsPerCarton,
        });
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const handleAddCustomProduct = () => {
    const newItem: Item = {
      id: `custom-product-${Date.now()}`,
      name: "",
      details: "",
      isCustom: true,
      isEditable: true,
      type: "product",
    };

    const items = [...option.items];
    const lastProductIndex = items.reduce((lastIndex, item, index) => 
      item.type !== "packaging" ? index : lastIndex, -1);
      
    if (lastProductIndex === -1) {
      items.unshift(newItem);
    } else {
      items.splice(lastProductIndex + 1, 0, newItem);
    }

    onUpdate(option.id, { ...option, items });
  };

  const handleAddCustomPackaging = () => {
    const newItem: Item = {
      id: `custom-packaging-${Date.now()}`,
      name: "",
      details: "",
      isCustom: true,
      isEditable: true,
      type: "packaging",
    };

    const items = [...option.items];
    const lastPackagingIndex = items.reduce((lastIndex, item, index) => 
      item.type === "packaging" ? index : lastIndex, -1);
      
    if (lastPackagingIndex === -1) {
      items.push(newItem);
    } else {
      items.splice(lastPackagingIndex + 1, 0, newItem);
    }

    onUpdate(option.id, { ...option, items });
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = option.items.filter(item => item.id !== itemId);
    onUpdate(option.id, { ...option, items: updatedItems });
  };

  const handleDuplicateItem = (itemId: string) => {
    const itemIndex = option.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const itemToDuplicate = option.items[itemIndex];
    const newItem = {
      ...itemToDuplicate,
      id: `${itemToDuplicate.id}-copy-${Date.now()}`,
    };

    const newItems = [...option.items];
    newItems.splice(itemIndex + 1, 0, newItem);
    
    onUpdate(option.id, { ...option, items: newItems });
  };

  const handleItemChange = (itemId: string, field: keyof Item, value: any) => {
    const updatedItems = option.items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    onUpdate(option.id, { ...option, items: updatedItems });
  };

  const handleRowDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDragOver = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(targetItemId);
  };

  const handleRowDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleRowDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetItemId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const items = [...option.items];
    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetItemId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const [removed] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, removed);
    
    onUpdate(option.id, { ...option, items });
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const renderItemRow = (item: Item, index: number) => (
    <tr 
      key={item.id} 
      draggable
      onDragStart={(e) => handleRowDragStart(e, item.id)}
      onDragOver={(e) => handleRowDragOver(e, item.id)}
      onDragEnd={handleRowDragEnd}
      onDrop={(e) => handleRowDrop(e, item.id)}
      className={`border-b last:border-b-0 group transition-all duration-200 ${
        draggedItem === item.id 
          ? 'opacity-30 bg-blue-100 shadow-lg transform scale-105' 
          : 'hover:bg-gray-50'
      } ${
        dragOverItem === item.id && draggedItem !== item.id
          ? 'bg-blue-50 border-t-2 border-b-2 border-blue-400 shadow-md' 
          : ''
      } cursor-move select-none`}
    >
      <td className="p-2 border border-gray-300 w-8">
        <div className="flex items-center justify-center">
          <GripVertical className={`w-4 h-4 transition-colors ${
            draggedItem === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
          }`} />
        </div>
      </td>
      
      <td className="p-2 border border-gray-300">
        {item.isEditable ? (
          <Input
            value={item.name}
            onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
            className="w-full text-sm"
            placeholder="שם המוצר"
          />
        ) : (
          <span className="text-sm">{item.name}</span>
        )}
      </td>
      
      <td className="p-2 border border-gray-300">
        {item.isEditable ? (
          <Input
            value={item.details}
            onChange={(e) => handleItemChange(item.id, 'details', e.target.value)}
            className="w-full text-sm"
            placeholder="פרטים"
          />
        ) : (
          <span className="text-xs text-gray-600">{item.details}</span>
        )}
      </td>
      
      <td className="p-2 border border-gray-300 text-center">
        {item.isEditable ? (
          <Input
            type="number"
            value={item.price || ''}
            onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
            className="w-20 text-sm text-center"
            placeholder="0"
          />
        ) : (
          <span className="text-sm font-medium">₪{item.price || 0}</span>
        )}
      </td>
      
      <td className="p-2 border border-gray-300 text-center">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowRowActions(showRowActions === item.id ? null : item.id)}
            className="h-8 w-8"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          
          {showRowActions === item.id && (
            <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
              <button
                onClick={() => {
                  handleDuplicateItem(item.id);
                  setShowRowActions(null);
                }}
                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Copy size={14} className="inline ml-2" /> שכפל שורה
              </button>
              <button
                onClick={() => {
                  handleRemoveItem(item.id);
                  setShowRowActions(null);
                }}
                className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                <Trash size={14} className="inline ml-2" /> מחק שורה
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );

  const packagingItems = option.items.filter(item => item.type === 'packaging');
  const productItems = option.items.filter(item => item.type !== 'packaging');

  // חישוב תקציב למארז לאחר משלוח (עבור tooltips)
  const packageQuantity = quoteData.packageQuantity || 1;
  const includeVAT = quoteData.includeVAT || false;
  let budgetPerPackage = quoteData.budgetPerPackage || 0;
  
  // אם המחיר כולל מע"מ - הורד 18%
  if (includeVAT) {
    budgetPerPackage = budgetPerPackage / 1.18;
  }
  
  const includeShipping = quoteData.includeShipping || false;
  const shippingPriceToClient = option.shippingPriceToClient || 0;
  const shippingCostPerPackage = includeShipping ? (shippingPriceToClient / packageQuantity) : 0;

  // Lightbox Component
  const ImageLightbox = () => {
    if (!showLightbox || !option.image) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
        onClick={() => setShowLightbox(false)}
      >
        <div className="relative max-w-5xl max-h-[90vh]">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
          >
            ✕
          </button>
          <img 
            src={option.image} 
            alt={option.title}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      </div>
    );
  };

  // Quick Calculations Panel Component
  const QuickCalculationsPanel = () => {
    if (option.items.length === 0) return null;
    
    const profitColor = (option.actualProfitPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600';
    const budgetColor = (option.budgetRemainingForProducts || 0) >= 0 ? 'text-green-600' : 'text-red-600';
    const totalProfitColor = (option.totalDealProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-md mb-4">
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setQuickPanelCollapsed(!quickPanelCollapsed)}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span className="font-bold text-blue-900">חישובים מהירים</span>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-blue-700 transition-transform ${quickPanelCollapsed ? 'rotate-180' : ''}`}
          />
        </div>
        
        {!quickPanelCollapsed && (
          <div className="px-4 pb-4 grid grid-cols-3 gap-3 text-sm">
            {/* שורה ראשונה */}
            <div className="bg-white p-2 rounded border border-blue-200">
              <div className="text-gray-600 text-xs mb-1">יעד ריווחיות:</div>
              <div className="relative">
                <Input
                  type="number"
                  value={option.profitTarget || quoteData.profitTarget || 36}
                  onChange={(e) => onUpdate(option.id, { ...option, profitTarget: parseFloat(e.target.value) || 0 })}
                  className="text-base font-bold text-blue-900 h-8 pr-8"
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-blue-700 font-bold">%</span>
              </div>
            </div>
            
            <div className="bg-white p-2 rounded border border-blue-200">
              <div className="text-gray-600 text-xs mb-1">רווח בפועל:</div>
              <div className={`text-xl font-bold ${profitColor}`}>
                {((option.actualProfitPercentage || 0) * 100).toFixed(2)}%
              </div>
            </div>
            
            <div className="bg-white p-2 rounded border border-blue-200">
              <div className="text-gray-600 text-xs mb-1">עלות מוצרים:</div>
              <div className="text-xl font-bold text-gray-900">
                ₪{(option.productsCost || 0).toFixed(2)}
              </div>
            </div>
            
            {/* שורה שנייה */}
            <div className="bg-white p-2 rounded border border-blue-200">
              <div className="text-gray-600 text-xs mb-1">תקציב נותר:</div>
              <div className={`text-xl font-bold ${budgetColor}`}>
                {(option.budgetRemainingForProducts || 0) < 0 ? '-' : ''}₪{Math.abs(option.budgetRemainingForProducts || 0).toFixed(2)}
              </div>
            </div>
            
            <div className="bg-white p-2 rounded border border-blue-200">
              <div className="text-gray-600 text-xs mb-1">סה"כ רווח לעסקה:</div>
              <div className={`text-xl font-bold ${totalProfitColor}`}>
                {(option.totalDealProfit || 0) < 0 ? '-' : ''}₪{Math.abs(option.totalDealProfit || 0).toFixed(2)}
              </div>
            </div>
            
            <div className="bg-white p-2 rounded border border-blue-200">
              <div className="text-gray-600 text-xs mb-1">הכנסה ללא מע"מ:</div>
              <div className="text-xl font-bold text-blue-900">
                ₪{(option.revenueWithoutVAT || 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`bg-white border-2 shadow-lg hover:shadow-xl transition-all ${
      isIrrelevant ? 'border-gray-300' : 'border-blue-200'
    }`}>
      
      <CardHeader className="border-b bg-white/80 flex-row justify-between items-center py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleToggleCollapse}>
            <ChevronDown 
              size={16} 
              className={`${option.isCollapsed ? "rotate-180" : ""} transform transition-transform`} 
            />
          </Button>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">סטטוס:</label>
            <select
              value={option.status || 'אופציה בעבודה'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="מחכה לבניית אופציה">מחכה לבניית אופציה</option>
              <option value="אופציה בעבודה">אופציה בעבודה</option>
              <option value="אופציה מאושרת לשליחה">אופציה מאושרת לשליחה</option>
              <option value="נשלחה הצעה ללקוח">נשלחה הצעה ללקוח</option>
              <option value="לאישור בתאל">לאישור בתאל</option>
              <option value="מאושר בתאל">מאושר בתאל</option>
              <option value="אופציה לא רלוונטית">אופציה לא רלוונטית</option>
              <option value="כיוון חיובי">כיוון חיובי</option>
              <option value="לקראת סגירה">לקראת סגירה</option>
              <option value="בתיקון">בתיקון</option>
              <option value="אופציה אושרה ע\"י הלקוח">אופציה אושרה ע"י הלקוח</option>
              <option value="אופציה לאחר תיקון">אופציה לאחר תיקון</option>
              <option value="הצעה בהולד">הצעה בהולד</option>
            </select>
          </div>
        </div>
        
        <Input
          value={option.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-xl font-bold bg-transparent border-none focus:ring-0 text-center mx-4 flex-1"
          placeholder="כותרת האופציה"
        />
        
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onDuplicate(option.id)}>
            <Copy size={16} />
          </Button>
          {showDeleteButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(option.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash size={16} />
            </Button>
          )}
        </div>
      </CardHeader>

      {!option.isCollapsed && (
        <CardContent className="p-6">
          <ImageLightbox />
          
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="min-h-[200px] rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors"
          >
            <QuickCalculationsPanel />
            
            {option.image && (
              <div className="mb-4 flex justify-center">
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => setShowLightbox(true)}
                >
                  <img 
                    src={option.image} 
                    alt={option.title}
                    className="h-40 w-auto rounded-lg shadow-md border-2 border-gray-200 group-hover:border-blue-400 transition-all"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-2xl">🔍</span>
                  </div>
                </div>
              </div>
            )}
            
            {(option.packageNumber || option.packageId || option.packaging || option.unitsPerCarton) && (
              <div className="hidden bg-purple-50 p-3 rounded-lg border border-purple-200 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {option.packageNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">מספר מארז:</span>
                      <span className="font-semibold text-purple-700">{option.packageNumber}</span>
                    </div>
                  )}
                  {option.packageId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID מארז:</span>
                      <span className="font-semibold text-purple-700">{option.packageId}</span>
                    </div>
                  )}
                  {option.packaging && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">אריזה:</span>
                      <span className="font-semibold text-purple-700">{option.packaging}</span>
                    </div>
                  )}
                  {option.unitsPerCarton && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">כמות בקרטון:</span>
                      <span className="font-semibold text-purple-700">{option.unitsPerCarton}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {packagingItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="text-sm font-semibold bg-gray-50 text-gray-700 px-4 py-3 border-b">
                  מוצרי אריזה ומיתוג
                </div>
                <table className="w-full" dir="rtl">
                  <thead>
                    <tr className="bg-gray-100 text-xs text-gray-600">
                      <th className="p-2 border border-gray-300 w-8" title="גרור כדי לשנות סדר">⇅</th>
                      <th className="p-2 border border-gray-300 text-right">שם המוצר</th>
                      <th className="p-2 border border-gray-300 text-right">פרטים</th>
                      <th className="p-2 border border-gray-300 text-center">מחיר</th>
                      <th className="p-2 border border-gray-300 w-12">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packagingItems.map((item, index) => renderItemRow(item, index))}
                  </tbody>
                </table>
              </div>
            )}

            {productItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="text-sm font-semibold bg-gray-50 text-gray-700 px-4 py-3 border-b">
                  מוצרים
                </div>
                <table className="w-full" dir="rtl">
                  <thead>
                    <tr className="bg-gray-100 text-xs text-gray-600">
                      <th className="p-2 border border-gray-300 w-8" title="גרור כדי לשנות סדר">⇅</th>
                      <th className="p-2 border border-gray-300 text-right">שם המוצר</th>
                      <th className="p-2 border border-gray-300 text-right">פרטים</th>
                      <th className="p-2 border border-gray-300 text-center">מחיר</th>
                      <th className="p-2 border border-gray-300 w-12">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productItems.map((item, index) => renderItemRow(item, index))}
                  </tbody>
                </table>
              </div>
            )}

            {option.items.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-500">
                גרור מוצרים או מארזים לכאן
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCustomProduct}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 ml-1" />
                הוסף מוצר
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCustomPackaging}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 ml-1" />
                הוסף אריזה
              </Button>
            </div>

            {option.items.length > 0 && (
              <div className="mt-6 space-y-4">
                <ShippingSection 
                  option={option}
                  onUpdate={onUpdate}
                />

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-bold text-yellow-700 mb-3">שדות קלט</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">יעד רווחיות (%)</label>
                      <Input
                        type="number"
                        value={option.profitTarget || quoteData.profitTarget || 36}
                        onChange={(e) => onUpdate(option.id, { ...option, profitTarget: parseFloat(e.target.value) || 0 })}
                        placeholder="36"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">סוכן</label>
                      <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {quoteData.agent || "ללא סוכן"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">עמלת סוכן (%)</label>
                      <Input
                        type="number"
                        value={option.agentCommission !== undefined ? option.agentCommission : (quoteData.agentCommission || 0)}
                        onChange={(e) => onUpdate(option.id, { ...option, agentCommission: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">הוצאות נוספות (₪)</label>
                      <Input
                        type="number"
                        value={option.additionalExpenses || 0}
                        onChange={(e) => onUpdate(option.id, { ...option, additionalExpenses: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-700 mb-3">חישובים</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">יעד רווחיות:</span>
                      <span className="font-semibold">{option.profitTarget || quoteData.profitTarget || 36}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">עמלת סוכן %:</span>
                      <span className="font-semibold">{option.agentCommission || quoteData.agentCommission || 0}%</span>
                    </div>
                    
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <Tooltip content={`${budgetPerPackage.toFixed(2)} × (1 - ${((option.profitTarget || quoteData.profitTarget || 36)/100).toFixed(2)} - ${((option.agentCommission || quoteData.agentCommission || 0)/100).toFixed(2)}) = ${(option.costPrice || 0).toFixed(2)}`}>
                        <span className="text-gray-600">מחיר עלות:</span>
                      </Tooltip>
                      <span className="font-semibold">₪{(option.costPrice || 0).toFixed(2)}</span>
                    </div>
                    
                    {includeShipping && (
                      <div className="flex justify-between py-1 border-b border-blue-100">
                        <Tooltip content={`${shippingPriceToClient.toFixed(2)} ÷ ${packageQuantity} = ${(option.shippingCostPerPackage || 0).toFixed(2)}`}>
                          <span className="text-gray-600">מחיר משלוח למארז:</span>
                        </Tooltip>
                        <span className="font-semibold">₪{(option.shippingCostPerPackage || 0).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <Tooltip content={`${option.productQuantity || 0} × 0.5 + ${option.packaging?.includes('קופסת') ? '2' : '1'} = ${(option.packagingWorkCost || 0).toFixed(2)}`}>
                        <span className="text-gray-600">עלות עבודת אריזה:</span>
                      </Tooltip>
                      <span className="font-semibold">₪{(option.packagingWorkCost || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <Tooltip content={`סכום מוצרי אריזה ומיתוג: ${(option.packagingItemsCost || 0).toFixed(2)}`}>
                        <span className="text-gray-600">עלות מוצרי אריזה ומיתוג:</span>
                      </Tooltip>
                      <span className="font-semibold">₪{(option.packagingItemsCost || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <Tooltip content={`סכום מוצרים: ${(option.productsCost || 0).toFixed(2)}`}>
                        <span className="text-gray-600">עלות מוצרים בפועל:</span>
                      </Tooltip>
                      <span className="font-semibold">₪{(option.productsCost || 0).toFixed(2)}</span>
                    </div>
                    
                    {(option.additionalExpenses || 0) > 0 && (
                      <div className="flex justify-between py-1 border-b border-blue-100">
                        <Tooltip content={`הוצאות נוספות שהוזנו: ${(option.additionalExpenses || 0).toFixed(2)}`}>
                          <span className="text-gray-600">הוצאות נוספות:</span>
                        </Tooltip>
                        <span className="font-semibold">₪{(option.additionalExpenses || 0).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <Tooltip content={`${(option.costPrice || 0).toFixed(2)} - ${shippingCostPerPackage.toFixed(2)} - ${(option.productsCost || 0).toFixed(2)} - ${(option.packagingItemsCost || 0).toFixed(2)} - ${(option.additionalExpenses || 0).toFixed(2)} - ${(option.packagingWorkCost || 0).toFixed(2)} = ${(option.budgetRemainingForProducts || 0).toFixed(2)}`}>
                        <span className="text-gray-600">תקציב נותר למוצרים:</span>
                      </Tooltip>
                      <span className={`font-semibold ${(option.budgetRemainingForProducts || 0) < 0 ? 'text-red-600' : ''}`}>
                        {(option.budgetRemainingForProducts || 0) < 0 ? '-' : ''}₪{Math.abs(option.budgetRemainingForProducts || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <Tooltip content={`מספר מוצרים באופציה: ${option.productQuantity || 0}`}>
                        <span className="text-gray-600">כמות מוצרים:</span>
                      </Tooltip>
                      <span className="font-semibold">{option.productQuantity || 0}</span>
                    </div>
                    
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <Tooltip content={`(${(option.profitPerDeal || 0).toFixed(2)} ÷ ${budgetPerPackage.toFixed(2)}) × 100 = ${((option.actualProfitPercentage || 0) * 100).toFixed(2)}%`}>
                        <span className="text-gray-600">% רווח בפועל למארז:</span>
                      </Tooltip>
                      <span className={`font-semibold ${(option.actualProfitPercentage || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {(option.actualProfitPercentage || 0) < 0 ? '-' : ''}{Math.abs((option.actualProfitPercentage || 0) * 100).toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-1 border-b border-green-100">
                      <Tooltip content={`${budgetPerPackage.toFixed(2)} - ${shippingCostPerPackage.toFixed(2)} - ${(option.productsCost || 0).toFixed(2)} - ${(option.additionalExpenses || 0).toFixed(2)} - ${(option.packagingItemsCost || 0).toFixed(2)} - ${(option.packagingWorkCost || 0).toFixed(2)} - (${((option.agentCommission || quoteData.agentCommission || 0)/100).toFixed(2)} × ${budgetPerPackage.toFixed(2)}) = ${(option.profitPerDeal || 0).toFixed(2)}`}>
                        <span className="text-gray-700 font-medium">רווח לעסקה בשקלים:</span>
                      </Tooltip>
                      <span className={`font-bold ${(option.profitPerDeal || 0) < 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {(option.profitPerDeal || 0) < 0 ? '-' : ''}₪{Math.abs(option.profitPerDeal || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-1 border-b border-green-100">
                      <Tooltip content={`${packageQuantity} × ${(option.profitPerDeal || 0).toFixed(2)} = ${(option.totalDealProfit || 0).toFixed(2)}`}>
                        <span className="text-gray-700 font-medium">סה"כ רווח לעסקה:</span>
                      </Tooltip>
                      <span className={`font-bold ${(option.totalDealProfit || 0) < 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {(option.totalDealProfit || 0) < 0 ? '-' : ''}₪{Math.abs(option.totalDealProfit || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-1">
                      <Tooltip content={`(${budgetPerPackage.toFixed(2)} × ${packageQuantity}) + ${(option.projectPriceToClientBeforeVAT || 0).toFixed(2)} = ${(option.revenueWithoutVAT || 0).toFixed(2)}`}>
                        <span className="text-gray-700 font-medium">הכנסה ללא מע"מ:</span>
                      </Tooltip>
                      <span className="font-bold text-blue-700">₪{(option.revenueWithoutVAT || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              <div className="hidden bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center text-white">
                    <span className="text-lg font-bold">מחיר עלות סופי:</span>
                    <span className="text-3xl font-bold">
                      ₪{option.items.reduce((sum, item) => sum + (item.price || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
