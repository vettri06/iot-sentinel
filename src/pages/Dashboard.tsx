import { useState, useEffect } from 'react';
import {
  Shield,
  Server,
  AlertTriangle,
  Activity,
  Wifi,
  Play,
  RefreshCw,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import api, { ScanStatus, ScanSummary, NetworkInterface } from '@/lib/api';
import { toast } from 'sonner';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
    danger: 'bg-destructive/5 border-destructive/20',
  };

  const iconStyles = {
    default: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-destructive bg-destructive/10',
  };

  return (
    <Card className={cn('transition-all hover:shadow-lg', variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground animate-count-up">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScanProgress({ status }: { status: ScanStatus }) {
  return (
    <Card className="cyber-border cyber-glow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary animate-pulse" />
            Scan in Progress
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {status.current_phase}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(status.progress)}%</span>
          </div>
          <Progress value={status.progress} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Devices Found</p>
            <p className="font-semibold text-lg">{status.devices_found}</p>
          </div>
          {status.estimated_time_remaining && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Est. Remaining</p>
              <p className="font-semibold text-lg flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {Math.ceil(status.estimated_time_remaining / 60)}m
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (scanStatus?.is_scanning) {
        checkScanStatus();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [scanStatus?.is_scanning]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [interfacesRes, statusRes, resultsRes] = await Promise.all([
        api.getInterfaces(),
        api.getScanStatus(),
        api.getScanResults(),
      ]);

      if (interfacesRes.success && interfacesRes.data) {
        setInterfaces(interfacesRes.data);
        if (interfacesRes.data.length > 0 && !selectedInterface) {
          setSelectedInterface(interfacesRes.data[0].name);
        }
      }

      if (statusRes.success && statusRes.data) {
        setScanStatus(statusRes.data);
      }

      if (resultsRes.success && resultsRes.data?.summary) {
        setSummary(resultsRes.data.summary);
      }
    } catch (error) {
      toast.error('Failed to connect to scanner');
    }
    setIsLoading(false);
  };

  const checkScanStatus = async () => {
    const result = await api.getScanStatus();
    if (result.success && result.data) {
      setScanStatus(result.data);
      if (!result.data.is_scanning) {
        toast.success('Scan completed!');
        loadData();
      }
    }
  };

  const startScan = async (mode: 'quick' | 'deep' | 'comprehensive') => {
    const result = await api.startScan({
      interface: selectedInterface,
      mode,
    });

    if (result.success) {
      toast.success(`Started ${mode} scan`);
      checkScanStatus();
    } else {
      toast.error(result.error || 'Failed to start scan');
    }
  };

  const stopScan = async () => {
    const result = await api.stopScan();
    if (result.success) {
      toast.info('Scan stopped');
      setScanStatus(prev => prev ? { ...prev, is_scanning: false } : null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Network security overview and quick actions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Devices"
          value={summary?.total_devices ?? 0}
          icon={Server}
        />
        <StatCard
          title="Vulnerable Devices"
          value={summary?.vulnerable_devices ?? 0}
          icon={Shield}
          variant={summary?.vulnerable_devices ? 'danger' : 'default'}
        />
        <StatCard
          title="Critical Issues"
          value={summary?.critical_count ?? 0}
          icon={AlertTriangle}
          variant={summary?.critical_count ? 'danger' : 'success'}
        />
        <StatCard
          title="Total Vulnerabilities"
          value={summary?.total_vulnerabilities ?? 0}
          icon={Activity}
          variant={summary?.total_vulnerabilities ? 'warning' : 'success'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scan Progress or Start Scan */}
        {scanStatus?.is_scanning ? (
          <ScanProgress status={scanStatus} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-primary" />
                Start New Scan
              </CardTitle>
              <CardDescription>
                Select a network interface and scan mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Interface Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Network Interface</label>
                <div className="flex flex-wrap gap-2">
                  {interfaces.map((iface) => (
                    <Button
                      key={iface.name}
                      variant={selectedInterface === iface.name ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedInterface(iface.name)}
                      className={cn(
                        selectedInterface === iface.name && 'cyber-glow-sm'
                      )}
                    >
                      {iface.name}
                      <span className="ml-2 text-xs opacity-70">{iface.ip}</span>
                    </Button>
                  ))}
                  {interfaces.length === 0 && (
                    <p className="text-sm text-muted-foreground">No interfaces available</p>
                  )}
                </div>
              </div>

              {/* Scan Mode Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => startScan('quick')}
                  variant="outline"
                  className="flex flex-col gap-1 h-auto py-3"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-xs">Quick</span>
                </Button>
                <Button
                  onClick={() => startScan('deep')}
                  variant="outline"
                  className="flex flex-col gap-1 h-auto py-3"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-xs">Deep</span>
                </Button>
                <Button
                  onClick={() => startScan('comprehensive')}
                  className="flex flex-col gap-1 h-auto py-3 bg-primary text-primary-foreground"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-xs">Full</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Severity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Vulnerability Breakdown
            </CardTitle>
            <CardDescription>Issues by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Critical', count: summary?.critical_count ?? 0, color: 'bg-severity-critical' },
                { label: 'High', count: summary?.high_count ?? 0, color: 'bg-severity-high' },
                { label: 'Medium', count: summary?.medium_count ?? 0, color: 'bg-severity-medium' },
                { label: 'Low', count: summary?.low_count ?? 0, color: 'bg-severity-low' },
                { label: 'Info', count: summary?.info_count ?? 0, color: 'bg-severity-info' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full', item.color)} />
                  <span className="flex-1 text-sm">{item.label}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stop Scan Button */}
      {scanStatus?.is_scanning && (
        <div className="flex justify-center">
          <Button variant="destructive" onClick={stopScan}>
            Stop Scan
          </Button>
        </div>
      )}
    </div>
  );
}
