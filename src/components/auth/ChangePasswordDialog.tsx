'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Eye, EyeOff, Key, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ChangePasswordDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ChangePasswordDialog({ isOpen, onClose, onSuccess }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!currentPassword) {
      setError('נדרשת סיסמה נוכחית')
      return
    }

    if (!newPassword) {
      setError('נדרשת סיסמה חדשה')
      return
    }

    if (!confirmPassword) {
      setError('נדרש אימות סיסמה חדשה')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות החדשות אינן תואמות')
      return
    }

    if (newPassword.length < 6) {
      setError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים')
      return
    }

    if (currentPassword === newPassword) {
      setError('הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
          resetForm()
        }, 1500)
      } else {
        setError(data.error || 'שגיאה בשינוי הסיסמה')
      }
    } catch {
      setError('שגיאה בשינוי הסיסמה')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Key className="w-5 h-5" />
            שינוי סיסמה
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-700">הסיסמה שונתה בהצלחה!</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="current-password">סיסמה נוכחית</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">סיסמה חדשה</Label>
            <Input
              id="new-password"
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">אימות סיסמה חדשה</Label>
            <Input
              id="confirm-password"
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading || success}>
              {isLoading ? 'משנה...' : success ? 'שונה בהצלחה' : 'שנה סיסמה'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}