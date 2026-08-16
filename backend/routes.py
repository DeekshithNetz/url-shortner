import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from redis_client import redis_client
from database import get_db
from models import URL
from schemas import URLCreate, URLResponse,URLListResponse
from utils import encode_base62
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
router = APIRouter(
    prefix="/api/urls",
    tags=["URLs"],
)
redirect_router = APIRouter()
internal_router = APIRouter(
    prefix="/internal",
    tags=["Internal"],
)

API_BASE_URL = os.getenv(
    "API_BASE_URL",
    "http://127.0.0.1:8000",
)

SHORT_URL_BASE = os.getenv(
    "SHORT_URL_BASE",
    "http://localhost:5173",
)


@router.post(
    "",
    response_model=URLResponse,
)
def create_short_url(
    data: URLCreate,
    db: Session = Depends(get_db),
):
    print("added")
    new_url = URL(
        original_url=str(data.url),
        short_code="",
    )

    db.add(new_url)

    # Get the database-generated ID
    db.flush()

    # Convert database ID to Base62
    new_url.short_code = encode_base62(new_url.id)

    db.commit()
    db.refresh(new_url)

    return URLResponse(
        original_url=new_url.original_url,
        short_code=new_url.short_code,
        short_url=f"{SHORT_URL_BASE}/{new_url.short_code}",
    )





@redirect_router.get("/{short_code}")
def redirect_to_original(
    short_code: str,
    db: Session = Depends(get_db),
):
    print("done")
    # 1. Check Redis for the original URL
    original_url = redis_client.get(f"url:{short_code}")

    # 2. Redis miss → get from PostgreSQL
    if original_url is None:
        url = (
            db.query(URL)
            .filter(URL.short_code == short_code)
            .first()
        )

        if url is None:
            raise HTTPException(
                status_code=404,
                detail="Short URL not found",
            )

        original_url = url.original_url

        # Cache the URL in Redis
        redis_client.set(
            f"url:{short_code}",
            original_url,
        )

    # 3. Increment click count in Redis
    redis_client.incr(f"clicks:{short_code}")

    # 4. Redirect
    return RedirectResponse(
        url=original_url,
        status_code=307,
    )
@router.get("", response_model=list[URLListResponse])
def get_all_urls(
    db: Session = Depends(get_db),
):
    urls = (
        db.query(URL)
        .order_by(URL.created_at.desc())
        .all()
    )

    result = []

    for url in urls:
        pending_clicks = redis_client.get(
            f"clicks:{url.short_code}"
        )

        pending_clicks = int(pending_clicks or 0)

        result.append(
            URLListResponse(
                id=url.id,
                original_url=url.original_url,
                short_code=url.short_code,
                short_url=f"{SHORT_URL_BASE}/{url.short_code}",
                click_count=url.click_count + pending_clicks,
                created_at=url.created_at,
            )
        )

    return result

@internal_router.post("/sync-clicks")
def sync_clicks(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    cron_secret = os.getenv("CRON_SECRET")

    if credentials.credentials != cron_secret:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )

    keys = redis_client.keys("clicks:*")

    synced = 0

    for key in keys:
        short_code = key.split("clicks:", 1)[1]

        count = redis_client.get(key)

        if not count:
            continue

        count = int(count)

        if count <= 0:
            continue

        url = (
            db.query(URL)
            .filter(URL.short_code == short_code)
            .first()
        )

        if not url:
            continue

        url.click_count += count
        redis_client.delete(key)

        synced += count

    db.commit()

    return {
        "message": "Click counts synchronized successfully",
        "synced_clicks": synced,
    }