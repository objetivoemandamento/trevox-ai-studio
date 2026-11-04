from fastapi.testclient import TestClient

from trevox_api.main import app

client = TestClient(app)


def sample_project():
    return {
        "id": "demo",
        "title": "Aula demonstrativa",
        "scenes": [
            {"id": "scene-1", "prompt": "Plano geral da floresta", "duration_seconds": 60},
            {"id": "scene-2", "prompt": "Professor explica o tema", "duration_seconds": 90},
        ],
    }


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_capabilities_are_honest_about_unconnected_engines():
    response = client.get("/capabilities")
    assert response.status_code == 200
    capabilities = {item["id"]: item["status"] for item in response.json()}
    assert capabilities["script"] == "available"
    assert capabilities["video_generation"] == "not_connected"
    assert capabilities["render"] == "not_connected"


def test_cors_preflight_allows_local_frontend():
    response = client.options(
        "/projects/validate",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_project_duration_is_accumulated_without_fixed_limit():
    project = sample_project()
    project["scenes"] = [
        {"id": f"scene-{i}", "prompt": "Cena", "duration_seconds": 60}
        for i in range(120)
    ]
    response = client.post("/projects/validate", json=project)
    assert response.status_code == 200
    assert response.json()["scene_count"] == 120
    assert response.json()["total_duration_seconds"] == 7200


def test_duplicate_scene_ids_are_rejected():
    project = sample_project()
    project["scenes"][1]["id"] = project["scenes"][0]["id"]
    response = client.post("/projects/validate", json=project)
    assert response.status_code == 422


def test_invalid_duration_is_rejected():
    project = sample_project()
    project["scenes"][0]["duration_seconds"] = 0
    response = client.post("/projects/validate", json=project)
    assert response.status_code == 422


def test_non_finite_duration_is_rejected():
    project = sample_project()
    project["scenes"][0]["duration_seconds"] = float("inf")
    response = client.post("/projects/validate", json=project)
    assert response.status_code == 422


def test_empty_prompt_is_rejected():
    project = sample_project()
    project["scenes"][0]["prompt"] = ""
    response = client.post("/projects/validate", json=project)
    assert response.status_code == 422
