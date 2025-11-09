"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { QuoteOption } from '@/types';
import { ChevronDown } from 'lucide-react';

interface ShippingSectionProps {
  option: QuoteOption;
  onUpdate: (optionId: string, updatedOption: QuoteOption) => void;
}

export function ShippingSection({ option, onUpdate }: ShippingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // אופציות חברת משלוחים מאיירטייבל
  const deliveryCompanies = [
    "משלוחים אקספרס",
    "טיק טוק משלוחים", 
    "הבימה משלוחים",
    "איסוף עצמי"
  ]; 

  return (
    <div className="bg-purple-50 rounded-lg border border-purple-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-purple-100 transition-colors"
      >
        <h4 className="text-sm font-bold text-purple-700">עלויות משלוח</h4>
        <ChevronDown 
          className={`w-4 h-4 text-purple-700 transition-transform ${isExpanded ? '' : 'rotate-180'}`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          
          {/* שדות סטטיים */}
          <div className="bg-white p-3 rounded border border-purple-100">
            <div className="text-xs font-semibold text-purple-600 mb-2">מידע כללי</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">כמות שנכנסת בקרטון</label>
                <Input
                  type="number"
                  value={option.unitsPerCarton || ""}
                  onChange={(e) => onUpdate(option.id, { ...option, unitsPerCarton: parseInt(e.target.value) || undefined })}
                  placeholder="0"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">אריזה</label>
                <Input
                  value={option.packaging || ""}
                  readOnly
                  className="text-sm bg-gray-50"
                  placeholder="יבחר אוטומטית"
                />
              </div>
            </div>
          </div>

          {/* שדות קלט */}
          <div className="bg-white p-3 rounded border border-purple-100">
            <div className="text-xs font-semibold text-purple-600 mb-2">פרטי משלוח</div>
            <div className="grid grid-cols-2 gap-3">
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
                  value={option.shippingPriceBeforeVAT || ""}
                  onChange={(e) => onUpdate(option.id, { ...option, shippingPriceBeforeVAT: parseFloat(e.target.value) || 0 })}
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
                <span className="text-gray-600">תמחור משלוח ללקוח כולל מע"מ:</span>
                <span className="font-semibold">₪{(option.shippingPriceToClientWithVAT || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">תמחור משלוח ללקוח לפני מע"מ:</span>
                <span className="font-semibold">₪{(option.shippingPriceToClientBeforeVAT || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* מחיר סופי */}
          <div className="bg-white p-3 rounded border border-purple-100">
            <div className="text-xs font-semibold text-purple-600 mb-2">מחיר סופי ללקוח</div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">תמחור משלוח סופי (ניתן לעריכה)</label>
              <Input
                type="number"
                step="0.01"
                value={option.finalShippingPriceToClient ?? option.shippingPriceToClientBeforeVAT ?? ""}
                onChange={(e) => onUpdate(option.id, { ...option, finalShippingPriceToClient: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="text-sm font-semibold"
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
