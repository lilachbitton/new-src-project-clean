"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QuoteData, QuoteOption, Item } from '@/types';
import { useOptionCalculations } from '@/hooks/useOptionCalculations';
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

  // שימוש ב-hook לחישובים אוטומטיים
  useOptionCalculations(option, quoteData, onUpdate);

  const handleTitleChange = (title: string) => {
    onUpdate(option.id, { ...option, title });
  };

  const handleToggleCollapse = () => {
    onUpdate(option.id, { ...option, isCollapsed: !option.isCollapsed });
  };

  const handleToggleIrrelevant = () => {
    const newIrrelevant = !option.isIrrelevant;
    onUpdate(option.id, { 
      ...option, 
      isIrrelevant: newIrrelevant,
      isCollapsed: newIrrelevant ? true : option.isCollapsed 
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const itemData = JSON.parse(e.dataTransfer.getData("application/json"));
      
      // Handle package drop
      if (itemData.items) {
        const regularItems = itemData.items.map((item: any) => ({
          id: item.id, // שמור ID אמיתי!
          name: item.marketingDescription || item.name,
          details: item.details || "",
          price: item.price || 0,
          type: "product" as const,
          productType: item.productType || "",
          isEditable: true,
        }));

        const packagingItems = itemData.packagingItems ? 
          itemData.packagingItems.map((item: any) => ({
            id: item.id, // שמור ID אמיתי!
            name: item.marketingDescription || item.name,
            details: item.details || "",
            price: item.price || 0,
            type: "packaging" as const,
            productType: item.productType || "",
            isEditable: true,
          })) : [];

        onUpdate(option.id, {
          ...option,
          packageId: itemData.id, // שמור את ID המארז!
          title: itemData.name,
          items: [...regularItems, ...packagingItems],
          total: itemData.packagePrice || 0,
          image: itemData.imageUrl || null,
        });
      } else {
        // Handle single product drop
        const newItem: Item = {
          id: itemData.id, // שמור ID אמיתי!
          name: itemData.marketingDescription || itemData.name,
          details: itemData.details || "",
          price: itemData.price || 0,
          type: ["אריזה", "מיתוג", "קיטלוג"].some(t => 
            itemData.productType?.toLowerCase()?.includes(t)
          ) ? "packaging" : "product",
          productType: itemData.productType || "",
          isEditable: true,
        };

        onUpdate(option.id, {
          ...option,
          items: [...option.items, newItem]
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

    // Insert after last product (before packaging items)
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

    // Insert after last packaging item
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

  // Handle row drag and drop
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
    
    // Remove dragged item and insert at target position
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

  return (
    <Card className={`bg-white border-2 shadow-lg hover:shadow-xl transition-all ${
      isIrrelevant ? 'border-gray-300' : 'border-blue-200'
    }`}>
      
      {/* Header */}
      <CardHeader className="border-b bg-white/80 flex-row justify-between items-center py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleToggleCollapse}>
            <ChevronDown 
              size={16} 
              className={`${option.isCollapsed ? "rotate-180" : ""} transform transition-transform`} 
            />
          </Button>
          
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={option.isIrrelevant || false}
              onChange={handleToggleIrrelevant}
              className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <span className="text-sm">לא רלוונטי</span>
          </label>
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

      {/* Content */}
      {!option.isCollapsed && (
        <CardContent className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="min-h-[200px] rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors"
          >
            
            {/* Package Image */}
            {option.image && (
              <div className="mb-6 flex justify-center">
                <div className="max-w-md">
                  <img 
                    src={option.image} 
                    alt={option.title}
                    className="w-full h-auto rounded-lg shadow-md border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Packaging Items Section */}
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

            {/* Regular Products Section */}
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

            {/* Empty State */}
            {option.items.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-500">
                גרור מוצרים או מארזים לכאן
              </div>
            )}

            {/* Add Item Buttons */}
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

            {/* Financial Summary & Calculations */}
            {option.items.length > 0 && (
              <div className="mt-6 space-y-4">
                {/* עלויות משלוח */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-bold text-purple-700 mb-3">עלויות משלוח</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">כתובת אספקה</label>
                      <Input
                        value={option.deliveryAddress || ""}
                        onChange={(e) => onUpdate(option.id, { ...option, deliveryAddress: e.target.value })}
                        placeholder="כתובת"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">חברת משלוחים</label>
                      <select
                        value={option.deliveryCompany || ""}
                        onChange={(e) => onUpdate(option.id, { ...option, deliveryCompany: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-md"
                      >
                        <option value="">בחר</option>
                        <option value="חינם">חינם</option>
                        <option value="8">8 ש"ח</option>
                        <option value="16">16 ש"ח</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">כמות קרטונים</label>
                      <Input
                        type="number"
                        value={option.deliveryBoxesCount || ""}
                        onChange={(e) => onUpdate(option.id, { ...option, deliveryBoxesCount: parseInt(e.target.value) || null })}
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-gray-600 mb-1">תמחור משלוח ללקוח (₪)</label>
                    <Input
                      type="number"
                      value={option.shippingCost || ""}
                      onChange={(e) => onUpdate(option.id, { ...option, shippingCost: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="text-sm w-32"
                    />
                  </div>
                </div>

                {/* שדות קלט */}
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
                      <Input
                        value={option.agent || quoteData.agent || ""}
                        onChange={(e) => onUpdate(option.id, { ...option, agent: e.target.value })}
                        placeholder="שם הסוכן"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">עמלת סוכן (%)</label>
                      <Input
                        type="number"
                        value={option.agentCommission || quoteData.agentCommission || 0}
                        onChange={(e) => onUpdate(option.id, { ...option, agentCommission: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
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
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">עלות עבודת אריזה (₪)</label>
                      <Input
                        type="number"
                        value={option.packagingWorkCost || 0}
                        onChange={(e) => onUpdate(option.id, { ...option, packagingWorkCost: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* חישובים - תצוגה בלבד */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-bold text-blue-700 mb-3">חישובים</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">יעד רווחיות:</span>
                      <span className="font-semibold">{(option.profitTargetDisplay || option.profitTarget || quoteData.profitTarget || 36).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">עמלת סוכן %:</span>
                      <span className="font-semibold">{(option.agentCommissionDisplay || option.agentCommission || quoteData.agentCommission || 0).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">מחיר עלות:</span>
                      <span className="font-semibold">₪{(option.costPrice || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">הוצאות נוספות:</span>
                      <span className="font-semibold">₪{(option.additionalExpenses || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">עלות עבודת אריזה:</span>
                      <span className="font-semibold">₪{(option.packagingWorkCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">עלות מוצרי אריזה ומיתוג:</span>
                      <span className="font-semibold">₪{(option.packagingItemsCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">עלות מוצרים בפועל:</span>
                      <span className="font-semibold">₪{(option.productsCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">תקציב נותר למוצרים:</span>
                      <span className="font-semibold">₪{(option.budgetRemainingForProducts || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">כמות מוצרים:</span>
                      <span className="font-semibold">{option.productQuantity || 0}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-blue-100">
                      <span className="text-gray-600">% רווח בפועל למארז:</span>
                      <span className="font-semibold text-green-600">{(option.actualProfitPercentage || 0).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-green-100">
                      <span className="text-gray-700 font-medium">רווח לעסקה בשקלים:</span>
                      <span className="font-bold text-green-700">₪{(option.profitPerDeal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-green-100">
                      <span className="text-gray-700 font-medium">סה"כ רווח לעסקה:</span>
                      <span className="font-bold text-green-700">₪{(option.totalDealProfit || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-700 font-medium">הכנסה ללא מע"מ:</span>
                      <span className="font-bold text-blue-700">₪{(option.revenueWithoutVAT || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* מחיר סופי */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-lg shadow-md">
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
