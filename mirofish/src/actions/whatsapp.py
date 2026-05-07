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
