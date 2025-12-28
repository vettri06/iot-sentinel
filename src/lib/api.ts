// API Configuration and Service for IoT Security Scanner

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private password: string | null = null;

  constructor() {
    this.password = localStorage.getItem('scanner_password');
  }

  setPassword(password: string) {
    this.password = password;
    localStorage.setItem('scanner_password', password);
  }

  clearPassword() {
    this.password = null;
    localStorage.removeItem('scanner_password');
  }

  getPassword(): string | null {
    return this.password;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(this.password && { 'X-Auth-Password': this.password }),
        ...options.headers,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Request failed' };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication
  async authenticate(password: string): Promise<ApiResponse<{ valid: boolean }>> {
    const result = await this.request<{ valid: boolean }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    
    if (result.success && result.data?.valid) {
      this.setPassword(password);
    }
    
    return result;
  }

  // Network Interfaces
  async getInterfaces(): Promise<ApiResponse<NetworkInterface[]>> {
    return this.request<NetworkInterface[]>('/api/interfaces');
  }

  // Scan Operations
  async startScan(params: ScanParams): Promise<ApiResponse<{ scan_id: string }>> {
    return this.request<{ scan_id: string }>('/api/scan/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getScanStatus(): Promise<ApiResponse<ScanStatus>> {
    return this.request<ScanStatus>('/api/scan/status');
  }

  async getScanResults(): Promise<ApiResponse<ScanResults>> {
    return this.request<ScanResults>('/api/scan/results');
  }

  async stopScan(): Promise<ApiResponse<{ stopped: boolean }>> {
    return this.request<{ stopped: boolean }>('/api/scan/stop', {
      method: 'POST',
    });
  }

  // Devices
  async getDevices(): Promise<ApiResponse<Device[]>> {
    return this.request<Device[]>('/api/devices');
  }

  async getDevice(ip: string): Promise<ApiResponse<DeviceDetails>> {
    return this.request<DeviceDetails>(`/api/devices/${encodeURIComponent(ip)}`);
  }

  // Vulnerabilities
  async getVulnerabilities(): Promise<ApiResponse<Vulnerability[]>> {
    return this.request<Vulnerability[]>('/api/vulnerabilities');
  }

  // Reports
  async getReports(): Promise<ApiResponse<Report[]>> {
    return this.request<Report[]>('/api/reports');
  }

  async getReport(id: string): Promise<ApiResponse<ReportDetails>> {
    return this.request<ReportDetails>(`/api/reports/${encodeURIComponent(id)}`);
  }

  async downloadReport(id: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/${id}/download`, {
        headers: {
          ...(this.password && { 'X-Auth-Password': this.password }),
        },
      });
      
      if (!response.ok) return null;
      return await response.blob();
    } catch {
      return null;
    }
  }

  // Logs
  async getLogs(level?: string): Promise<ApiResponse<LogEntry[]>> {
    const query = level ? `?level=${level}` : '';
    return this.request<LogEntry[]>(`/api/logs${query}`);
  }

  // AI Status
  async getAiStatus(): Promise<ApiResponse<AiStatus>> {
    return this.request<AiStatus>('/api/ai/status');
  }

  // Settings
  async updatePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<{ updated: boolean }>> {
    return this.request<{ updated: boolean }>('/api/settings/password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  }

  async getSettings(): Promise<ApiResponse<Settings>> {
    return this.request<Settings>('/api/settings');
  }

  async updateSettings(settings: Partial<Settings>): Promise<ApiResponse<Settings>> {
    return this.request<Settings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

// Types
export interface NetworkInterface {
  name: string;
  ip: string;
  netmask: string;
  mac?: string;
  is_up: boolean;
}

export interface ScanParams {
  interface?: string;
  mode?: 'quick' | 'deep' | 'comprehensive';
  port_range?: string;
  target?: string;
}

export interface ScanStatus {
  is_scanning: boolean;
  progress: number;
  current_phase: string;
  devices_found: number;
  start_time?: string;
  estimated_time_remaining?: number;
}

export interface ScanResults {
  scan_id: string;
  timestamp: string;
  duration: number;
  devices: Device[];
  vulnerabilities: Vulnerability[];
  summary: ScanSummary;
}

export interface ScanSummary {
  total_devices: number;
  vulnerable_devices: number;
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
}

export interface Device {
  ip: string;
  mac: string;
  hostname?: string;
  vendor?: string;
  device_type?: string;
  os?: string;
  open_ports: PortInfo[];
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'info';
  vulnerabilities_count: number;
  last_seen: string;
  is_anomaly?: boolean;
  ai_classification?: AiClassification;
}

export interface DeviceDetails extends Device {
  services: ServiceInfo[];
  vulnerabilities: Vulnerability[];
  scan_history: ScanHistoryEntry[];
  anomaly_details?: AnomalyDetails;
}

export interface PortInfo {
  port: number;
  protocol: string;
  state: string;
  service?: string;
  version?: string;
}

export interface ServiceInfo {
  name: string;
  port: number;
  protocol: string;
  version?: string;
  product?: string;
  extra_info?: string;
}

export interface Vulnerability {
  cve_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss_score: number;
  affected_service: string;
  affected_port: number;
  device_ip: string;
  references: string[];
  confidence: number;
  published_date?: string;
  solution?: string;
}

export interface AiClassification {
  device_type: string;
  confidence: number;
  manufacturer?: string;
  model?: string;
}

export interface AnomalyDetails {
  is_anomaly: boolean;
  anomaly_score: number;
  anomaly_type?: string;
  details: string;
}

export interface ScanHistoryEntry {
  scan_id: string;
  timestamp: string;
  ports_open: number;
  vulnerabilities_found: number;
}

export interface Report {
  id: string;
  timestamp: string;
  scan_id: string;
  devices_count: number;
  vulnerabilities_count: number;
  type: 'full' | 'summary' | 'executive';
}

export interface ReportDetails extends Report {
  content: string;
  summary: ScanSummary;
  devices: Device[];
  vulnerabilities: Vulnerability[];
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  source?: string;
}

export interface AiStatus {
  model_loaded: boolean;
  model_version?: string;
  last_training?: string;
  devices_classified: number;
  anomalies_detected: number;
}

export interface Settings {
  default_interface?: string;
  default_scan_mode: 'quick' | 'deep' | 'comprehensive';
  default_port_range: string;
  auto_scan_interval?: number;
  log_level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  max_threads: number;
  save_reports: boolean;
}

export const api = new ApiService();
export default api;
