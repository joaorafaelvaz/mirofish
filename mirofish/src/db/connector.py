# src/db/connector.py
import pymysql
from pymysql.cursors import DictCursor
from src.config import settings
import threading


class MySQLPool:
    _local = threading.local()
    _pool = []

    @classmethod
    def get_connection(cls):
        if not hasattr(cls._local, 'connection') or not cls._local.connection:
            cls._local.connection = cls._create_connection()
        return cls._local.connection

    @classmethod
    def _create_connection(cls):
        return pymysql.connect(
            host=settings.MYSQL_HOST,
            port=settings.MYSQL_PORT,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            database=settings.MYSQL_DATABASE,
            cursorclass=DictCursor,
            autocommit=True
        )

    @classmethod
    def close_connection(cls):
        if hasattr(cls._local, 'connection') and cls._local.connection:
            cls._local.connection.close()
            cls._local.connection = None

    @classmethod
    def execute_query(cls, query, params=None):
        conn = cls.get_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()

    @classmethod
    def execute_query_one(cls, query, params=None):
        conn = cls.get_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchone()
