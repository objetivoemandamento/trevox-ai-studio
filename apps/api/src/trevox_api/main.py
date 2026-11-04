import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import Capability, HealthResponse, Project

app = FastAPI(
    title="TREVOX IA Studio API",
    version="0.1.1",
    description="API de projetos audiovisuais. Motores reais serão conectados por adaptadores.",
)

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
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


# OmniRoute is an optional, server-side gateway. Never expose its key to the browser.
import httpx
from fastapi import HTTPException, Request
from fastapi.responses import Response

OMNIROUTE_URL = os.getenv("OMNIROUTE_URL", "").rstrip("/")
OMNIROUTE_API_KEY = os.getenv("OMNIROUTE_API_KEY", "")

@app.get("/integrations/omniroute/status", tags=["integrations"])
def omniroute_status() -> dict[str, object]:
    configured = bool(OMNIROUTE_URL and OMNIROUTE_API_KEY)
    return {
        "configured": configured,
        "provider": "OmniRoute",
        "base_url": OMNIROUTE_URL if configured else None,
        "status": "configured" if configured else "not_configured",
        "note": (
            "Gateway configurado. A disponibilidade de cada provedor depende das credenciais conectadas no OmniRoute."
            if configured else
            "Configure OMNIROUTE_URL e OMNIROUTE_API_KEY no ambiente seguro da API TREVOX."
        ),
    }


_ALLOWED_OMNIROUTE_PATHS = {
    "models", "chat/completions", "responses", "images/generations",
    "images/edits", "videos/generations", "music/generations",
    "audio/speech", "audio/transcriptions", "embeddings",
}


@app.post("/integrations/omniroute/{endpoint:path}", tags=["integrations"])
async def omniroute_proxy(endpoint: str, request: Request) -> Response:
    if not OMNIROUTE_URL or not OMNIROUTE_API_KEY:
        raise HTTPException(status_code=503, detail="OmniRoute não está configurado no servidor TREVOX.")
    normalized = endpoint.strip("/")
    if normalized not in _ALLOWED_OMNIROUTE_PATHS:
        raise HTTPException(status_code=404, detail="Endpoint de IA não permitido.")
    body = await request.body()
    headers = {
        "Authorization": f"Bearer {OMNIROUTE_API_KEY}",
        "Content-Type": request.headers.get("content-type", "application/json"),
    }
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=15.0)) as client:
            upstream = await client.post(
                f"{OMNIROUTE_URL}/v1/{normalized}",
                content=body,
                headers=headers,
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="Tempo limite excedido ao consultar OmniRoute.") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Não foi possível conectar ao OmniRoute.") from exc
    content_type = upstream.headers.get("content-type", "application/json")
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        media_type=content_type.split(";")[0],
    )
