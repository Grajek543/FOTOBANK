# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Przykładowa wartość, np. MySQL uruchomione na localhost
DATABASE_URL = "mysql+pymysql://testuser:testpass@127.0.0.1:3307/fotobank_test"


engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
