from __future__ import annotations

from pydantic import BaseModel, Field, model_validator


class Scene(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    prompt: str = Field(min_length=1)
    duration_seconds: float = Field(gt=0)
    character_ids: list[str] = Field(default_factory=list)
    reference_asset_ids: list[str] = Field(default_factory=list)


class Project(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=200)
    scenes: list[Scene] = Field(default_factory=list)
    target_format: str = "mp4"

    @model_validator(mode="after")
    def unique_scene_ids(self) -> "Project":
        ids = [scene.id for scene in self.scenes]
        if len(ids) != len(set(ids)):
            raise ValueError("scene IDs must be unique within a project")
        return self

    @property
    def total_duration_seconds(self) -> float:
        return sum(scene.duration_seconds for scene in self.scenes)


class Capability(BaseModel):
    id: str
    name: str
    status: str
    note: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
