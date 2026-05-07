# src/main.py
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from src.config import settings
from src.db.connector import MySQLPool
from src.db.queries import QUERY_GET_CLIENTES, QUERY_GET_VENDAS_BY_CLIENTE
from src.features.calculator import calcular_features
from src.model.predictor import predictor
from src.actions.engine import action_engine

app = FastAPI(
    title="MiroFish - Churn Prediction API",
    description="Microservice for predicting and preventing customer churn",
    version="1.0.0"
)


class TriggerRequest(BaseModel):
    unidade_id: int
    force_reprocess: bool = False


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


async def process_churn(unidade_id: int, force_reprocess: bool):
    """Background task to process all clients for churn prediction."""
    from src.db.queries import QUERY_INSERT_LOG

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
        QUERY_INSERT_LOG,
        ('diario', registros_analisados, previsoes_geradas, acoes_disparadas, 'success', '', int(duration_ms))
    )

    print(f"[PROCESS] Complete: {registros_analisados} clientes, {acoes_disparadas} ações")
    return {
        "registros_analisados": registros_analisados,
        "previsoes_geradas": previsoes_geradas,
        "acoes_disparadas": acoes_disparadas,
        "duration_ms": int(duration_ms)
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
