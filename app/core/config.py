from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Make .env values (like OPENAI_API_KEY) visible to os.getenv as well
load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()