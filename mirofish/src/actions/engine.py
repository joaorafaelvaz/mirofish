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
