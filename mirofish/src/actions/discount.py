# src/actions/discount.py
import random
from datetime import datetime, timedelta


class DiscountGenerator:
    """Generate personalized discount offers based on customer profile."""

    @staticmethod
    def generate_discount_code(customer_id: int, level: str) -> dict:
        """Generate discount code and offer details."""

        # Base discount by risk level
        discount_by_level = {
            'medio': 10,
            'alto': 15,
            'critico': 25
        }

        base_discount = discount_by_level.get(level, 10)

        # Add randomness (±5%)
        actual_discount = base_discount + random.randint(-5, 5)
        actual_discount = max(5, min(30, actual_discount))  # Clamp 5-30%

        # Generate code
        timestamp = datetime.now().strftime('%Y%m%d')
        code = f"RET{timestamp}{customer_id:05d}"

        return {
            'code': code,
            'discount': actual_discount,
            'level': level,
            'expiry_days': 7,
            'message': f"Oferta exclusiva: {actual_discount}% de desconto em sua próxima compra!"
        }


discount_gen = DiscountGenerator()
