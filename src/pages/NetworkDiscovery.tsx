import { useState, useEffect } from 'react';
import {
  Radar,
  Play,
  Square,
  Wifi,
  Server,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import api, { NetworkInterface, ScanStatus, Device } from '@/lib/api';
import { toast } from 'sonner';

export default function NetworkDiscovery() {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string>('');
  const [scanMode, setScanMode] = useState<'quick' | 'deep' | 'comprehensive'>('quick');
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scanStatus?.is_scanning) {
      interval = setInterval(checkScanStatus, 2000);
    }
    return () => clearInterval(interval);
  }, [scanStatus?.is_scanning]);

  const loadData = async () => {
    setIsLoading(true);
    const [interfacesRes, statusRes] = await Promise.all([
      api.getInterfaces(),
      api.getScanStatus(),
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

    setIsLoading(false);
  };

  const checkScanStatus = async () => {
    const statusRes = await api.getScanStatus();
    if (statusRes.success && statusRes.data) {
      setScanStatus(statusRes.data);

      if (!statusRes.data.is_scanning) {
        toast.success('Scan completed!');
        const devicesRes = await api.getDevices();
        if (devicesRes.success && devicesRes.data) {
          setDiscoveredDevices(devicesRes.data);
        }
      }
    }
  };

  const startScan = async () => {
    const result = await api.startScan({
      interface: selectedInterface,
      mode: scanMode,
    });

    if (result.success) {
      toast.success(`Started ${scanMode} scan on ${selectedInterface}`);
      setDiscoveredDevices([]);
      checkScanStatus();
    } else {
      toast.error(result.error || 'Failed to start scan');
    }
  };

  const stopScan = async () => {
    const result = await api.stopScan();
    if (result.success) {
      toast.info('Scan stopped');
      setScanStatus((prev) => (prev ? { ...prev, is_scanning: false } : null));
    }
  };

  const selectedIface = interfaces.find((i) => i.name === selectedInterface);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Network Discovery</h1>
          <p className="text-muted-foreground">
            Scan your network to discover connected devices
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={isLoading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scan Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="w-5 h-5 text-primary" />
              Scan Configuration
            </CardTitle>
            <CardDescription>
              Select interface and scan mode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Interface Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Network Interface</label>
              <Select value={selectedInterface} onValueChange={setSelectedInterface}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interface" />
                </SelectTrigger>
                <SelectContent>
                  {interfaces.map((iface) => (
                    <SelectItem key={iface.name} value={iface.name}>
                      <div className="flex items-center gap-2">
                        <Wifi className={cn('w-4 h-4', iface.is_up ? 'text-success' : 'text-muted-foreground')} />
                        {iface.name} - {iface.ip}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedIface && (
                <div className="text-xs text-muted-foreground mt-1">
                  Netmask: {selectedIface.netmask}
                  {selectedIface.mac && ` • MAC: ${selectedIface.mac}`}
                </div>
              )}
            </div>

            {/* Scan Mode */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Scan Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['quick', 'deep', 'comprehensive'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={scanMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setScanMode(mode)}
                    className={cn('capitalize', scanMode === mode && 'cyber-glow-sm')}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {scanMode === 'quick' && 'Fast scan of common ports (1-1000)'}
                {scanMode === 'deep' && 'Extended port range with service detection'}
                {scanMode === 'comprehensive' && 'Full scan with vulnerability checking'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {scanStatus?.is_scanning ? (
                <Button
                  variant="destructive"
                  onClick={stopScan}
                  className="flex-1"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop Scan
                </Button>
              ) : (
                <Button
                  onClick={startScan}
                  disabled={!selectedInterface}
                  className="flex-1 bg-primary text-primary-foreground"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Scan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scan Progress */}
        <Card className={cn(scanStatus?.is_scanning && 'cyber-border cyber-glow-sm')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              Discovery Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanStatus?.is_scanning ? (
              <>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    {scanStatus.current_phase}
                  </Badge>
                  <span className="text-sm font-medium">
                    {Math.round(scanStatus.progress)}%
                  </span>
                </div>
                <Progress value={scanStatus.progress} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Devices found: {scanStatus.devices_found}</span>
                  {scanStatus.estimated_time_remaining && (
                    <span>~{Math.ceil(scanStatus.estimated_time_remaining / 60)}m remaining</span>
                  )}
                </div>
                {/* Pulsing animation */}
                <div className="flex justify-center pt-4">
                  <div className="relative">
                    <Radar className="w-16 h-16 text-primary animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-2 border-primary/30 animate-ping" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Radar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Ready to scan</p>
                <p className="text-xs mt-1">
                  {discoveredDevices.length > 0
                    ? `Last scan found ${discoveredDevices.length} devices`
                    : 'No previous scan results'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Discovered Devices Preview */}
      {discoveredDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Discovered Devices</CardTitle>
            <CardDescription>
              {discoveredDevices.length} devices found in last scan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {discoveredDevices.slice(0, 6).map((device) => (
                <div
                  key={device.ip}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-fade-in"
                >
                  <Server className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate">{device.ip}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {device.vendor || device.device_type || 'Unknown'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs capitalize',
                      device.risk_level === 'critical' && 'border-severity-critical text-severity-critical',
                      device.risk_level === 'high' && 'border-severity-high text-severity-high',
                      device.risk_level === 'medium' && 'border-severity-medium text-severity-medium',
                      device.risk_level === 'low' && 'border-severity-low text-severity-low'
                    )}
                  >
                    {device.risk_level}
                  </Badge>
                </div>
              ))}
            </div>
            {discoveredDevices.length > 6 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                +{discoveredDevices.length - 6} more devices
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
