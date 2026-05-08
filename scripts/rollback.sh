#!/bin/bash
# Script de rollback para BarbeariaSuite
# Usa o backup mais recente para restaurar a aplicação

set -e

BACKUP_DIR="/var/www/barbeariasuite/backups"
LATEST_BACKUP=$(ls -t $BACKUP_DIR 2>/dev/null | head -1)

echo "=== BarbeariaSuite Rollback ==="

if [ -z "$LATEST_BACKUP" ]; then
    echo "Nenhum backup encontrado em $BACKUP_DIR"
    exit 1
fi

echo "Ultimo backup: $LATEST_BACKUP"

echo "Parando serviço..."
systemctl stop barbeariasuite || true

echo "Restaurando backup..."
rm -rf /var/www/barbeariasuite/current
mv /var/www/barbeariasuite/$LATEST_BACKUP /var/www/barbeariasuite/current

echo "Reiniciando serviço..."
systemctl start barbeariasuite

echo "Verificando status..."
systemctl status barbeariasuite --no-pager

echo "=== Rollback concluído ==="
