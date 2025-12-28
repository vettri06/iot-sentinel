import { Shield, Github, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function About() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">About</h1>
          <p className="text-muted-foreground">
            IoT Security Scanner - Network vulnerability analysis tool
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 cyber-glow-sm">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle>IoT Security Scanner</CardTitle>
                <CardDescription>Network Device Discovery & Vulnerability Analysis</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A comprehensive security scanning tool designed to discover IoT devices on your 
              network and identify potential security vulnerabilities. Features AI-powered 
              device classification and anomaly detection.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Python Backend</Badge>
              <Badge variant="outline">React Dashboard</Badge>
              <Badge variant="outline">Nmap Integration</Badge>
              <Badge variant="outline">AI Classification</Badge>
              <Badge variant="outline">CVE Detection</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span><strong>Network Discovery:</strong> Automatically discover all devices on your local network using ARP and ICMP scans</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span><strong>Port Scanning:</strong> Deep port scanning with service detection using Nmap</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span><strong>Vulnerability Detection:</strong> Identify CVEs associated with detected services</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span><strong>AI Classification:</strong> Machine learning-powered device type identification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span><strong>Anomaly Detection:</strong> Detect unusual network behavior and potential threats</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <span><strong>Real-time Monitoring:</strong> Live scan progress and log streaming</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Backend</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Python 3.x</li>
                  <li>• Flask</li>
                  <li>• Nmap</li>
                  <li>• Scikit-learn</li>
                  <li>• Scapy</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Frontend</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• React</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• Shadcn/ui</li>
                  <li>• Vite</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>System Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                <span>Nmap installed and accessible in PATH</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                <span>Python 3.8 or higher</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                <span>Root/Administrator privileges for raw socket access</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                <span>Network access to target devices</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Disclaimer:</strong> This tool is intended for authorized security testing only. 
            Always obtain proper authorization before scanning networks you do not own.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
