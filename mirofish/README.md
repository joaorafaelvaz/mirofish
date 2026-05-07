# MiroFish - Churn Prediction Microservice

Sistema de previsão de evasão de clientes para Barbearia VIP.

## Features

- Análise de comportamento de clientes
- Previsão de risco de churn com ML
- Automação de ações de retenção (WhatsApp, E-mail)
- Scheduler diário de processamento

## Requisitos

- Python 3.11+
- MySQL 5.7+
- Node.js 18+ (para webhooks)

## Instalação

```bash
# Clone o repositório
git clone https://github.com/.../mirofish.git
cd mirofish

# Configurar ambiente
cp .env.example .env
# Edite .env com suas configurações

# Instalar dependências
pip install -r requirements.txt

# Criar tabelas no MySQL
mysql -u root -p barbearia_vip < docs/schema.sql

# Executar localmente
python -m src.main
```

## API

### Endpoints

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check |
| `/api/churn/predict` | GET | Previsões de churn |
| `/api/churn/trigger` | POST | Disparar processamento |

## Configuração

Ver `.env.example` para todas as variáveis de ambiente.

## Deploy

### Docker

```bash
docker-compose up -d
```

## Desenvolvimento

```bash
# Rodar testes
pytest tests/ -v

# Rodar linter
flake8 src/
```

## Licença

MIT
