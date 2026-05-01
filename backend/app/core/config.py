from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost/factory_db"
    SECRET_KEY: str = "change-this-to-a-very-long-random-secret-key-123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720

    class Config:
        env_file = ".env"

settings = Settings()
