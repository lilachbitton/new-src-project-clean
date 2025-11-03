import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            בונה הצעות מחיר
          </h1>
          <p className="text-xl text-gray-600">
            מערכת מקצועית לבניית הצעות מחיר מותאמות אישית
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-700">
                צור הצעת מחיר חדשה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                התחל לבנות הצעת מחיר חדשה עם ממשק פשוט ואינטואיטיבי
              </p>
              <Link href="/quote-builder">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  התחל עכשיו
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">
                עריכת הצעה קיימת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                ערוך הצעת מחיר קיימת או המשך עבודה על הצעה שמורה
              </p>
              <Button variant="outline" className="w-full">
                טען הצעה קיימת
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">תכונות עיקריות</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl mb-2">📋</div>
                  <h3 className="font-semibold mb-2">ניהול מוצרים</h3>
                  <p className="text-sm text-gray-600">
                    גרור ושחרר מוצרים ומארזים בקלות
                  </p>
                </div>
                <div>
                  <div className="text-3xl mb-2">💰</div>
                  <h3 className="font-semibold mb-2">חישובים אוטומטיים</h3>
                  <p className="text-sm text-gray-600">
                    חישוב מחירים, רווחים ומע"מ אוטומטית
                  </p>
                </div>
                <div>
                  <div className="text-3xl mb-2">📤</div>
                  <h3 className="font-semibold mb-2">שליחה וייצוא</h3>
                  <p className="text-sm text-gray-600">
                    שלח הצעות במייל או ייצא ל-PDF
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}