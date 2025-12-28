import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Server,
  ShieldAlert,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import api, { Report, ReportDetails } from '@/lib/api';
import { toast } from 'sonner';

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportDetails | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    const result = await api.getReports();
    if (result.success && result.data) {
      setReports(result.data);
    }
    setIsLoading(false);
  };

  const viewReport = async (id: string) => {
    const result = await api.getReport(id);
    if (result.success && result.data) {
      setSelectedReport(result.data);
      setIsViewOpen(true);
    } else {
      toast.error('Failed to load report details');
    }
  };

  const downloadReport = async (id: string) => {
    const blob = await api.downloadReport(id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-report-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } else {
      toast.error('Failed to download report');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Scan Reports</h1>
          <p className="text-muted-foreground">
            View and download historical scan reports
          </p>
        </div>
        <Button variant="outline" onClick={loadReports} disabled={isLoading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Report History
          </CardTitle>
          <CardDescription>
            {reports.length} reports available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Scan ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Vulnerabilities</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <FileText className="w-8 h-8 animate-pulse text-primary mx-auto" />
                    <p className="mt-2 text-muted-foreground">Loading reports...</p>
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No reports available. Run a scan to generate reports.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(report.timestamp).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {report.scan_id.substring(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {report.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Server className="w-4 h-4 text-muted-foreground" />
                        {report.devices_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ShieldAlert className={cn(
                          'w-4 h-4',
                          report.vulnerabilities_count > 0 ? 'text-destructive' : 'text-success'
                        )} />
                        {report.vulnerabilities_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewReport(report.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadReport(report.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scan Report Details</DialogTitle>
            <DialogDescription>
              {selectedReport && new Date(selectedReport.timestamp).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Total Devices</p>
                  <p className="text-2xl font-bold">{selectedReport.summary.total_devices}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Vulnerable</p>
                  <p className="text-2xl font-bold text-destructive">
                    {selectedReport.summary.vulnerable_devices}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-severity-critical">
                    {selectedReport.summary.critical_count}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Total CVEs</p>
                  <p className="text-2xl font-bold">{selectedReport.summary.total_vulnerabilities}</p>
                </Card>
              </div>

              {/* Content Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Report Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto max-h-60">
                    {selectedReport.content || JSON.stringify(selectedReport.summary, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
