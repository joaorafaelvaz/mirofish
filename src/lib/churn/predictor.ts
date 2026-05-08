import { ChurnFeatures } from "./features"

/**
 * Risk levels based on score
 * 0-30: baixo (low risk)
 * 31-60: medio (medium risk)
 * 61-80: alto (high risk)
 * 81-100: critico (critical risk)
 */
export type ChurnRiskLevel = "baixo" | "medio" | "alto" | "critico"

/**
 * Churn status based on prediction
 */
export type ChurnStatus = "ativo" | "em_risco" | "em_risco_alto" | "perdido"

/**
 * Prediction result
 */
export type ChurnPredictionResult = {
  score: number // 0-100
  probability: number // 0-1
  level: ChurnRiskLevel
  status: ChurnStatus
}

/**
 * Simple rule-based churn predictor
 * When ML model is not available, uses rules to estimate churn risk
 */
export class ChurnPredictor {
  /**
   * Predict churn based on features
   * Uses rule-based approach when ML model is not available
   */
  predict(features: ChurnFeatures): ChurnPredictionResult {
    // Calculate base score from features
    let score = 0

    // Dias desde última visita (maior impacto)
    if (features.diasUltimaVisita > 90) {
      score += 40
    } else if (features.diasUltimaVisita > 60) {
      score += 25
    } else if (features.diasUltimaVisita > 30) {
      score += 10
    }

    // Tendência de declínio
    if (features.tendenciaDeclinio === 1) {
      score += 20
    }

    // Valor total comprado (clients que gastam pouco são mais propensos a churn)
    if (features.valorTotalComprado < 100) {
      score += 15
    } else if (features.valorTotalComprado < 500) {
      score += 5
    }

    // Idade do cadastro (clients novos podem ter maior churn)
    if (features.idadeCadastro < 30) {
      score += 10
    }

    // Frequência baixa
    if (features.frequenciaMensal < 1) {
      score += 15
    } else if (features.frequenciaMensal < 2) {
      score += 5
    }

    // Garantir score entre 0 e 100
    score = Math.min(100, Math.max(0, score))

    // Calculate probability (sigmoid-like transformation)
    const probability = 1 / (1 + Math.exp(-0.02 * (score - 50)))

    // Determine risk level
    let level: ChurnRiskLevel
    if (score <= 30) {
      level = "baixo"
    } else if (score <= 60) {
      level = "medio"
    } else if (score <= 80) {
      level = "alto"
    } else {
      level = "critico"
    }

    // Determine status
    let status: ChurnStatus
    if (score <= 30) {
      status = "ativo"
    } else if (score <= 60) {
      status = "em_risco"
    } else if (score <= 80) {
      status = "em_risco_alto"
    } else {
      status = "perdido"
    }

    return {
      score,
      probability,
      level,
      status,
    }
  }

  /**
   * Load ML model (placeholder for future implementation)
   */
  loadModel() {
    // Future implementation: Load XGBoost model from file
    // const model = await xgboost.Booster.load("data/models/churn_model.json")
    // return model
    return null
  }

  /**
   * Predict with ML model (placeholder for future implementation)
   */
  predictWithModel(features: ChurnFeatures): ChurnPredictionResult | null {
    // Future implementation: Use trained XGBoost model
    // const model = this.loadModel()
    // if (!model) return null
    // const dmatrix = xgboost.DMatrix([Object.values(features)])
    // const prediction = model.predict(dmatrix)
    // return {
    //   score: Math.round(prediction[0] * 100),
    //   probability: prediction[0],
    //   level: this.getRiskLevel(prediction[0]),
    //   status: this.getStatus(prediction[0]),
    // }
    return null
  }
}
