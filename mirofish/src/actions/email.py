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
