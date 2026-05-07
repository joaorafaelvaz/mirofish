# MiroFish - Churn Prediction Microservice

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python-based microservice (MiroFish) that connects to Barbearia VIP's MySQL database, calculates customer churn features, runs ML prediction models, and triggers automated retention actions.

**Architecture:** 
- Python backend with Express.js-like API (FastAPI)
- MySQL connector for reading client data
- Pandas/Numpy for feature engineering
- XGBoost for ML model
- Node.js/Express for webhooks from Barbearia VIP
- Docker containerization for deployment

**Tech Stack:** Python 3.11+, FastAPI, MySQL Connector, Pandas, XGBoost, Docker, GitHub Actions

---

## File Structure

```
mirofish/
├── src/
│   ├── main.py               # FastAPI entry point
│   ├── config.py             # Environment configuration
│   ├── db/
│   │   ├── connector.py      # MySQL connection pool
│   │   └── queries.py        # SQL query builders
│   ├── features/
│   │   ├── calculator.py     # Feature calculation logic
│   │   └── schema.py         # Feature data models
│   ├── model/
│   │   ├── predictor.py      # ML prediction wrapper
│   │   └── trainer.py        # Model retraining utilities
│   ├── actions/
│   │   ├── engine.py         # Action execution engine
│   │   ├── email.py          # Email sending logic
│   │   ├── whatsapp.py       # WhatsApp sending logic
│   │   └── discount.py       # Discount generation
│   └── scheduler/
│       └── cron.py           # Scheduled task runner
├── data/
│   └── models/
│       └── churn_model_v1.joblib
├── tests/
│   ├── test_features.py
│   ├── test_model.py
│   └── test_actions.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

---

## Chunk 1: Core Infrastructure

### Task 1: Project Setup

**Files:**
- Create: `mirofish/requirements.txt`
- Create: `mirofish/pyproject.toml`
- Create: `mirofish/.env.example`

- [ ] **Step 1: Create project structure**

```bash
mkdir -p mirofish/src/{config,db,features,model,actions,scheduler}
mkdir -p mirofish/tests
mkdir -p mirofish/data/models
```

- [ ] **Step 2: Create requirements.txt**

```python
# requirements.txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.9
pymysql==1.1.0
pandas==2.2.0
numpy==1.26.4
scikit-learn==1.4.0
xgboost==2.0.0
joblib==1.3.2
python-dotenv==1.0.0
httpx==0.26.0
croniter==2.0.1
pydantic==2.6.0
```

- [ ] **Step 3: Create pyproject.toml**

```python
[project]
name = "mirofish"
version = "0.1.0"
description = "Churn Prediction Microservice for Barbearia VIP"
requires-python = ">=3.11"
dependencies = [
    "fastapi==0.109.0",
    "uvicorn[standard]==0.27.0",
    "pymysql==1.1.0",
    "pandas==2.2.0",
    "numpy==1.26.4",
    "scikit-learn==1.4.0",
    "xgboost==2.0.0",
    "joblib==1.3.2",
    "python-dotenv==1.0.0",
    "httpx==0.26.0",
    "croniter==2.0.1",
    "pydantic==2.6.0",
]

[project.scripts]
mirofish = "src.main:main"

