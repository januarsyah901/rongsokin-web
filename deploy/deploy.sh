#!/usr/bin/env bash
# Deploy Rongsok.in (API + web) ke server ini: /opt/stacks/apps/rongsokin
# (Docker + Caddy + Cloudflare Tunnel, jaringan gateway-net).
# Idempotent: aman dijalankan ulang untuk update. Tidak pernah mencetak rahasia.
#
# Opsi lewat environment:
#   SITE_URL   URL publik (default https://rongsokin.hallojanu.me)
#   API_SRC    folder repo API (default: ../rongsokin-api di sebelah repo web)
#   SKIP_BACKUP=true  lewati pg_dump sebelum deploy (tidak disarankan)
set -euo pipefail

WEB_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STACK=/opt/stacks/apps/rongsokin
CADDYFILE=/opt/stacks/reverse-proxy/Caddyfile
SITE_URL="${SITE_URL:-https://rongsokin.hallojanu.me}"
HOST="${SITE_URL#*://}"
API_SRC="${API_SRC:-$WEB_SRC/../rongsokin-api}"
[ -f "$API_SRC/Dockerfile" ] && [ -f "$API_SRC/go.mod" ] || { echo "Repo API tidak ditemukan. Set API_SRC=/path/ke/rongsokin-api" >&2; exit 1; }
API_SRC="$(cd "$API_SRC" && pwd)"

mkdir -p "$STACK/data/postgres" "$STACK/backup"

# --- .env: rahasia disimpan di server (izin 600) ---
touch "$STACK/.env"; chmod 600 "$STACK/.env"
# Migrasi sekali dari compose lama yang menaruh rahasia langsung di file.
# DB_PASSWORD wajib sama dengan yang sudah dipakai volume Postgres.
if [ -f "$STACK/docker-compose.yml" ] && ! grep -q '\${DB_PASSWORD' "$STACK/docker-compose.yml"; then
  python3 - "$STACK/docker-compose.yml" "$STACK/.env" <<'PY'
import re, sys
compose, envf = open(sys.argv[1]).read(), sys.argv[2]
have = {l.split('=', 1)[0] for l in open(envf) if '=' in l}
found = {}
m = re.search(r'POSTGRES_PASSWORD:\s*(\S+)', compose)
if m: found['DB_PASSWORD'] = m.group(1)
for k in ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
          'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS']:
    m = re.search(r'-\s*' + k + r'=(.*)', compose)
    if m: found[k] = m.group(1).strip()
with open(envf, 'a') as f:
    for k, v in found.items():
        if k not in have: f.write(f'{k}={v}\n')
print('› Rahasia lama dipindah ke .env:', ', '.join(k for k in found if k not in have) or '-')
PY
  cp "$STACK/docker-compose.yml" "$STACK/docker-compose.yml.pre-env.bak"; chmod 600 "$STACK/docker-compose.yml.pre-env.bak"
fi
rand() { head -c 96 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c "$1"; }
ensure_secret() { grep -q "^$1=." "$STACK/.env" || { sed -i "/^$1=/d" "$STACK/.env"; printf '%s=%s\n' "$1" "$(rand "$2")" >> "$STACK/.env"; }; }
ensure_default() { grep -q "^$1=" "$STACK/.env" || printf '%s=%s\n' "$1" "$2" >> "$STACK/.env"; }
ensure_secret DB_PASSWORD 32
ensure_secret JWT_SECRET 64
ensure_secret KYC_ATTESTATION_SECRET 64
ensure_secret SEED_ADMIN_PASSWORD 24
ensure_default GEMINI_API_KEY ""
ensure_default GEMINI_MODEL "gemini-3.8-flash"
( umask 077; grep -vE '^SITE_URL=' "$STACK/.env" > "$STACK/.env.tmp" || true
  printf 'SITE_URL=%s\n' "$SITE_URL" >> "$STACK/.env.tmp" )
mv "$STACK/.env.tmp" "$STACK/.env"; chmod 600 "$STACK/.env"

# --- Backup DB sebelum apa pun diganti ---
if [ "${SKIP_BACKUP:-}" != true ] && docker ps --format '{{.Names}}' | grep -qx rongsokin-db; then
  out="$STACK/backup/rongsok_db-$(date +%Y%m%d-%H%M%S).sql.gz"
  ( umask 077; docker exec rongsokin-db pg_dump -U rongsok_user -d rongsok_db | gzip > "$out" )
  echo "› Backup DB: $out ($(du -h "$out" | cut -f1))"
  ls -1t "$STACK"/backup/rongsok_db-*.sql.gz | tail -n +11 | xargs -r rm -f   # simpan 10 terakhir
fi

echo "› Build image API ($API_SRC)"
docker build -q -f "$API_SRC/Dockerfile" -t ghcr.io/mrfroglab/be-rongsok.in:latest "$API_SRC" >/dev/null
echo "› Build image web ($WEB_SRC)"
docker build -q \
  --build-arg "NEXT_PUBLIC_API_URL=$SITE_URL/api/v1" \
  -t rongsokin-web:latest "$WEB_SRC" >/dev/null

cp "$WEB_SRC/deploy/docker-compose.yml" "$STACK/docker-compose.yml"

# --- Rute Caddy: satu domain; /api/v1 (termasuk WebSocket /api/v1/ws), /api-docs, /health → API, sisanya → web.
#     (/api/ktp-ocr milik Next, jadi API dicocokkan lewat /api/v1, bukan /api/*.)
cp "$CADDYFILE" "$CADDYFILE.bak"
SITE_HOST="$HOST" python3 - "$CADDYFILE" <<'PY'
import os, re, sys
path, host = sys.argv[1], os.environ["SITE_HOST"]
block = f"""# BEGIN rongsokin (dikelola rongsokin-web/deploy/deploy.sh)
http://{host} {{
	encode zstd gzip
	@api path /api/v1/* /api-docs* /health
	handle @api {{
		reverse_proxy rongsokin-api:3000 {{
			header_up X-Forwarded-For {{http.request.header.CF-Connecting-IP}}
		}}
	}}
	handle {{
		reverse_proxy rongsokin-web:3000 {{
			header_up X-Forwarded-For {{http.request.header.CF-Connecting-IP}}
		}}
	}}
}}
# END rongsokin"""
s = open(path).read()
pat = re.compile(r"# BEGIN rongsokin .*?# END rongsokin", re.S)
s = pat.sub(block, s) if pat.search(s) else s.rstrip("\n") + "\n\n" + block + "\n"
with open(path, "r+") as f:   # tulis di tempat: inode tetap (bind mount Caddy)
    f.seek(0); f.write(s); f.truncate()
PY
if ! docker exec caddy-proxy caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
  echo "Caddyfile tidak valid, mengembalikan cadangan." >&2
  cat "$CADDYFILE.bak" > "$CADDYFILE"; exit 1
fi

cd "$STACK"
docker compose up -d --remove-orphans
docker exec caddy-proxy caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1

echo "› Menunggu layanan sehat…"
for _ in $(seq 1 60); do
  s="$(docker inspect -f '{{.State.Health.Status}}' rongsokin-web 2>/dev/null || true)"
  [ "$s" = healthy ] && break; sleep 3
done
docker compose ps --format 'table {{.Name}}\t{{.Status}}'
grep -q '^GEMINI_API_KEY=.' "$STACK/.env" || \
  echo "⚠️  GEMINI_API_KEY kosong di $STACK/.env — verifikasi KTP belum bisa menandai akun terverifikasi."
echo "Selesai: $SITE_URL"
