from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import get_provider, set_provider

router = APIRouter()


class ProviderOut(BaseModel):
    provider: str


class ProviderIn(BaseModel):
    provider: str


@router.get("/config/provider", response_model=ProviderOut)
async def get_current_provider():
    return {"provider": get_provider()}


@router.post("/config/provider", response_model=ProviderOut)
async def update_provider(body: ProviderIn):
    try:
        set_provider(body.provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"provider": get_provider()}
