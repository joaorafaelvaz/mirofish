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
