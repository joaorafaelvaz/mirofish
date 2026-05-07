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
