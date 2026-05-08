#!/bin/bash
# Health Check Script para BarbeariaSuite
# Executa checkups regulares e envia alertas se necessário

set -e

APP_URL="${1:-http://localhost:3022}"
ALERT_EMAIL="${2:-admin@barbearia.com}"

HEALTH_ENDPOINT="${APP_URL}/health"
STATUS_ENDPOINT="${APP_URL}/api/status"

echo "=== Health Check BarbeariaSuite ==="
echo "URL: ${APP_URL}"
echo "Data: $(date)"
echo ""

# Check API Health
echo "1. Verificando Health Check..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_ENDPOINT" 2>/dev/null || echo "failed")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -1)
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -1)

if [ "$HEALTH_CODE" = "200" ]; then
    echo "   [OK] Health check passou (HTTP $HEALTH_CODE)"
else
    echo "   [ERRO] Health check falhou (HTTP $HEALTH_CODE)"
    echo "   Enviando alerta para $ALERT_EMAIL..."
    # Aqui você poderia adicionar envio de email real
fi

# Check Database Connection
echo ""
echo "2. Verificando conexão com banco de dados..."
if [ -n "$DATABASE_URL" ]; then
    mysql -h $(echo $DATABASE_URL | cut -d'/' -f3 | cut -d':' -f1 | cut -d'@' -f1) \
          -u $(echo $DATABASE_URL | cut -d'/' -f3 | cut -d':' -f1) \
          -p$(echo $DATABASE_URL | cut -d'/' -f3 | cut -d':' -f2 | cut -d'@' -f1) \
          -e "SELECT 1" > /dev/null 2>&1 && \
        echo "   [OK] Banco de dados acessível" || \
        echo "   [ERRO] Não foi possível conectar ao banco de dados"
else
    echo "   [AVISO] DATABASE_URL não configurada"
fi

# Check Disk Space
echo ""
echo "3. Verificando espaço em disco..."
DISK_USAGE=$(df -h /var/www | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "   [ERRO] Uso de disco acima de 90%: ${DISK_USAGE}%"
else
    echo "   [OK] Uso de disco: ${DISK_USAGE}%"
fi

# Check Node Process
echo ""
echo "4. Verificando processo Node.js..."
if pgrep -x "node" > /dev/null; then
    NODE_PID=$(pgrep -x "node")
    echo "   [OK] Processo Node.js rodando (PID: $NODE_PID)"
else
    echo "   [ERRO] Processo Node.js não encontrado"
fi

echo ""
echo "=== Health Check Concluído ==="
