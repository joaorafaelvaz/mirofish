# Guia de Deploy para VPS

## Pré-requisitos

- Servidor VPS com Ubuntu 22.04/24.04 ou Debian 11+
- Acesso root ou usuário com sudo
- Domínio apontando para o servidor (opcional, mas recomendado)

## Passo 1: Preparar a VPS

### Opção A: Script automático (recomendado)

```bash
# Copy scripts/setup-vps.sh para a VPS e execute:
scp scripts/setup-vps.sh root@seu-servidor:/tmp/
ssh root@seu-servidor "bash /tmp/setup-vps.sh"
```

### Opção B: Configuração manual

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar MySQL
apt install -y mysql-server
mysql_secure_installation

# Criar banco de dados
mysql -u root <<EOF
CREATE DATABASE barbeariasuite;
CREATE USER 'barbearia_user'@'localhost' IDENTIFIED BY 'sua_senha';
GRANT ALL PRIVILEGES ON barbeariasuite.* TO 'barbearia_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Criar usuário da aplicação
useradd -m -s /bin/bash barbearia
passwd barbearia

# Criar diretório da aplicação
mkdir -p /opt/mirofish
chown -R barbearia:barbearia /opt/mirofish
```

## Passo 2: Configurar Secrets do GitHub

No repositório GitHub, vá em Settings > Secrets and variables > Actions e adicione:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | IP ou hostname do servidor |
| `VPS_USER` | Username SSH (ex: barbearia) |
| `VPS_PORT` | Porta SSH (padrão: 22) |
| `VPS_SSH_KEY` | Private key do SSH |
| `NEXT_PUBLIC_APP_URL` | URL da aplicação (ex: https://mirofish.franquiabv.xyz) |

### Gerar chave SSH para deploy

```bash
# Na máquina local
ssh-keygen -t ed25519 -C "deploy@barbearia" -f deploy_key

# Copiar a chave pública para a VPS
ssh-copy-id -i deploy_key.pub barbearia@seu-servidor

# Adicionar a private key no GitHub Secrets
cat deploy_key | gh secret set VPS_SSH_KEY
```

## Passo 3: Configurar MySQL na VPS

```bash
# Na VPS
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS barbeariasuite;
CREATE USER IF NOT EXISTS 'barbearia_user'@'localhost' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON barbeariasuite.* TO 'barbearia_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

## Passo 4: Deploy

### Com GitHub Actions (automático)

1. Commit e push as mudanças para a branch `main`
2. A ação de deploy iniciará automaticamente
3. Acompanhe o progresso em Actions > Deploy to VPS

### Manual (sem GitHub Actions)

```bash
# Build localmente (na máquina local)
cd mirofish
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Criar archive
tar -czf mirofish-deployment.tar.gz \
  --exclude='__pycache__' \
  --exclude='.venv' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='.git' \
  .

# Transferir para VPS
scp mirofish-deployment.tar.gz barbearia@seu-servidor:/tmp/

# Na VPS
ssh barbearia@seu-servidor

# Descompactar e instalar
cd /opt/mirofish
tar -xzf /tmp/mirofish-deployment.tar.gz

# Criar ambiente virtual
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copiar arquivo .env
cp .env.example .env

# Iniciar serviço
systemctl daemon-reload
systemctl start mirofish
```

## Passo 5: Configurar Nginx (reverso proxy)

```bash
# Na VPS
apt install -y nginx

cat > /etc/nginx/sites-available/mirofish <<'EOF'
upstream mirofish {
    server 127.0.0.1:3022;
}

server {
    listen 80;
    server_name mirofish.franquiabv.xyz;

    location / {
        proxy_pass http://mirofish;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/mirofish /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Passo 6: Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado
certbot --nginx -d mirofish.franquiabv.xyz

# Auto-renewal (automático)
systemctl enable certbot.timer
```

## Gerenciamento do Serviço

```bash
# Ver status
systemctl status mirofish

# Log
journalctl -u mirofish -f

# Reiniciar
systemctl restart mirofish

# Parar
systemctl stop mirofish

# Iniciar
systemctl start mirofish

# Habilitar no boot
systemctl enable mirofish
```

## Rollback em caso de problemas

```bash
# Na VPS
/opt/mirofish/scripts/rollback.sh

# Ou manualmente
systemctl stop mirofish
tar -xzf /opt/mirofish/backups/backup-YYYYMMDD-HHMMSS.tar.gz -C /opt/mirofish
systemctl start mirofish
```

## Troubleshooting

### Porta 3022 não responde
```bash
# Verificar se o processo está rodando
ps aux | grep "uvicorn"

# Verificar logs
journalctl -u mirofish -n 50
```

### Erro de conexão MySQL
```bash
# Verificar se MySQL está rodando
systemctl status mysql

# Testar conexão
mysql -u barbearia_user -p barbeariasuite
```

### Permissões
```bash
# Corrigir permissões
chown -R barbearia:barbearia /opt/mirofish
chmod -R 755 /opt/mirofish
```
