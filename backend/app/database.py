
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


DATABASE_URL = "mysql+pymysql://testuser:testpass@127.0.0.1:3307/fotobank_test"


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ⇩  TO JEST KLUCZOWE  ⇩
def get_db():
    """Zależność FastAPI zwracająca sesję bazy."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()