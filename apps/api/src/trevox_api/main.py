from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import Capability, HealthResponse, Project

app = FastAPI(
    title="TREVOX IA Studio API",
    version="0.1.0",
    description="API de projetos audiovisuais. Motores reais serão conectados por adaptadores.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="trevox-ai-api", version=app.version)


@app.get("/capabilities", response_model=list[Capability], tags=["system"])
def capabilities() -> list[Capability]:
    return [
        Capability(id="script", name="Estrutura de projeto e cenas", status="available",
                   note="Validação de dados disponível na API."),
        Capability(id="video_generation", name="Geração de vídeo", status="not_connected",
                   note="Nenhum worker/modelo de vídeo conectado nesta versão."),
        Capability(id="voice", name="Síntese de voz", status="not_connected",
                   note="Nenhum motor TTS conectado nesta versão."),
        Capability(id="lip_sync", name="Sincronização labial", status="not_connected",
                   note="Nenhum motor de lip-sync conectado nesta versão."),
        Capability(id="render", name="Renderização MP4", status="not_connected",
                   note="FFmpeg ainda não está integrado ao pipeline."),
    ]


@app.post("/projects/validate", tags=["projects"])
def validate_project(project: Project) -> dict[str, object]:
    return {
        "valid": True,
        "project_id": project.id,
        "scene_count": len(project.scenes),
        "total_duration_seconds": project.total_duration_seconds,
        "total_duration_minutes": round(project.total_duration_seconds / 60, 3),
        "message": "Projeto validado. Nenhuma geração de mídia foi iniciada.",
    }
