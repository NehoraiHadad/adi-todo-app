'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Copy, Check } from 'lucide-react'

interface PasswordConfirmationDialogProps {
  isOpen: boolean
  userName: string
  password: string
  copiedPassword: boolean
  onCopyPassword: (password: string) => void
  onConfirm: (confirmed: boolean) => void
}

export default function PasswordConfirmationDialog({
  isOpen,
  userName,
  password,
  copiedPassword,
  onCopyPassword,
  onConfirm
}: PasswordConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => onConfirm(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">🔐 אישור איפוס סיסמה</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-2">
              האם אתה בטוח שברצונך לאפס את הסיסמה עבור:
            </p>
            <p className="font-semibold text-lg">{userName}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600 mb-2 text-right">הסיסמה החדשה תהיה:</p>
            <div className="flex items-center gap-2 bg-white p-3 rounded border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyPassword(password)}
                className="flex items-center gap-1"
              >
                {copiedPassword ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copiedPassword ? 'הועתק!' : 'העתק'}
              </Button>
              <span className="font-mono text-lg flex-1 text-right">{password}</span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 text-right">
              💡 <strong>חשוב:</strong> וודא שהמשתמש מקבל את הסיסמה החדשה בצורה מאובטחת
            </p>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onConfirm(false)}>
            ביטול
          </Button>
          <Button onClick={() => onConfirm(true)} className="bg-blue-600 hover:bg-blue-700">
            אישור איפוס
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}