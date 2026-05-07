# src/features/schema.py
from pydantic import BaseModel
from typing import Optional
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
