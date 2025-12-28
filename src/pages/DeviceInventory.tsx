import { useState, useEffect } from 'react';
import {
  Server,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  AlertTriangle,
  CheckCircle,
  Wifi,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import api, { Device, DeviceDetails } from '@/lib/api';
import { toast } from 'sonner';

const riskColors = {
  critical: 'bg-severity-critical text-white',
  high: 'bg-severity-high text-white',
  medium: 'bg-severity-medium text-white',
  low: 'bg-severity-low text-white',
  info: 'bg-severity-info text-white',
};

function DeviceRow({ device, onExpand }: { device: Device; onExpand: (ip: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [details, setDetails] = useState<DeviceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExpand = async () => {
    if (!isExpanded && !details) {
      setIsLoading(true);
      const result = await api.getDevice(device.ip);
      if (result.success && result.data) {
        setDetails(result.data);
      }
      setIsLoading(false);
    }
    setIsExpanded(!isExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={handleExpand}>
      <TableRow className={cn('cursor-pointer hover:bg-muted/50', isExpanded && 'bg-muted/30')}>
        <TableCell>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="w-6 h-6">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{device.ip}</span>
            <Button variant="ghost" size="icon" className="w-5 h-5" onClick={(e) => { e.stopPropagation(); copyToClipboard(device.ip); }}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">{device.mac}</TableCell>
        <TableCell>{device.vendor || <span className="text-muted-foreground">Unknown</span>}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-muted-foreground" />
            {device.device_type || 'Unknown'}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {device.open_ports.slice(0, 3).map((port) => (
              <Badge key={port.port} variant="outline" className="text-xs">
                {port.port}/{port.protocol}
              </Badge>
            ))}
            {device.open_ports.length > 3 && (
              <Badge variant="outline" className="text-xs">+{device.open_ports.length - 3}</Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge className={cn('capitalize', riskColors[device.risk_level])}>
            {device.risk_level}
          </Badge>
        </TableCell>
        <TableCell>
          {device.vulnerabilities_count > 0 ? (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              {device.vulnerabilities_count}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-success">
              <CheckCircle className="w-4 h-4" />
              Clean
            </div>
          )}
        </TableCell>
      </TableRow>

      <CollapsibleContent asChild>
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/20 p-0">
            <div className="p-4 space-y-4 animate-fade-in">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Wifi className="w-6 h-6 animate-pulse text-primary" />
                </div>
              ) : details ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Device Info */}
                  <Card className="bg-card/50">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Device Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hostname</span>
                        <span>{details.hostname || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">OS</span>
                        <span>{details.os || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Seen</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(details.last_seen).toLocaleString()}
                        </span>
                      </div>
                      {details.ai_classification && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">AI Type</span>
                            <span>{details.ai_classification.device_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Confidence</span>
                            <span>{(details.ai_classification.confidence * 100).toFixed(1)}%</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Services */}
                  <Card className="bg-card/50">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Open Ports & Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                        {details.services.map((svc, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <Badge variant="outline">{svc.port}/{svc.protocol}</Badge>
                            <span className="text-muted-foreground">
                              {svc.name} {svc.version && `(${svc.version})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vulnerabilities */}
                  {details.vulnerabilities.length > 0 && (
                    <Card className="bg-card/50 md:col-span-2">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          Vulnerabilities ({details.vulnerabilities.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                          {details.vulnerabilities.map((vuln) => (
                            <div key={vuln.cve_id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                              <div className="flex items-center gap-2">
                                <Badge className={cn('capitalize', riskColors[vuln.severity])}>
                                  {vuln.severity}
                                </Badge>
                                <span className="font-mono text-sm">{vuln.cve_id}</span>
                              </div>
                              <a
                                href={`https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No details available</p>
              )}
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function DeviceInventory() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    const result = await api.getDevices();
    if (result.success && result.data) {
      setDevices(result.data);
    }
    setIsLoading(false);
  };

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.ip.includes(searchTerm) ||
      device.mac.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.device_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = riskFilter === 'all' || device.risk_level === riskFilter;
    
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Device Inventory</h1>
          <p className="text-muted-foreground">
            {devices.length} devices discovered on your network
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by IP, MAC, vendor, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Device Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Open Ports</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Vulnerabilities</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Wifi className="w-8 h-8 animate-pulse text-primary mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading devices...</p>
                </TableCell>
              </TableRow>
            ) : filteredDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {devices.length === 0
                    ? 'No devices discovered yet. Run a scan to discover devices.'
                    : 'No devices match your search criteria.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices.map((device) => (
                <DeviceRow key={device.ip} device={device} onExpand={() => {}} />
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
