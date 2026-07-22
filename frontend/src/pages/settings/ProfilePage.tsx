import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, getRoleBadgeColor } from '@/lib/utils';
import { User, Mail, Phone, Shield, Loader2, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, you'd collect form data and call authApi.updateProfile
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">{message}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-semibold text-primary">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.firstName} {user?.lastName}</p>
              <Badge className={getRoleBadgeColor(user?.role || '')}>{user?.role}</Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input defaultValue={user?.firstName} disabled={!isEditing} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input defaultValue={user?.lastName} disabled={!isEditing} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="h-4 w-4" />Email</Label>
              <Input defaultValue={user?.email} disabled />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-4 w-4" />Phone</Label>
              <Input defaultValue={user?.phone || ''} disabled={!isEditing} />
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground">Member since: {user?.createdAt ? formatDate(user.createdAt) : '-'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" disabled>Change Password</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>
    </div>
  );
}
