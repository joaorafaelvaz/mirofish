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

    def get_risk_level(self, proba: float) -> tuple:
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


# Global instance
predictor = ChurnPredictor()
