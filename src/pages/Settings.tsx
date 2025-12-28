import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Lock,
  Wifi,
  Sliders,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api, { Settings as SettingsType, NetworkInterface } from '@/lib/api';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Password change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [settingsRes, interfacesRes] = await Promise.all([
      api.getSettings(),
      api.getInterfaces(),
    ]);

    if (settingsRes.success && settingsRes.data) {
      setSettings(settingsRes.data);
    }

    if (interfacesRes.success && interfacesRes.data) {
      setInterfaces(interfacesRes.data);
    }

    setIsLoading(false);
  };

  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    const result = await api.updateSettings(settings);
    if (result.success) {
      toast.success('Settings saved');
    } else {
      toast.error(result.error || 'Failed to save settings');
    }
    setIsSaving(false);
  };

  const changePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast.error('Please fill in both password fields');
      return;
    }

    const result = await api.updatePassword(oldPassword, newPassword);
    if (result.success && result.data?.updated) {
      toast.success('Password updated');
      setOldPassword('');
      setNewPassword('');
    } else {
      toast.error(result.error || 'Failed to update password');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure scanner preferences and security settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your dashboard access password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={changePassword} className="w-full">
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Default Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-primary" />
              Network Settings
            </CardTitle>
            <CardDescription>
              Configure default network interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Interface</Label>
              <Select
                value={settings?.default_interface || ''}
                onValueChange={(value) =>
                  setSettings((prev) => prev ? { ...prev, default_interface: value } : null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interface" />
                </SelectTrigger>
                <SelectContent>
                  {interfaces.map((iface) => (
                    <SelectItem key={iface.name} value={iface.name}>
                      {iface.name} ({iface.ip})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Scan Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Scan Configuration
            </CardTitle>
            <CardDescription>
              Default settings for network scans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Default Scan Mode</Label>
                <Select
                  value={settings?.default_scan_mode || 'quick'}
                  onValueChange={(value: 'quick' | 'deep' | 'comprehensive') =>
                    setSettings((prev) => prev ? { ...prev, default_scan_mode: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Quick Scan</SelectItem>
                    <SelectItem value="deep">Deep Scan</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Port Range</Label>
                <Input
                  value={settings?.default_port_range || '1-1000'}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, default_port_range: e.target.value } : null)
                  }
                  placeholder="1-1000"
                />
              </div>

              <div className="space-y-2">
                <Label>Max Threads</Label>
                <Input
                  type="number"
                  value={settings?.max_threads || 10}
                  onChange={(e) =>
                    setSettings((prev) => prev ? { ...prev, max_threads: parseInt(e.target.value) || 10 } : null)
                  }
                  min={1}
                  max={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Log Level</Label>
                <Select
                  value={settings?.log_level || 'INFO'}
                  onValueChange={(value: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR') =>
                    setSettings((prev) => prev ? { ...prev, log_level: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBUG">Debug</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg md:col-span-2">
                <div>
                  <Label>Save Reports Automatically</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save scan reports to disk
                  </p>
                </div>
                <Switch
                  checked={settings?.save_reports ?? true}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => prev ? { ...prev, save_reports: checked } : null)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
