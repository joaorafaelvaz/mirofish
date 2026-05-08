# Scripts de Deploy e Gerenciamento

## Scripts Disponíveis

### `setup-vps.sh`
Script de configuração inicial da VPS. Instala todas as dependências e configura o ambiente.

**Uso:**
```bash
scp scripts/setup-vps.sh root@seu-servidor:/tmp/
ssh root@seu-servidor "bash /tmp/setup-vps.sh"
```

**O que faz:**
- Instala Node.js 20
- Instala MySQL
- Cria banco de dados e usuário
- Configura usuário barbearia
- Copia arquivos para `/var/www/barbeariasuite`
- Instala dependências npm
- Configura serviço systemd
- Configura Nginx (se instalado)
- Configura firewall (ufw)

### `rollback.sh`
Script de rollback para restaurar a aplicação a partir do último backup.

**Uso:**
```bash
# Na VPS
./scripts/rollback.sh
```

### `deploy-docker-vps.sh`
Script de deploy usando Docker. Constrói a imagem localmente e a transfera para a VPS.

**Uso:**
```bash
bash scripts/deploy-docker-vps.sh seu-servidor barbearia 22
```

**Parâmetros:**
- `$1`: Host da VPS (padrão: seu-servidor)
- `$2`: Usuário SSH (padrão: barbearia)
- `$3`: Porta SSH (padrão: 22)

### `generate-secret.sh`
Script para gerar um segredo aleatório para NEXTAUTH_SECRET.

**Uso:**
```bash
bash scripts/generate-secret.sh
```

## Estrutura de Diretórios na VPS

```
/var/www/barbeariasuite/         # Instalação da aplicação
├── current/                      # Versão atual (symlink)
├── backups/                      # Backups de versões anteriores
├── .env                          # Variáveis de ambiente
└── ...

/opt/mirofish/                   # Microservice Churn
├── .venv/                        # Virtual environment
├── src/                          # Código fonte
├── .env                          # Configuração do microservice
└── ...

/var/backups/database/           # Backups do banco de dados
└── backup-YYYYMMDD-HHMMSS.sql

/etc/systemd/system/             # Serviços systemd
├── barbeariasuite.service
└── mirofish.service
```

## Comandos Úteis

### BarbeariaSuite
```bash
# Ver status
systemctl status barbeariasuite

# Ver logs
journalctl -u barbeariasuite -f

# Reiniciar
systemctl restart barbeariasuite

# Iniciar
systemctl start barbeariasuite

# Parar
systemctl stop barbeariasuite

# Habilitar no boot
systemctl enable barbeariasuite
```

### MiroFish
```bash
# Ver status
systemctl status mirofish

# Ver logs
journalctl -u mirofish -f

# Reiniciar
systemctl restart mirofish

# Iniciar
systemctl start mirofish

# Parar
systemctl stop mirofish
```

### Banco de Dados
```bash
# Acessar MySQL
mysql -u barbearia_user -p barbeariasuite

# Backup manual
mysqldump -u barbearia_user -p barbeariasuite > backup.sql

# Restaurar backup
mysql -u barbearia_user -p barbeariasuite < backup.sql
```

## Monitoramento

### Verificando o Health Check
```bash
# BarbeariaSuite
curl -f https://barbearia.franquiabv.xyz/api/health

# MiroFish
curl -f http://localhost:8000/health
```

### Verificar Uso de Recursos
```bash
# Memória
free -h

# CPU
top

# Disco
df -h
```
