from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from db import get_user_client
from auth_utils import require_user_id

router = APIRouter()


class ProductDefaults(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    core_value_proposition: Optional[str] = None
    pricing: Optional[str] = None
    key_differentiators: Optional[str] = None
    known_objections: Optional[str] = None


def _get_token(authorization: str) -> str:
    return (authorization or "").replace("Bearer ", "")


@router.get("/product-defaults")
async def get_product_defaults(authorization: str = Header("")):
    user_id = await require_user_id(authorization)
    db = get_user_client(_get_token(authorization))
    try:
        result = db.table("profiles").select(
            "product_name, category, core_value_proposition, pricing, key_differentiators, known_objections"
        ).eq("id", user_id).single().execute()
        return result.data or {}
    except Exception:
        return {}


@router.put("/product-defaults")
async def update_product_defaults(body: ProductDefaults, authorization: str = Header("")):
    user_id = await require_user_id(authorization)
    db = get_user_client(_get_token(authorization))
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        result = db.table("profiles").update(data).eq("id", user_id).execute()
        return result.data[0] if result.data else data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save defaults: {str(e)}")
