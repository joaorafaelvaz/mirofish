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
