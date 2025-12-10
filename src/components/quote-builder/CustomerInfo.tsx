"use client";

import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { QuoteData } from '@/types';

interface CustomerInfoProps {
  quoteData: QuoteData | null;
  onUpdate: (data: QuoteData | null) => void;
}

export function CustomerInfo({ quoteData, onUpdate }: CustomerInfoProps) {
  // שמור את הערך הקודם של עמלת הסוכן
  const prevAgentCommissionRef = useRef<number | undefined>(undefined);
  
  // אתחל את ה-ref בפעם הראשונה
  useEffect(() => {
    if (quoteData && prevAgentCommissionRef.current === undefined) {
      prevAgentCommissionRef.current = quoteData.agentCommission || 0;
      console.log('🆕 איתחול עמלת סוכן התחלתית:', prevAgentCommissionRef.current);
    }
  }, [quoteData]);
  
  // חישוב מע"מ אוטומטי כש-budgetPerPackage משתנה
  useEffect(() => {
    if (quoteData && quoteData.budgetPerPackage && quoteData.budgetPerPackage > 0) {
      if (quoteData.includeVAT) {
        // אם כולל מע"מ - חשב לפני מע"מ
        const beforeVAT = Math.round((quoteData.budgetPerPackage / 1.18) * 100) / 100;
        onUpdate({ ...quoteData, budgetBeforeVAT: beforeVAT, budgetWithVAT: quoteData.budgetPerPackage });
      } else {
        // אם לפני מע"מ - חשב כולל מע"מ
        const withVAT = Math.round((quoteData.budgetPerPackage * 1.18) * 100) / 100;
        onUpdate({ ...quoteData, budgetWithVAT: withVAT, budgetBeforeVAT: quoteData.budgetPerPackage });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteData?.budgetPerPackage, quoteData?.includeVAT]);

  if (!quoteData) return null;

  const updateField = (field: keyof QuoteData, value: any) => {
    // אם מעדכנים עמלת סוכן - עדכן גם באופציות
    if (field === 'agentCommission') {
      const newCommission = typeof value === 'number' ? value : (parseFloat(value) || 0);
      const oldCommission = prevAgentCommissionRef.current ?? 0;
      
      console.log('='.repeat(50));
      console.log('🔄 מעדכן עמלת סוכן');
      console.log('ערך קודם:', oldCommission);
      console.log('ערך חדש:', newCommission);
      console.log('מספר אופציות:', quoteData.options.length);
      
      // עדכן את כל האופציות שעדיין משתמשות בערך הקודם
      const updatedOptions = quoteData.options.map(option => {
        const optionCommission = option.agentCommission ?? 0;
        console.log(`אופציה ${option.id}: עמלה נוכחית = ${optionCommission}`);
        
        // אם האופציה משתמשת בערך הקודם (לא שונתה ידנית)
        if (optionCommission === oldCommission) {
          console.log(`  ✅ מעדכן מ-${optionCommission} ל-${newCommission}`);
          return { ...option, agentCommission: newCommission };
        }
        console.log(`  ⏭️ מדלג (שונתה ידנית)`);
        return option;
      });
      
      console.log('='.repeat(50));
      
      onUpdate({ ...quoteData, [field]: newCommission, options: updatedOptions });
      prevAgentCommissionRef.current = newCommission;
    } else {
      onUpdate({ ...quoteData, [field]: value });
    }
  };

  // המחיר המחושב להצגה
  const calculatedBudget = quoteData.includeVAT 
    ? (quoteData.budgetBeforeVAT || 0) 
    : (quoteData.budgetWithVAT || 0);

  return (
    <div className="grid grid-cols-3 gap-6 mb-6">
      
      {/* פרטי לקוח */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-blue-100">
        <h3 className="text-sm font-bold text-blue-700 mb-3 pb-2 border-b border-blue-200 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
          </svg>
          פרטי לקוח
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">שם לקוח</label>
            <Input
              value={quoteData.customerName || ""}
              onChange={(e) => updateField('customerName', e.target.value)}
              placeholder="שם מלא"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">אימייל</label>
            <Input
              type="email"
              value={quoteData.customerEmail || ""}
              onChange={(e) => updateField('customerEmail', e.target.value)}
              placeholder="example@mail.com"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">טלפון</label>
            <Input
              type="tel"
              value={quoteData.customerPhone || ""}
              onChange={(e) => updateField('customerPhone', e.target.value)}
              placeholder="050-1234567"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">חברה</label>
            <Input
              value={quoteData.customerCompany || ""}
              onChange={(e) => updateField('customerCompany', e.target.value)}
              placeholder="שם החברה"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">מועד (רק קריאה)</label>
            <div className="text-sm px-3 py-2 border rounded-md bg-gray-50 text-gray-700">
              {quoteData.occasion && quoteData.occasion.length > 0 
                ? quoteData.occasion.join(', ') 
                : 'ללא מועד'}
            </div>
          </div>
        </div>
      </div>

      {/* תקציב */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-green-100">
        <h3 className="text-sm font-bold text-green-700 mb-3 pb-2 border-b border-green-200 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
          </svg>
          תקציב
        </h3>
        <div className="space-y-3">
          {/* סוכן ועמלת סוכן */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">סוכן</label>
              <select
                value={quoteData.agent || ""}
                onChange={(e) => updateField('agent', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              >
                <option value="">ללא סוכן</option>
                <option value="תו 8">תו 8</option>
                <option value="גיא ליבוביץ">גיא ליבוביץ</option>
                <option value="לורן">לורן</option>
                <option value="ניקלס">ניקלס</option>
                <option value="ללא">ללא</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">עמלת סוכן (%)</label>
              <Input
                type="number"
                value={quoteData.agentCommission || ""}
                onChange={(e) => updateField('agentCommission', e.target.value ? parseFloat(e.target.value) : 0)}
                placeholder="0"
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">כמות מארזים</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={quoteData.packageQuantity || ""}
                  onChange={(e) => updateField('packageQuantity', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="0"
                  className="text-sm"
                />
                <span className="text-xs text-gray-500">יח'</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">תקציב למארז</label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={quoteData.budgetPerPackage || ""}
                  onChange={(e) => updateField('budgetPerPackage', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0"
                  className="text-sm"
                />
                <span className="text-xs font-medium">₪</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={quoteData.includeVAT || false}
                onChange={(e) => updateField('includeVAT', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-xs font-medium text-gray-700">מחירים כולל מע"מ</span>
            </label>

            {/* שדה מחושב */}
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {quoteData.includeVAT ? 'תקציב לפני מע"מ:' : 'תקציב כולל מע"מ:'}
                </span>
                <span className="text-sm font-bold text-green-700">
                  {calculatedBudget.toFixed(2)} ₪
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={quoteData.includeShipping || false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  updateField('includeShipping', checked);
                  
                  // אם מסמנים - בדוק אם יש עלות משלוח בכל האופציות
                  if (checked) {
                    setTimeout(() => {
                      const hasOptionsWithoutShipping = quoteData.options.some(
                        opt => !opt.shippingPriceToClient || opt.shippingPriceToClient === 0
                      );
                      
                      if (hasOptionsWithoutShipping) {
                        alert('⚠️ שים לב!\n\nנבחרה האופציה "תקציב כולל משלוח" אך ישנן אופציות בהן לא הוזנה עלות משלוח ללקוח.\n\nיש להזין עלות משלוח בכל האופציות על מנת שהחישובים יהיו תקינים.');
                      }
                    }, 100);
                  }
                }}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-xs font-medium text-gray-700">תקציב כולל משלוח</span>
            </label>
          </div>
        </div>
      </div>

      {/* משלוח ודגשים */}
      <div className="bg-white p-4 rounded-lg shadow-md border border-purple-100">
        <h3 className="text-sm font-bold text-purple-700 mb-3 pb-2 border-b border-purple-200 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
          </svg>
          משלוח ודגשים
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">תאריך אספקה</label>
            <Input
              type="date"
              value={quoteData.deliveryDate || ""}
              onChange={(e) => updateField('deliveryDate', e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">כתובת אספקה</label>
            <Input
              value={quoteData.deliveryAddress || ""}
              onChange={(e) => updateField('deliveryAddress', e.target.value)}
              placeholder="רחוב, עיר"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">הפצה</label>
            <select
              value={quoteData.distribution || ""}
              onChange={(e) => updateField('distribution', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
            >
              <option value="">בחר</option>
              <option value="משלוח לנקודה אחת">משלוח לנקודה אחת</option>
              <option value="משלוח למספר נקודות">משלוח למספר נקודות</option>
              <option value="איסוף עצמי">איסוף עצמי</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">גלויה</label>
              <select
                value={quoteData.customerCard || ""}
                onChange={(e) => updateField('customerCard', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              >
                <option value="">בחר</option>
                <option value="מעוניין">מעוניין</option>
                <option value="לא מעוניין">לא</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">מדבקה</label>
              <select
                value={quoteData.customerSticker || ""}
                onChange={(e) => updateField('customerSticker', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
              >
                <option value="">בחר</option>
                <option value="מעוניין">מעוניין</option>
                <option value="לא מעוניין">לא</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">סוג אריזה</label>
            <Input
              value={quoteData.preferredPackaging || ""}
              onChange={(e) => updateField('preferredPackaging', e.target.value)}
              placeholder="סוג אריזה מועדף"
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">דגשים</label>
            <textarea
              value={quoteData.customerNotes || ""}
              onChange={(e) => updateField('customerNotes', e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md resize-none"
              placeholder="דגשים והעדפות..."
              rows={2}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
