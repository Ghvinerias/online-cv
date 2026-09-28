const logoSlugs: Record<string, string> = {
  Linux: 'linux',
  Windows: 'microsoft',
  Kubernetes: 'kubernetes',
  Jenkins: 'jenkins',
  Ansible: 'ansible',
  Proxmox: 'proxmox',
  ESXi: 'vmware',
  Terraform: 'terraform',
  Docker: 'docker',
  Zabbix: 'grafana',
  Prometheus: 'prometheus',
  Grafana: 'grafana',
  'Bitwarden Secrets Manager': 'bitwarden',
  'GitHub Actions': 'githubactions',
  GCP: 'googlecloud',
  AWS: 'amazonaws',
  Cloudflare: 'cloudflare',
  Tailscale: 'tailscale',
  WireGuard: 'wireguard',
};

export function toolLogo(name: string) {
  const slug = logoSlugs[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`;
}
