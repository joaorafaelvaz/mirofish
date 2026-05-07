# src/scheduler/cron.py
import croniter
from datetime import datetime, timedelta
from src.db.connector import MySQLPool


class ChurnScheduler:
    """Scheduler for automated churn processing."""

    def __init__(self, cron_expression: str = None):
        self.cron = croniter.croniter(
            cron_expression or "0 0 * * *",  # Default: daily at 00:00
            datetime.now()
        )

    def get_next_run(self) -> datetime:
        """Get next scheduled run time."""
        return self.cron.get_next(datetime)

    def is_time_to_run(self) -> bool:
        """Check if current time matches schedule."""
        next_run = self.get_next_run()
        now = datetime.now()
        return now >= next_run and now < next_run + timedelta(minutes=1)

    def run_scheduled(self):
        """Run scheduled processing for all units."""
        print(f"[SCHEDULER] Running scheduled job at {datetime.now()}")

        # Get all units from database
        units = MySQLPool.execute_query(
            "SELECT DISTINCT unitId FROM barbershop_clientes WHERE ativo = 1"
        )

        for unit in units:
            unit_id = unit['unitId']
            print(f"[SCHEDULER] Processing unit {unit_id}")
            # Import and call process_churn from main
            from src.main import process_churn
            # Note: In production, use background task

        print("[SCHEDULER] Job complete")


scheduler = ChurnScheduler()
