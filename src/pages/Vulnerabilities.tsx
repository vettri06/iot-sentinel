import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  ExternalLink,
  AlertTriangle,
  Server,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import api, { Vulnerability } from '@/lib/api';
import { toast } from 'sonner';

const severityColors = {
  critical: 'bg-severity-critical text-white border-severity-critical',
  high: 'bg-severity-high text-white border-severity-high',
  medium: 'bg-severity-medium text-white border-severity-medium',
  low: 'bg-severity-low text-white border-severity-low',
  info: 'bg-severity-info text-white border-severity-info',
};

const severityBorder = {
  critical: 'border-l-severity-critical',
  high: 'border-l-severity-high',
  medium: 'border-l-severity-medium',
  low: 'border-l-severity-low',
  info: 'border-l-severity-info',
};

function VulnerabilityCard({ vuln }: { vuln: Vulnerability }) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Card className={cn('border-l-4 transition-all hover:shadow-lg', severityBorder[vuln.severity])}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn('capitalize', severityColors[vuln.severity])}>
                {vuln.severity}
              </Badge>
              <div className="flex items-center gap-1">
                <span className="font-mono font-semibold">{vuln.cve_id}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5"
                  onClick={() => copyToClipboard(vuln.cve_id)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <Badge variant="outline" className="text-xs">
                CVSS: {vuln.cvss_score.toFixed(1)}
              </Badge>
            </div>
            <a
              href={`https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              NVD <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-foreground">{vuln.title}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">{vuln.description}</p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Server className="w-4 h-4" />
              <span>{vuln.device_ip}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              <span>{vuln.affected_service}:{vuln.affected_port}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">Confidence:</span>
              <Badge variant="outline" className="text-xs">
                {(vuln.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          </div>

          {/* Solution */}
          {vuln.solution && (
            <div className="text-sm p-2 bg-muted/50 rounded">
              <span className="font-medium">Solution:</span> {vuln.solution}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Vulnerabilities() {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    loadVulnerabilities();
  }, []);

  const loadVulnerabilities = async () => {
    setIsLoading(true);
    const result = await api.getVulnerabilities();
    if (result.success && result.data) {
      setVulnerabilities(result.data);
    }
    setIsLoading(false);
  };

  const filteredVulns = vulnerabilities.filter((vuln) => {
    const matchesSearch =
      vuln.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vuln.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vuln.device_ip.includes(searchTerm) ||
      vuln.affected_service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || vuln.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  // Group by severity for summary
  const severityCounts = vulnerabilities.reduce(
    (acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vulnerability Analysis</h1>
          <p className="text-muted-foreground">
            {vulnerabilities.length} vulnerabilities detected across your network
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(['critical', 'high', 'medium', 'low', 'info'] as const).map((severity) => (
          <Card
            key={severity}
            className={cn(
              'cursor-pointer transition-all hover:scale-105',
              severityFilter === severity && 'ring-2 ring-primary'
            )}
            onClick={() => setSeverityFilter(severityFilter === severity ? 'all' : severity)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <span className="capitalize text-sm font-medium">{severity}</span>
              <Badge className={cn(severityColors[severity])}>
                {severityCounts[severity] || 0}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by CVE, title, IP, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vulnerabilities List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center">
              <ShieldAlert className="w-8 h-8 animate-pulse text-primary" />
              <p className="mt-2 text-muted-foreground">Loading vulnerabilities...</p>
            </div>
          </Card>
        ) : filteredVulns.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center">
              <ShieldAlert className="w-12 h-12 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                {vulnerabilities.length === 0
                  ? 'No vulnerabilities found. Your network looks secure!'
                  : 'No vulnerabilities match your search criteria.'}
              </p>
            </div>
          </Card>
        ) : (
          filteredVulns.map((vuln) => (
            <VulnerabilityCard key={`${vuln.cve_id}-${vuln.device_ip}`} vuln={vuln} />
          ))
        )}
      </div>
    </div>
  );
}
