import { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Pause,
  Play,
  Trash2,
  Download,
  Filter,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import api, { LogEntry } from '@/lib/api';

const levelIcons = {
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: AlertCircle,
  DEBUG: Bug,
};

const levelColors = {
  INFO: 'text-info',
  WARNING: 'text-warning',
  ERROR: 'text-destructive',
  DEBUG: 'text-muted-foreground',
};

export default function LiveLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    loadLogs();
    
    const interval = setInterval(() => {
      if (!isPaused) {
        loadLogs();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused, levelFilter]);

  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const loadLogs = async () => {
    const level = levelFilter === 'all' ? undefined : levelFilter;
    const result = await api.getLogs(level);
    if (result.success && result.data) {
      setLogs(result.data);
    }
    setIsLoading(false);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const content = logs
      .map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scanner-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      shouldAutoScroll.current = scrollTop + clientHeight >= scrollHeight - 50;
    }
  };

  const filteredLogs = logs.filter(
    (log) => levelFilter === 'all' || log.level === levelFilter
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Live Logs</h1>
          <p className="text-muted-foreground">
            Real-time scanner activity and events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="DEBUG">Debug</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={clearLogs}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={downloadLogs}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="terminal overflow-hidden">
        <CardHeader className="py-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-terminal-text">
              <Terminal className="w-4 h-4" />
              Scanner Output
            </CardTitle>
            <div className="flex items-center gap-2">
              {!isPaused && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              )}
              <Badge variant="outline" className="text-xs">
                {filteredLogs.length} entries
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="h-[600px] overflow-y-auto p-4 scrollbar-thin font-mono text-sm"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Terminal className="w-8 h-8 animate-pulse text-primary" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Terminal className="w-12 h-12 mb-2 opacity-50" />
                <p>No log entries</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log, index) => {
                  const Icon = levelIcons[log.level] || Info;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-2 py-1 animate-fade-in hover:bg-muted/10 rounded px-1"
                    >
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', levelColors[log.level])} />
                      <Badge
                        variant="outline"
                        className={cn('text-xs flex-shrink-0', levelColors[log.level])}
                      >
                        {log.level}
                      </Badge>
                      <span className="text-foreground/90 break-all">{log.message}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
