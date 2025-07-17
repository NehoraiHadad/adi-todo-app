'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface RoleInconsistency {
  user_id: string;
  email: string;
  display_name: string;
  profile_role: string | null;
  user_role: string | null;
  issue_type: 'missing_user_role' | 'missing_profile_role' | 'role_mismatch';
}

interface ConsistencyReport {
  total_users: number;
  consistent_users: number;
  inconsistent_users: number;
  issues: RoleInconsistency[];
}

export default function RoleConsistencyManager() {
  const [report, setReport] = useState<ConsistencyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const checkConsistency = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/fix-roles');
      const data = await response.json();
      
      if (data.success) {
        setReport(data.report);
        setMessage({
          type: 'success',
          text: `בדיקה הושלמה: ${data.report.consistent_users} משתמשים עקביים, ${data.report.inconsistent_users} בעיות נמצאו`
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'שגיאה בבדיקת העקביות' });
      }
    } catch {
      setMessage({ type: 'error', text: 'שגיאה בחיבור לשרת' });
    } finally {
      setIsLoading(false);
    }
  };

  const fixAllIssues = async () => {
    setIsFixing(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/fix-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'fix_all',
          use_user_roles_as_source: true 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({
          type: 'success',
          text: `תיקון הושלם: ${data.details.fixed_count} משתמשים תוקנו, ${data.details.failed_count} כישלונות`
        });
        // Refresh the report
        await checkConsistency();
      } else {
        setMessage({ type: 'error', text: data.error || 'שגיאה בתיקון התפקידים' });
      }
    } catch {
      setMessage({ type: 'error', text: 'שגיאה בחיבור לשרת' });
    } finally {
      setIsFixing(false);
    }
  };

  const getIssueTypeBadge = (issueType: string) => {
    switch (issueType) {
      case 'missing_user_role':
        return <Badge variant="destructive">חסר תפקיד במערכת</Badge>;
      case 'missing_profile_role':
        return <Badge variant="outline">חסר תפקיד בפרופיל</Badge>;
      case 'role_mismatch':
        return <Badge variant="secondary">תפקידים לא תואמים</Badge>;
      default:
        return <Badge>{issueType}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            בדיקת עקביות תפקידים
          </CardTitle>
          <CardDescription>
            בדוק ותקן חוסר עקביות בתפקידי המשתמשים בין הטבלאות השונות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button 
              onClick={checkConsistency}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              בדוק עקביות
            </Button>
            
            {report && report.inconsistent_users > 0 && (
              <Button 
                onClick={fixAllIssues}
                disabled={isFixing}
                variant="default"
              >
                {isFixing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                תקן את כל הבעיות
              </Button>
            )}
          </div>

          {message && (
            <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
              {message.type === 'error' ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {report && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-center">{report.total_users}</div>
                    <div className="text-sm text-gray-600 text-center">סה״כ משתמשים</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-center text-green-600">
                      {report.consistent_users}
                    </div>
                    <div className="text-sm text-gray-600 text-center">משתמשים עקביים</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-center text-red-600">
                      {report.inconsistent_users}
                    </div>
                    <div className="text-sm text-gray-600 text-center">בעיות נמצאו</div>
                  </CardContent>
                </Card>
              </div>

              {report.issues.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">בעיות שנמצאו:</h3>
                  <div className="space-y-2">
                    {report.issues.map((issue, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{issue.display_name}</div>
                            <div className="text-sm text-gray-600">{issue.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm">
                              פרופיל: <span className="font-mono">{issue.profile_role || 'ללא'}</span>
                            </div>
                            <div className="text-sm">
                              תפקיד: <span className="font-mono">{issue.user_role || 'ללא'}</span>
                            </div>
                            {getIssueTypeBadge(issue.issue_type)}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}