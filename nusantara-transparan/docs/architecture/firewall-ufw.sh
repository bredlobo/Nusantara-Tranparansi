#!/usr/bin/env bash
# =============================================================================
# NUSANTARA TRANSPARAN — NETWORK FIREWALL HARDENING (UFW / IPTABLES)
# Tujuan:
# Mengunci seluruh port internal (PostgreSQL 5432, Hyperledger Fabric 7050/7051/9051,
# AI Engine 5000, dan Go Backend 8080) agar HANYA bisa diakses dari localhost (127.0.0.1)
# dan memblokir akses langsung dari internet luar.
# =============================================================================

set -e

echo "🔒 Mengatur Kebijakan Default Firewall (Deny Incoming, Allow Outgoing)..."
ufw default deny incoming
ufw default allow outgoing

echo "✅ Mengizinkan Port Publik Resmi (HTTPS 443, HTTP 80, SSH Terbatas)..."
ufw allow 443/tcp comment 'HTTPS Public Web & Reverse Proxy'
ufw allow 80/tcp comment 'HTTP Redirect to HTTPS'
ufw limit 22/tcp comment 'SSH dengan Rate Limit Anti-Brute Force'

echo "🛡️ Mengunci Port Internal Database, Blockchain, & AI (DILARANG Diakses dari Internet Luar)..."
# Port 5432: PostgreSQL Database
ufw deny in on eth0 to any port 5432 proto tcp comment 'Block External PostgreSQL 5432'
# Port 7050, 7051, 9051: Hyperledger Fabric Orderer & Peer Nodes
ufw deny in on eth0 to any port 7050 proto tcp comment 'Block External Fabric Orderer'
ufw deny in on eth0 to any port 7051 proto tcp comment 'Block External Fabric Kemenkeu Peer'
ufw deny in on eth0 to any port 9051 proto tcp comment 'Block External Fabric BPK Peer'
# Port 5000: Internal AI Engine Service
ufw deny in on eth0 to any port 5000 proto tcp comment 'Block External AI Engine'
# Port 8080: Go Backend (Hanya boleh diakses melalui Reverse Proxy Nginx di localhost)
ufw deny in on eth0 to any port 8080 proto tcp comment 'Block Direct External Access to Go API'

# Izinkan komunikasi antar-layanan di dalam loopback (127.0.0.1)
ufw allow in on lo

echo "🚀 Mengaktifkan Firewall Nusantara Transparan..."
ufw --force enable
ufw status verbose
