from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        extra="ignore",
        populate_by_name=True,
        protected_namespaces=("settings_",),
    )

    host: str = Field(default="0.0.0.0", alias="ROCKFALL_HOST")
    port: int = Field(default=8000, alias="ROCKFALL_PORT")
    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="ROCKFALL_CORS_ORIGINS",
    )
    log_level: str = Field(default="INFO", alias="ROCKFALL_LOG_LEVEL")
    artifact_path: str = Field(default="ml/models/rockfall_pipeline.joblib", alias="MODEL_PATH")

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def resolved_model_path(self) -> Path:
        path = Path(self.artifact_path)
        if not path.is_absolute():
            path = PROJECT_ROOT / path
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()