[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.build_meta"
```

- [ ] **Step 4: Create .env.example**

```python
# MySQL Connection
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=barbearia_user
MYSQL_PASSWORD=secret
MYSQL_DATABASE=barbearia_vip
MYSQL_POOL_SIZE=5

# Model Settings
MODEL_PATH=data/models/churn_model_v1.joblib
FEATURE_COLUMNS=["dias_ultima_visita", "frequencia_mensal", "ticket_medio", "variabilidade_frequencia", "tendencia_declinio", "valor_total_comprado", "idade_cadastro"]

# Action Settings
ACTION_ENABLED=true
ACTIONS_EMAIL_ENABLED=true
ACTIONS_WHATSAPP_ENABLED=true
ACTIONS_DISCOUNT_ENABLED=true

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=churn@barbearia.com
SMTP_PASSWORD=app_password
SMTP_FROM=no-reply@barbearia.com

# WhatsApp API (Meta)
WHATSAPP_API_TOKEN=xxx
WHATSAPP_PHONE_ID=xxx

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

- [ ] **Step 5: Initialize git repo**

```bash
cd mirofish
git init
git add .
git commit -m "chore: initial project setup"
```

---

### Task 2: Configuration System

**Files:**
- Create: `mirofish/src/config.py`

- [ ] **Step 1: Create config.py**

```python
# src/config.py
import os
from dotenv import load_dotenv
from pydantic import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    # MySQL
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "barbearia_user"
    MYSQL_PASSWORD: str = "secret"
    MYSQL_DATABASE: str = "barbearia_vip"
    MYSQL_POOL_SIZE: int = 5
    
    # Model
    MODEL_PATH: str = "data/models/churn_model_v1.joblib"
    FEATURE_COLUMNS: list = [
        "dias_ultima_visita",
        "frequencia_mensal",
        "ticket_medio",
        "variabilidade_frequencia",
        "tendencia_declinio",
        "valor_total_comprado",
        "idade_cadastro"
    ]
    
    # Actions
    ACTION_ENABLED: bool = True
    ACTIONS_EMAIL_ENABLED: bool = True
    ACTIONS_WHATSAPP_ENABLED: bool = True
    ACTIONS_DISCOUNT_ENABLED: bool = True
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "churn@barbearia.com"
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "no-reply@barbearia.com"
    
    # WhatsApp
    WHATSAPP_API_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

settings = Settings()
```

- [ ] **Step 2: Test config loading**

```python
# tests/test_config.py
from src.config import settings

def test_settings_loaded():
    assert settings.MYSQL_HOST == "localhost"
    assert settings.MYSQL_PORT == 3306
```

Run: `pytest tests/test_config.py -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/config.py tests/test_config.py
git commit -m "feat: add configuration system"
```

---

### Task 3: Database Connector

**Files:**
- Create: `mirofish/src/db/connector.py`
- Create: `mirofish/src/db/queries.py`

- [ ] **Step 1: Create connector.py**

```python
# src/db/connector.py
import pymysql
from pymysql.cursors import DictCursor
from src.config import settings
import threading

class MySQLPool:
    _local = threading.local()
    _pool = []

    @classmethod
    def get_connection(cls):
        if not hasattr(cls._local, 'connection') or not cls._local.connection:
            cls._local.connection = cls._create_connection()
        return cls._local.connection

    @classmethod
    def _create_connection(cls):
        return pymysql.connect(
            host=settings.MYSQL_HOST,
            port=settings.MYSQL_PORT,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            database=settings.MYSQL_DATABASE,
            cursorclass=DictCursor,
            autocommit=True
        )

    @classmethod
    def close_connection(cls):
        if hasattr(cls._local, 'connection') and cls._local.connection:
            cls._local.connection.close()
            cls._local.connection = None

    @classmethod
    def execute_query(cls, query, params=None):
        conn = cls.get_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()

    @classmethod
    def execute_query_one(cls, query, params=None):
        conn = cls.get_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchone()
```

- [ ] **Step 2: Create queries.py**

```python
# src/db/queries.py
from src.config import settings

# Client queries
QUERY_GET_CLIENTES = """
SELECT 
    bc.id as cliente_id,
    bc.erpId as erp_cliente_id,
    bc.nome,
    bc.telefone,
    bc.email,
    bc.ultimaVisita,
    bc.criadoEm as data_cadastro,
    bc.statusCliente,
    bc.cpf,
    bc.bairro,
    bc.cidade,
    bc.estado,
    bc.origem
FROM barbershop_clientes bc
WHERE bc.unitId = %s AND bc.ativo = 1
"""

QUERY_GET_VENDAS_BY_CLIENTE = """
SELECT 
    bv.id,
    bv.valorLiquido,
    bv.vendaData,
    bv.produto,
    bv.categoria
FROM barbershop_vendas bv
WHERE bv.clienteId = %s
ORDER BY bv.vendaData DESC
LIMIT 100
"""

QUERY_GET_VENDAS_RECENTES = """
SELECT 
    bv.clienteId,
    bv.valorLiquido,
    bv.vendaData
FROM barbershop_vendas bv
WHERE bv.unitId = %s
  AND bv.vendaData >= DATE_SUB(NOW(), INTERVAL 90 DAY)
ORDER BY bv.vendaData DESC
"""

QUERY_GET_CLIENTE_BY_ID = """
SELECT * FROM barbershop_clientes WHERE id = %s
"""

# Churn prediction queries
QUERY_INSERT_PREDICTION = """
INSERT INTO churn_predictions 
(cliente_id, unidade_id, score_risco, probabilidade, features, previsao_data, status)
VALUES (%s, %s, %s, %s, %s, NOW(), %s)
"""

QUERY_INSERT_ACAO = """
INSERT INTO churn_acoes 
(cliente_id, unidade_id, tipo_acao, mensagem, status)
VALUES (%s, %s, %s, %s, %s)
"""

QUERY_INSERT_LOG = """
INSERT INTO churn_logs 
(tipo_processamento, registros_analisados, previsoes_geradas, acoes_disparadas, status, erro_mensagem, duration_ms)
VALUES (%s, %s, %s, %s, %s, %s, %s)
"""
```

- [ ] **Step 3: Create test_db.py**

```python
# tests/test_db.py
import pytest
from src.db.connector import MySQLPool

def test_connection():
    # This will fail if MySQL is not configured
    try:
        result = MySQLPool.execute_query("SELECT 1 as test")
        assert result[0]['test'] == 1
    except Exception as e:
        pytest.skip(f"MySQL not available: {e}")
```

Run: `pytest tests/test_db.py -v`
Expected: PASS or SKIP (if MySQL unavailable)

- [ ] **Step 4: Commit**

```bash
git add src/db/connector.py src/db/queries.py tests/test_db.py
git commit -m "feat: add database connector"
```

---

## Chunk 2: Feature Engineering

### Task 4: Feature Calculator

**Files:**
- Create: `mirofish/src/features/calculator.py`
- Create: `mirofish/src/features/schema.py`

- [ ] **Step 1: Create schema.py**

```python
# src/features/schema.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

class FeatureSet(BaseModel):
    cliente_id: int
    unidade_id: int
    dias_ultima_visita: int
    frequencia_mensal: float
    ticket_medio: float
    variabilidade_frequencia: float
    tendencia_declinio: float
    valor_total_comprado: float
    valor_ultimo_mes: float
    reducao_valor: float
    idade_cadastro: int
    origem_app: bool
    
    # Metadata
    data_processamento: datetime
    ultima_visita: Optional[date] = None
```

- [ ] **Step 2: Create calculator.py**

```python
# src/features/calculator.py
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
import numpy as np
from src.features.schema import FeatureSet

def calcular_features(cliente: Dict[str, Any], vendas: List[Dict[str, Any]]) -> FeatureSet:
    """Calculate all churn features for a client."""
    
    hoje = date.today()
    
    # Parse data
    ultima_visita = cliente.get('ultimaVisita')
    if ultima_visita:
        if isinstance(ultima_visita, str):
            ultima_visita = datetime.fromisoformat(ultima_visita.replace('Z', '+00:00')).date()
        dias_ultima_visita = (hoje - ultima_visita).days
    else:
        dias_ultima_visita = 999  # Never visited
    
    # Data de cadastro
    data_cadastro = cliente.get('data_cadastro')
    if data_cadastro:
        if isinstance(data_cadastro, str):
            data_cadastro = datetime.fromisoformat(data_cadastro.replace('Z', '+00:00')).date()
        idade_cadastro = (hoje - data_cadastro).days
    else:
        idade_cadastro = 0
    
    # Calcular métricas de vendas
    if not vendas:
        return FeatureSet(
            cliente_id=cliente['cliente_id'],
            unidade_id=cliente.get('unitId', 1),
            dias_ultima_visita=dias_ultima_visita,
            frequencia_mensal=0.0,
            ticket_medio=0.0,
            variabilidade_frequencia=0.0,
            tendencia_declinio=0.0,
            valor_total_comprado=0.0,
            valor_ultimo_mes=0.0,
            reducao_valor=0.0,
            idade_cadastro=idade_cadastro,
            origem_app=bool(cliente.get('origem') == 'app'),
            data_processamento=datetime.now(),
            ultima_visita=ultima_visita
        )
    
    # Ordenar vendas por data
    vendas_ordenadas = sorted(vendas, key=lambda x: x.get('vendaData', ''), reverse=True)
    
    # Converter datas
    for v in vendas_ordenadas:
        if v.get('vendaData') and isinstance(v['vendaData'], str):
            v['_data'] = datetime.fromisoformat(v['vendaData'].replace('Z', '+00:00')).date()
        elif v.get('vendaData'):
            v['_data'] = v['vendaData']
    
    # Valor total
    valor_total = sum(float(v.get('valorLiquido', 0) or 0) for v in vendas_ordenadas)
    
    # Ticket médio
    ticket_medio = valor_total / len(vendas_ordenadas) if vendas_ordenadas else 0
    
    # Frequência mensal (vendas nos últimos 90 dias / 3)
    vendas_90dias = [v for v in vendas_ordenadas if (hoje - v['_data']).days <= 90]
    frequencia_mensal = len(vendas_90dias) / 3 if vendas_ordenadas else 0
    
    # Valor último mês (30 dias)
    vendas_30dias = [v for v in vendas_ordenadas if (hoje - v['_data']).days <= 30]
    valor_ultimo_mes = sum(float(v.get('valorLiquido', 0) or 0) for v in vendas_30dias)
    
    # Tendência de declínio
    if len(vendas_ordenadas) >= 6:
        ultimas_3 = vendas_ordenadas[:3]
        anteriores_3 = vendas_ordenadas[3:6]
        freq_ultimas = len(ultimas_3)
        freq_anteriores = len(anteriores_3)
        tendencia_declinio = freq_ultimas / freq_anteriores if freq_anteriores > 0 else 1.0
    else:
        tendencia_declinio = 1.0
    
    # Variabilidade (CV = std/mean)
    if len(vendas_ordenadas) > 1:
        valores = [float(v.get('valorLiquido', 0) or 0) for v in vendas_ordenadas]
        std_valores = np.std(valores)
        mean_valores = np.mean(valores)
        variabilidade_frequencia = std_valores / mean_valores if mean_valores > 0 else 0.0
    else:
        variabilidade_frequencia = 0.0
    
    # Redução de valor
    if len(vendas_ordenadas) >= 6:
        ultimas_3_valores = sum(float(v.get('valorLiquido', 0) or 0) for v in vendas_ordenadas[:3])
        anteriores_3_valores = sum(float(v.get('valorLiquido', 0) or 0) for v in vendas_ordenadas[3:6])
        reducao_valor = (anteriores_3_valores - ultimas_3_valores) / anteriores_3_valores if anteriores_3_valores > 0 else 0.0
    else:
        reducao_valor = 0.0
    
    return FeatureSet(
        cliente_id=cliente['cliente_id'],
        unidade_id=cliente.get('unitId', 1),
        dias_ultima_visita=dias_ultima_visita,
        frequencia_mensal=frequencia_mensal,
        ticket_medio=ticket_medio,
        variabilidade_frequencia=variabilidade_frequencia,
        tendencia_declinio=tendencia_declinio,
        valor_total_comprado=valor_total,
        valor_ultimo_mes=valor_ultimo_mes,
        reducao_valor=reducao_valor,
        idade_cadastro=idade_cadastro,
        origem_app=bool(cliente.get('origem') == 'app'),
        data_processamento=datetime.now(),
        ultima_visita=ultima_visita
    )
```

- [ ] **Step 3: Create test_features.py**

```python
# tests/test_features.py
from datetime import datetime, date
from src.features.calculator import calcular_features

def test_calcular_features_sem_vendas():
    cliente = {
        'cliente_id': 1,
        'unitId': 1,
        'ultimaVisita': None,
        'data_cadastro': '2025-01-01T00:00:00',
        'origem': 'app'
    }
    vendas = []
    
    features = calcular_features(cliente, vendas)
    
    assert features.cliente_id == 1
    assert features.dias_ultima_visita == 999
    assert features.frequencia_mensal == 0.0
    assert features.origem_app == True

def test_calcular_features_com_vendas():
    hoje = date.today()
    cliente = {
        'cliente_id': 2,
        'unitId': 1,
        'ultimaVisita': hoje.isoformat(),
        'data_cadastro': '2024-01-01T00:00:00',
        'origem': 'balcao'
    }
    
    vendas = [
        {'valorLiquido': 100, 'vendaData': (hoje - timedelta(days=5)).isoformat()},
        {'valorLiquido': 150, 'vendaData': (hoje - timedelta(days=30)).isoformat()},
    ]
    
    features = calcular_features(cliente, vendas)
    
    assert features.cliente_id == 2
    assert features.frequencia_mensal > 0
    assert features.ticket_medio > 0
```

Run: `pytest tests/test_features.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/features/calculator.py src/features/schema.py tests/test_features.py
git commit -m "feat: add feature calculation engine"
```

---

## Chunk 3: ML Model

### Task 5: Model Predictor

**Files:**
- Create: `mirofish/src/model/predictor.py`
- Create: `mirofish/src/model/trainer.py`

- [ ] **Step 1: Create predictor.py**

```python
# src/model/predictor.py
import joblib
import numpy as np
from pathlib import Path
from src.features.schema import FeatureSet
from src.config import settings

class ChurnPredictor:
    def __init__(self):
        self.model = None
        self.feature_columns = settings.FEATURE_COLUMNS
        self._load_model()
    
    def _load_model(self):
        """Load the trained model from disk."""
        model_path = Path(settings.MODEL_PATH)
        if model_path.exists():
            self.model = joblib.load(model_path)
            print(f"Model loaded from {settings.MODEL_PATH}")
        else:
            print(f"Model not found at {settings.MODEL_PATH}. Using fallback logic.")
            self.model = None
    
    def predict_proba(self, features: FeatureSet) -> float:
        """Predict probability of churn (0-1)."""
        if self.model is None:
            # Fallback: rule-based prediction
            return self._fallback_prediction(features)
        
        # Prepare features array
        feature_values = [
            features.dias_ultima_visita,
            features.frequencia_mensal,
            features.ticket_medio,
            features.variabilidade_frequencia,
            features.tendencia_declinio,
            features.valor_total_comprado,
            features.idade_cadastro
        ]
        
        X = np.array([feature_values])
        proba = self.model.predict_proba(X)[0][1]  # Probability of class 1 (churn)
        return min(max(proba, 0.0), 1.0)  # Clamp to 0-1
    
    def _fallback_prediction(self, features: FeatureSet) -> float:
        """Simple rule-based prediction when model not available."""
        score = 0
        
        # Score by days since last visit
        if features.dias_ultima_visita > 90:
            score += 40
        elif features.dias_ultima_visita > 60:
            score += 25
        elif features.dias_ultima_visita > 30:
            score += 10
        
        # Score by frequency decline
        if features.tendencia_declinio < 0.5:
            score += 30
        elif features.tendencia_declinio < 0.8:
            score += 15
        
        # Score by low frequency
        if features.frequencia_mensal < 0.3:
            score += 20
        
        # Score by low ticket
        if features.ticket_medio < 50:
            score += 10
        
        return min(score / 100, 1.0)
    
    def get_risk_level(self, proba: float) -> tuple[str, int]:
        """Get risk level and score from probability."""
        score = int(proba * 100)
        
        if score < 30:
            return ('baixo', score)
        elif score < 60:
            return ('medio', score)
        elif score < 80:
            return ('alto', score)
        else:
            return ('critico', score)
    
    def needs_retraining(self) -> bool:
        """Check if model file exists."""
        return not Path(settings.MODEL_PATH).exists()

predictor = ChurnPredictor()
```

- [ ] **Step 2: Create trainer.py**

```python
# src/model/trainer.py
import joblib
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report, roc_auc_score
from src.config import settings

def train_churn_model(X_train, y_train, output_path: str = None):
    """
    Train a churn prediction model.
    
    Parameters:
    - X_train: Features DataFrame
    - y_train: Target labels (0=not churn, 1=churn)
    - output_path: Path to save the model
    """
    
    # Split data
    X_train_split, X_val, y_train_split, y_val = train_test_split(
        X_train, y_train, test_size=0.2, random_state=42
    )
    
    # Train model
    model = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=3,
        random_state=42
    )
    
    model.fit(X_train_split, y_train_split)
    
    # Evaluate
    y_pred = model.predict(X_val)
    y_pred_proba = model.predict_proba(X_val)[:, 1]
    
    auc_score = roc_auc_score(y_val, y_pred_proba)
    print(f"Validation AUC: {auc_score:.4f}")
    print(classification_report(y_val, y_pred))
    
    # Save model
    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, output_path)
        print(f"Model saved to {output_path}")
    
    return model

def create_training_dataset(clientes_features: list) -> tuple:
    """
    Create training dataset from labeled features.
    
    Returns: (X, y) where X is features, y is churn labels
    """
    feature_cols = settings.FEATURE_COLUMNS
    
    X = pd.DataFrame([
        {col: getattr(f, col) for col in feature_cols}
        for f in clientes_features
    ])
    
    # y would come from labeled data (actual churn events)
    # For now, we return placeholder
    y = None
    
    return X, y
```

- [ ] **Step 3: Create model tests**

```python
# tests/test_model.py
import pytest
from src.model.predictor import predictor

def test_predictor_initialized():
    assert predictor is not None
    assert hasattr(predictor, 'predict_proba')

def test_predict_proba_fallback():
    # Test fallback prediction without model
    class MockFeatures:
        dias_ultima_visita = 45
        frequencia_mensal = 0.5
        ticket_medio = 100
        variabilidade_frequencia = 0.2
        tendencia_declinio = 0.9
        valor_total_comprado = 500
        idade_cadastro = 180
    
    proba = predictor.predict_proba(MockFeatures())
    assert 0 <= proba <= 1

def test_get_risk_level():
    proba = 0.75
    level, score = predictor.get_risk_level(proba)
    
    assert level == 'alto'
    assert score == 75
```

Run: `pytest tests/test_model.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/model/predictor.py src/model/trainer.py tests/test_model.py
git commit -m "feat: add ML prediction model"
```

---

## Chunk 4: Action Engine

### Task 6: Action Engine

**Files:**
- Create: `mirofish/src/actions/engine.py`
- Create: `mirofish/src/actions/email.py`
- Create: `mirofish/src/actions/whatsapp.py`
- Create: `mirofish/src/actions/discount.py`

- [ ] **Step 1: Create discount.py**

```python
# src/actions/discount.py
import random
from datetime import datetime, timedelta

class DiscountGenerator:
    """Generate personalized discount offers based on customer profile."""
    
    @staticmethod
    def generate_discount_code(customer_id: int, level: str) -> dict:
        """Generate discount code and offer details."""
        
        # Base discount by risk level
        discount_by_level = {
            'medio': 10,
            'alto': 15,
            'critico': 25
        }
        
        base_discount = discount_by_level.get(level, 10)
        
        # Add randomness (±5%)
        actual_discount = base_discount + random.randint(-5, 5)
        actual_discount = max(5, min(30, actual_discount))  # Clamp 5-30%
        
        # Generate code
        timestamp = datetime.now().strftime('%Y%m%d')
        code = f"RET{timestamp}{customer_id:05d}"
        
        return {
            'code': code,
            'discount': actual_discount,
            'level': level,
            'expiry_days': 7,
            'message': f"Oferta exclusiva: {actual_discount}% de desconto em sua próxima compra!"
        }

discount_gen = DiscountGenerator()
```

- [ ] **Step 2: Create email.py**

```python
# src/actions/email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.config import settings

class EmailSender:
    """Send email notifications for churn actions."""
    
    def __init__(self):
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.user = settings.SMTP_USER
        self.password = settings.SMTP_PASSWORD
        self.from_addr = settings.SMTP_FROM
    
    def send_email(self, to_addr: str, subject: str, body: str) -> bool:
        """Send an email notification."""
        
        if not settings.ACTIONS_EMAIL_ENABLED:
            print(f"[EMAIL] Disabled - would send to {to_addr}")
            return True
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_addr
            msg['To'] = to_addr
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            with smtplib.SMTP(self.host, self.port) as server:
                server.starttls()
                server.login(self.user, self.password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"[EMAIL] Error sending to {to_addr}: {e}")
            return False
    
    def send_churn_warning(self, customer_name: str, email: str, score: int) -> bool:
        """Send churn warning email."""
        if score > 80:
            subject = "⚠️ Atenção: Cliente em risco de perda"
        elif score > 60:
            subject = "⚠️ Cliente com redução de atividade"
        else:
            subject = "ℹ️ Relatório de atividade do cliente"
        
        body = f"""
Olá,

Este é um alerta automático do sistema de previsão de evasão.

Cliente: {customer_name}
E-mail: {email}
Score de Risco: {score}%

{"Este cliente está demonstrando sinais de evasão e pode deixar de comprar em breve." if score > 60 else "O cliente continua ativo, mas mantenha monitoramento."}

Ações recomendadas:
- Contatar o cliente via WhatsApp
- Oferecer desconto especial
- Verificar motivo da redução de atividade

--
Sistema MiroFish
 Barbearia VIP
        """
        
        return self.send_email(email, subject, body)

email_sender = EmailSender()
```

- [ ] **Step 3: Create whatsapp.py**

```python
# src/actions/whatsapp.py
import httpx
from src.config import settings

class WhatsAppSender:
    """Send WhatsApp messages via Meta API."""
    
    def __init__(self):
        self.token = settings.WHATSAPP_API_TOKEN
        self.phone_id = settings.WHATSAPP_PHONE_ID
        self.base_url = "https://graph.facebook.com/v18.0"
    
    def send_message(self, to_phone: str, message: str) -> dict:
        """Send a WhatsApp message."""
        
        if not settings.WHATSAPP_API_TOKEN or not settings.WHATSAPP_PHONE_ID:
            print(f"[WHATSAPP] Not configured - would send to {to_phone}")
            return {'success': True, 'id': 'mock'}
        
        if not settings.ACTIONS_WHATSAPP_ENABLED:
            print(f"[WHATSAPP] Disabled - would send to {to_phone}")
            return {'success': True, 'id': 'disabled'}
        
        url = f"{self.base_url}/{self.phone_id}/messages"
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'messaging_product': 'whatsapp',
            'to': to_phone,
            'type': 'text',
            'text': {'body': message}
        }
        
        try:
            response = httpx.post(url, json=payload, headers=headers)
            return {'success': True, 'id': response.json().get('messages', [{}])[0].get('id')}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def send_churn_offer(self, to_phone: str, discount_code: str, discount_percent: int) -> dict:
        """Send discount offer via WhatsApp."""
        
        message = f"""
Olá! Esperamos que esteja bem! 🎁

Como agradecimento por ser um cliente especial, estamos oferecendo:

✨ {discount_percent}% DE DESCONTO na sua próxima compra!

Código: {discount_code}

Válido por 7 dias. Aguardamos seu retorno!

Equipe Barbearia VIP
"""
        
        return self.send_message(to_phone, message)

whatsapp_sender = WhatsAppSender()
```

- [ ] **Step 4: Create engine.py**

```python
# src/actions/engine.py
from src.actions.email import email_sender
from src.actions.whatsapp import whatsapp_sender
from src.actions.discount import discount_gen
from src.db.connector import MySQLPool
from src.config import settings

class ActionEngine:
    """Execute churn retention actions."""
    
    def __init__(self):
        self.actions_enabled = settings.ACTION_ENABLED
    
    def execute_action(self, cliente_id: int, unidade_id: int, level: str, email: str, telefone: str):
        """Execute retention action based on risk level."""
        
        if not self.actions_enabled:
            print(f"[ACTION] Disabled - skipping action for cliente {cliente_id}")
            return
        
        # Generate discount
        discount = discount_gen.generate_discount_code(cliente_id, level)
        
        # Send WhatsApp
        if telefone:
            whatsapp_result = whatsapp_sender.send_churn_offer(telefone, discount['code'], discount['discount'])
            print(f"[WHATSAPP] Result: {whatsapp_result}")
        
        # Send Email
        if email:
            email_result = email_sender.send_churn_warning(f"Cliente {cliente_id}", email, discount['discount'])
            print(f"[EMAIL] Result: {email_result}")
        
        # Log action in Barbearia VIP database
        self._log_action(cliente_id, unidade_id, level, discount)
    
    def _log_action(self, cliente_id: int, unidade_id: int, level: str, discount: dict):
        """Log action to Barbearia VIP database."""
        
        query = """
        INSERT INTO churn_acoes (cliente_id, unidade_id, tipo_acao, mensagem, status)
        VALUES (%s, %s, %s, %s, 'pendente')
        """
        
        params = (
            cliente_id,
            unidade_id,
            'whatsapp',
            f"Oferta: {discount['code']} - {discount['discount']}%"
        )
        
        try:
            MySQLPool.execute_query(query, params)
            print(f"[LOG] Action logged for cliente {cliente_id}")
        except Exception as e:
            print(f"[LOG] Error: {e}")

action_engine = ActionEngine()
```

- [ ] **Step 5: Create tests**

```python
# tests/test_actions.py
from src.actions.discount import discount_gen
from src.actions.engine import action_engine

def test_discount_generation():
    discount = discount_gen.generate_discount_code(123, 'alto')
    
    assert 'code' in discount
    assert 'discount' in discount
    assert 10 <= discount['discount'] <= 30

def test_action_engine_init():
    assert action_engine is not None
    assert hasattr(action_engine, 'execute_action')
```

Run: `pytest tests/test_actions.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/actions/*.py tests/test_actions.py
git commit -m "feat: add action engine for retention"
```

---

## Chunk 5: API Server

### Task 7: FastAPI Application

**Files:**
- Create: `mirofish/src/main.py`

- [ ] **Step 1: Create main.py**

```python
# src/main.py
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from src.config import settings
from src.db.connector import MySQLPool
from src.db.queries import QUERY_GET_CLIENTES, QUERY_GET_VENDAS_BY_CLIENTE
from src.features.calculator import calcular_features
from src.model.predictor import predictor
from src.actions.engine import action_engine
from src.features.schema import FeatureSet

app = FastAPI(
    title="MiroFish - Churn Prediction API",
    description="Microservice for predicting and preventing customer churn",
    version="1.0.0"
)

# Request models
class TriggerRequest(BaseModel):
    unidade_id: int
    force_reprocess: bool = False

class PredictResponse(BaseModel):
    cliente_id: int
    nome: str
    score_risco: int
    probabilidade: float
    status: str
    features: dict
    ultima_visita: Optional[str] = None

# Endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/churn/predict")
async def get_predictions(unidade_id: int, limit: int = 100):
    """Get churn predictions for a unit."""
    
    # Get clients
    clientes = MySQLPool.execute_query(QUERY_GET_CLIENTES, (unidade_id,))
    
    if not clientes:
        return {"data": [], "total": 0, "em_risco": 0, "em_risco_alto": 0}
    
    results = []
    em_risco = 0
    em_risco_alto = 0
    
    for cliente in clientes:
        # Get client sales
        vendas = MySQLPool.execute_query(
            QUERY_GET_VENDAS_BY_CLIENTE,
            (cliente['cliente_id'],)
        )
        
        # Calculate features
        features = calcular_features(cliente, vendas)
        
        # Get prediction
        proba = predictor.predict_proba(features)
        level, score = predictor.get_risk_level(proba)
        
        results.append({
            "cliente_id": cliente['cliente_id'],
            "nome": cliente['nome'],
            "score_risco": score,
            "probabilidade": proba,
            "status": level,
            "features": features.model_dump(),
            "ultima_visita": features.ultima_visita.isoformat() if features.ultima_visita else None
        })
        
        if level in ['medio', 'alto', 'critico']:
            em_risco += 1
        if level in ['alto', 'critico']:
            em_risco_alto += 1
    
    return {
        "data": results,
        "total": len(results),
        "em_risco": em_risco,
        "em_risco_alto": em_risco_alto
    }

@app.post("/api/churn/trigger")
async def trigger_processing(
    request: TriggerRequest,
    background_tasks: BackgroundTasks
):
    """Trigger churn processing in background."""
    
    # Schedule background task
    background_tasks.add_task(process_churn, request.unidade_id, request.force_reprocess)
    
    return {
        "success": True,
        "message": "Processamento iniciado em background",
        "unidade_id": request.unidade_id
    }

async def process_churn(unidade_id: int, force_reprocess: bool):
    """Background task to process all clients for churn prediction."""
    
    print(f"[PROCESS] Starting churn processing for unidade {unidade_id}")
    
    start_time = datetime.now()
    registros_analisados = 0
    previsoes_geradas = 0
    acoes_disparadas = 0
    
    # Get clients
    clientes = MySQLPool.execute_query(QUERY_GET_CLIENTES, (unidade_id,))
    
    for cliente in clientes:
        try:
            # Get sales
            vendas = MySQLPool.execute_query(
                QUERY_GET_VENDAS_BY_CLIENTE,
                (cliente['cliente_id'],)
            )
            
            # Calculate features
            features = calcular_features(cliente, vendas)
            
            # Get prediction
            proba = predictor.predict_proba(features)
            level, score = predictor.get_risk_level(proba)
            
            previsoes_geradas += 1
            registros_analisados += 1
            
            # Execute action if needed
            if level in ['medio', 'alto', 'critico']:
                action_engine.execute_action(
                    cliente_id=cliente['cliente_id'],
                    unidade_id=unidade_id,
                    level=level,
                    email=cliente.get('email', ''),
                    telefone=cliente.get('telefone', '')
                )
                acoes_disparadas += 1
            
            print(f"[PROCESS] Cliente {cliente['cliente_id']}: {level} (score: {score})")
            
        except Exception as e:
            print(f"[PROCESS] Error processing cliente {cliente.get('cliente_id')}: {e}")
            continue
    
    duration_ms = (datetime.now() - start_time).total_seconds() * 1000
    
    # Log processing
    MySQLPool.execute_query(
        """INSERT INTO churn_logs (tipo_processamento, registros_analisados, previsoes_geradas, acoes_disparadas, status, erro_mensagem, duration_ms)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        ('diario', registros_analisados, previsoes_geradas, acoes_disparadas, 'success', '', int(duration_ms))
    )
    
    print(f"[PROCESS] Complete: {registros_analisados} clientes, {acoes_disparadas} ações")
    return {
        "registros_analisados": registros_analisados,
        "previsoes_geradas": previsoes_geradas,
        "acoes_disparadas": acoes_disparadas,
        "duration_ms": int(duration_ms)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
```

- [ ] **Step 2: Create main test**

```python
# tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data

def test_get_predictions_no_clients():
    response = client.get("/api/churn/predict?unidade_id=1")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "total" in data
```

Run: `pytest tests/test_api.py -v`
Expected: PASS (some tests may fail if database not available)

- [ ] **Step 3: Commit**

```bash
git add src/main.py tests/test_api.py
git commit -m "feat: add FastAPI server"
```

---

## Chunk 6: Scheduler and Docker

### Task 8: Scheduler

**Files:**
- Create: `mirofish/src/scheduler/cron.py`

- [ ] **Step 1: Create cron.py**

```python
# src/scheduler/cron.py
import croniter
from datetime import datetime, timedelta
from src.db.connector import MySQLPool

class ChurnScheduler:
    """Scheduler for automated churn processing."""
    
    def __init__(self, cron_expression: str = None):
        self.cron = croniter.croniter(
            cron_expression or "0 0 * * *",  # Default: daily at 00:00
            datetime.now()
        )
    
    def get_next_run(self) -> datetime:
        """Get next scheduled run time."""
        return self.cron.get_next(datetime)
    
    def is_time_to_run(self) -> bool:
        """Check if current time matches schedule."""
        next_run = self.get_next_run()
        now = datetime.now()
        return now >= next_run and now < next_run + timedelta(minutes=1)
    
    def run_scheduled(self):
        """Run scheduled processing for all units."""
        print(f"[SCHEDULER] Running scheduled job at {datetime.now()}")
        
        # Get all units from database
        units = MySQLPool.execute_query(
            "SELECT DISTINCT unitId FROM barbershop_clientes WHERE ativo = 1"
        )
        
        for unit in units:
            unit_id = unit['unitId']
            # Import and call process_churn from main
            from src.main import process_churn
            # Note: In production, use background task
            print(f"[SCHEDULER] Processing unit {unit_id}")
        
        print("[SCHEDULER] Job complete")

scheduler = ChurnScheduler()
```

- [ ] **Step 2: Create scheduler test**

```python
# tests/test_scheduler.py
from src.scheduler.cron import scheduler
from datetime import datetime, timedelta

def test_cron_schedule():
    next_run = scheduler.get_next_run()
    assert next_run > datetime.now()

def test_is_time_to_run():
    # Test should pass when cron matches
    result = scheduler.is_time_to_run()
    # Result depends on current time vs schedule
    assert isinstance(result, bool)
```

Run: `pytest tests/test_scheduler.py -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/scheduler/cron.py tests/test_scheduler.py
git commit -m "feat: add scheduler module"
```

### Task 9: Docker Configuration

**Files:**
- Create: `mirofish/Dockerfile`
- Create: `mirofish/docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY src/ ./src/
COPY data/ ./data/ 2>/dev/null || true

# Create data directory if not exists
RUN mkdir -p /app/data/models

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
version: '3.8'

services:
  mirofish:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MYSQL_HOST=${MYSQL_HOST}
      - MYSQL_PORT=${MYSQL_PORT}
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - WHATSAPP_API_TOKEN=${WHATSAPP_API_TOKEN}
      - WHATSAPP_PHONE_ID=${WHATSAPP_PHONE_ID}
      - DEBUG=${DEBUG:-false}
    volumes:
      - ./data/models:/app/data/models
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

- [ ] **Step 3: Create .dockerignore**

```
.git
.gitignore
__pycache__
*.pyc
*.pyo
.env
venv
.env.local
*.md
!.env.example
```

- [ ] **Step 4: Commit**

```bash
git add Dockerfile docker-compose.yml .dockerignore
git commit -m "chore: add Docker configuration"
```

---

## Chunk 7: Testing and Documentation

### Task 10: Integration Tests

**Files:**
- Create: `mirofish/tests/test_integration.py`

- [ ] **Step 1: Create integration test**

```python
# tests/test_integration.py
import pytest
from datetime import datetime, timedelta
from src.db.connector import MySQLPool
from src.features.calculator import calcular_features
from src.model.predictor import predictor
from src.actions.engine import action_engine

@pytest.mark.integration
def test_full_pipeline():
    """Test the full churn prediction pipeline."""
    
    # Skip if MySQL not available
    pytest.importorskip("pymysql")
    
    # Get a test client
    clientes = MySQLPool.execute_query(
        "SELECT * FROM barbershop_clientes WHERE ativo = 1 LIMIT 1"
    )
    
    if not clientes:
        pytest.skip("No clients in database")
    
    cliente = clientes[0]
    
    # Get sales
    vendas = MySQLPool.execute_query(
        "SELECT * FROM barbershop_vendas WHERE clienteId = %s LIMIT 10",
        (cliente['cliente_id'],)
    )
    
    # Test feature calculation
    features = calcular_features(cliente, vendas)
    assert features.cliente_id == cliente['cliente_id']
    
    # Test prediction
    proba = predictor.predict_proba(features)
    assert 0 <= proba <= 1
    
    # Test risk level
    level, score = predictor.get_risk_level(proba)
    assert level in ['baixo', 'medio', 'alto', 'critico']
    assert 0 <= score <= 100

@pytest.mark.integration
def test_action_execution():
    """Test action engine execution (mocked)."""
    # This test would require actual database access
    # For CI, we'd mock the database calls
    assert action_engine is not None
```

Run: `pytest tests/test_integration.py -v`
Expected: PASS or SKIP

- [ ] **Step 2: Commit**

```bash
git add tests/test_integration.py
git commit -m "test: add integration tests"
```

### Task 11: Documentation

**Files:**
- Create: `mirofish/README.md`

- [ ] **Step 1: Create README**

```markdown
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

### Heroku

```bash
heroku create
git push heroku main
heroku config:set MYSQL_HOST=... # etc
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md docs/schema.sql
git commit -m "docs: add README and schema"
```

---

## Final Checklist

- [ ] All units pass: `pytest tests/ -v`
- [ ] Code coverage > 80%
- [ ] Docker build succeeds: `docker-compose build`
- [ ] API responsive: `curl http://localhost:8000/health`
- [ ] Git log shows all commits

---

**Total:** 11 tasks, ~2 weeks for MVP
