'use client'

import { Button } from '@/components/ui/button'
import { Copy, Check, X } from 'lucide-react'

interface GeneratedPasswordDisplayProps {
  password: string
  type: string
  copiedPassword: boolean
  onCopyPassword: (password: string) => void
  onClose: () => void
}

export default function GeneratedPasswordDisplay({
  password,
  type,
  copiedPassword,
  onCopyPassword,
  onClose
}: GeneratedPasswordDisplayProps) {
  const getTypeMessage = () => {
    switch (type) {
      case 'child_friendly':
        return '👶 סיסמה פשוטה לילדים - וודא שהתלמיד זוכר אותה'
      case 'admin':
        return '🔐 סיסמת מנהל - העבר בצורה מאובטחת ושנה בהתחברות הראשונה'
      default:
        return '🔒 סיסמה מאובטחת - העבר למשתמש בצורה בטוחה'
    }
  }

  return (
    <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-green-800 text-lg flex items-center gap-2">
          ✅ סיסמה נוצרה בהצלחה
        </h4>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-green-300">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-mono text-xl text-center p-2 bg-gray-50 rounded border">
                {password}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopyPassword(password)}
              className="flex items-center gap-1 whitespace-nowrap"
            >
              {copiedPassword ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copiedPassword ? 'הועתק!' : 'העתק'}
            </Button>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 text-right">
            {getTypeMessage()}
          </p>
        </div>
      </div>
    </div>
  )
}