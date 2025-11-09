"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { QuoteOption } from '@/types';
import { ChevronDown } from 'lucide-react';

interface ShippingSectionProps {
  option: QuoteOption;
  onUpdate: (optionId: string, updatedOption: QuoteOption) => void;
}

export function ShippingSection({ option, onUpdate }: ShippingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const deliveryCompanies = [
    "משלוחים אקספרס",
    "טיק טוק משלוחים", 
    "הבימה משלוחים",
    "איסוף עצמי"
  ];

  // חישובים אוטומטיים - כמות קרטונים להובלה
  // הנוסחה: CEILING(כמות מארזים / כמות שנכנסת בקרטון)
  // כמות מארזים זה שדה ברמת הציטוט, לא האופציה - לכן לא מחושב פה

  // תמחור לפרויקט כולל מע"מ
  useEffect(() => {
    if (option.projectPriceBeforeVAT !== undefined) {
      const calculated = option.projectPriceBeforeVAT * 1.18;
      if (option.projectPriceWithVAT !== calculated) {
        onUpdate(option.id, { ...option, projectPriceWithVAT: calculated });
      }
    }
  }, [option.projectPriceBeforeVAT]);

  // תמחור לפרויקט ללקוח לפני מע"מ
  useEffect(() => {
    if (option.projectPriceBeforeVAT !== undefined) {
      const calculated = option.projectPriceBeforeVAT < 600 
        ? option.projectPriceBeforeVAT * 1.1 
        : option.projectPriceBeforeVAT;
      
      if (option.projectPriceToClientBeforeVAT !== calculated) {
        // עדכן גם את תמחור משלוח ללקוח אם הוא ריק
        const updates: any = { ...option, projectPriceToClientBeforeVAT: calculated };
        if (!option.shippingPriceToClient || option.shippingPriceToClient === 0) {
          updates.shippingPriceToClient = calculated;
        }
        onUpdate(option.id, updates);
      }
    }
  }, [option.projectPriceBeforeVAT]);

  // תמחור לפרויקט ללקוח כולל מע"מ
  useEffect(() => {
    if (option.projectPriceToClientBeforeVAT !== undefined) {
      const calculated = option.projectPriceToClientBeforeVAT * 1.18;
      if (option.projectPriceToClientWithVAT !== calculated) {
        onUpdate(option.id, { ...option, projectPriceToClientWithVAT: calculated });
      }
    }
  }, [option.projectPriceToClientBeforeVAT]);

  return (
    <div className="bg-purple-50 rounded-lg border border-purple-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-purple-100 transition-colors"
      >
        <h4 className="text-sm font-bold text-purple-700">עלויות משלוח</h4>
        <ChevronDown 
          className={`w-4 h-4 text-purple-700 transition-transform ${isExpanded ? '' : 'rotate-180'}`}
        />
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          
          {/* שדות סטטיים/lookup */}
          <div className="bg-white p-3 rounded border border-purple-100">
            <div className="text-xs font-semibold text-purple-600 mb-2">מידע כללי</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">כמות שנכנסת בקרטון</label>
                <div className="text-sm font-semibold p-2 bg-gray-50 rounded border">
                  {option.unitsPerCarton || '-'}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">אריזה</label>
                <div className="text-sm p-2 bg-gray-50 rounded border truncate">
                  {option.packaging || '-'}
                </div>
              </div>
            </div>
          </div>

          {/* שדות קלט */}
          <div className="bg-white p-3 rounded border border-purple-100">
            <div className="text-xs font-semibold text-purple-600 mb-2">פרטי משלוח</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">חברת משלוחים</label>
                <select
                  value={option.deliveryCompany || ""}
                  onChange={(e) => onUpdate(option.id, { ...option, deliveryCompany: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md"
                >
                  <option value="">בחר</option>
                  {deliveryCompanies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">עלות משלוח מהספק (₪)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={option.projectPriceBeforeVAT || ""}
                  onChange={(e) => onUpdate(option.id, { ...option, projectPriceBeforeVAT: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">תמחור משלוח ללקוח (₪)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={option.shippingPriceToClient || ""}
                  onChange={(e) => onUpdate(option.id, { ...option, shippingPriceToClient: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* שדות חישוביים */}
          <div className="bg-white p-3 rounded border border-purple-100">
            <div className="text-xs font-semibold text-purple-600 mb-2">חישובים אוטומטיים</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">כמות קרטונים להובלה:</span>
                <span className="font-semibold">{option.deliveryBoxesCount || 0}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">תמחור לפרויקט כולל מע"מ:</span>
                <span className="font-semibold">₪{(option.projectPriceWithVAT || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">תמחור לפרויקט ללקוח לפני מע"מ:</span>
                <span className="font-semibold">₪{(option.projectPriceToClientBeforeVAT || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">תמחור לפרויקט ללקוח כולל מע"מ:</span>
                <span className="font-semibold">₪{(option.projectPriceToClientWithVAT || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
