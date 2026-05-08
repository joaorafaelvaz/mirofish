#!/bin/bash
# Script de deploy para Docker na VPS

set -e

echo "=== Deploy MiroFish com Docker ==="

VPS_HOST="${1:-seu-servidor}"
VPS_USER="${2:-barbearia}"
SSH_PORT="${3:-22}"

# Construir imagem localmente
echo "Construindo imagem Docker..."
cd mirofish
docker build -t mirofish:latest .
docker tag mirofish:latest mirofish:$(date +%Y%m%d)

# Transferir imagem para VPS
echo "Transferindo imagem para VPS..."
docker save mirofish:latest | ssh -p $SSH_PORT $VPS_USER@$VPS_HOST "docker load"

# Parar container antigo
echo "Parando container antigo..."
ssh -p $SSH_PORT $VPS_USER@$VPS_HOST "docker stop mirofish 2>/dev/null || true"
ssh -p $SSH_PORT $VPS_USER@$VPS_HOST "docker rm mirofish 2>/dev/null || true"

# Executar novo container
echo "Iniciando novo container..."
ssh -p $SSH_PORT $VPS_USER@$VPS_HOST <<'SSH'
docker run -d \
  --name mirofish \
  -p 8000:8000 \
  --env-file /opt/mirofish/.env \
  --restart unless-stopped \
  --health-cmd "curl -f http://localhost:8000/health" \
  --health-interval 30s \
  --health-timeout 10s \
  --health-retries 3 \
  mirofish:latest
SSH

# Verificar deploy
echo "Verificando deploy..."
sleep 5
curl -f http://$VPS_HOST:8000/health || echo "Health check failed"

echo "=== Deploy concluído ==="
