#!/bin/bash
# Script de setup inicial para VPS
# Execute como root ou com sudo

set -e

echo "=== Setup BarbeariaSuite VPS ==="

# Configurar usuário
if ! id "barbearia" &>/dev/null; then
    useradd -m -s /bin/bash barbearia
    passwd barbearia
fi

# Instalar dependências do sistema
echo "Instalando dependências do sistema..."
apt-get update
apt-get install -y \
    curl \
    gnupg \
    make \
    gcc \
    g++ \
    build-essential \
    python3 \
    git

# Instalar Node.js
echo "Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Instalar MySQL (se não estiver instalado)
if ! command -v mysql &>/dev/null; then
    echo "Instalando MySQL..."
    debconf-set-selections <<< "mysql-server mysql-server/root_password password ''"
    debconf-set-selections <<< "mysql-server mysql-server/root_password_again password ''"
    apt-get install -y mysql-server
    mysql_secure_installation --unit-test
fi

# Criar banco de dados
echo "Criando banco de dados..."
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS barbeariasuite;
CREATE USER IF NOT EXISTS 'barbearia_user'@'localhost' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON barbeariasuite.* TO 'barbearia_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Copiar arquivos
echo "Copiando arquivos..."
cp -r /tmp/barbeariasuite /var/www/
chown -R barbearia:barbearia /var/www/barbeariasuite

# Instalar dependências npm
echo "Instalando dependências npm..."
cd /var/www/barbeariasuite
su barbearia -s /bin/bash -c "npm ci --omit=dev"

# Gerar Prisma Client
su barbearia -s /bin/bash -c "npx prisma generate"

# Executar migrations
su barbearia -s /bin/bash -c "npx prisma migrate deploy"

# Configurar serviço systemd
echo "Configurando serviço systemd..."
cp /tmp/barbeariasuite.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable barbeariasuite

# Configurar Nginx (se instalado)
if command -v nginx &>/dev/null; then
    echo "Configurando Nginx..."
    cat > /etc/nginx/sites-available/barbeariasuite <<'NGINX'
upstream barbeariasuite {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    listen [::]:80;
    server_name barbearia.franquiabv.xyz;

    location / {
        proxy_pass http://barbeariasuite;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

    ln -sf /etc/nginx/sites-available/barbeariasuite /etc/nginx/sites-enabled/
    nginx -t
    systemctl reload nginx
fi

# Configurar firewall (ufw)
if command -v ufw &>/dev/null; then
    echo "Configurando firewall..."
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
    ufw --force enable
fi

echo "=== Setup concluído ==="
echo "Inicie o serviço com: systemctl start barbeariasuite"
echo "Verifique o status com: systemctl status barbeariasuite"
