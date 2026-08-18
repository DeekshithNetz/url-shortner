
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db
from models import URL, User
from schemas import (
    URLCreate,
    URLResponse,
    URLListResponse,
    GoogleLoginRequest,
    TokenResponse,
    UserResponse,
)
from utils import encode_base62
from redis_client import redis_client
from auth import (
    verify_google_token,
    create_access_token,
    get_current_user,
)

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_url = URL(
        original_url=str(data.url),
        short_code="",
        user_id=current_user.id,
    )

    db.add(new_url)

    db.flush()

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
@router.get(
    "",
    response_model=list[URLListResponse],
)
def get_my_urls(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    urls = (
        db.query(URL)
        .filter(URL.user_id == current_user.id)
        .order_by(URL.created_at.desc())
        .all()
    )

    result = []

    for url in urls:
        pending_clicks = redis_client.get(
            f"clicks:{url.short_code}"
        )

        pending_clicks = int(
            pending_clicks or 0
        )

        result.append(
            URLListResponse(
                id=url.id,
                original_url=url.original_url,
                short_code=url.short_code,
                short_url=f"{SHORT_URL_BASE}/{url.short_code}",
                click_count=(
                    url.click_count +
                    pending_clicks
                ),
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

@router.post(
    "/auth/google",
    response_model=TokenResponse,
)
def google_login(
    data: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    google_user = verify_google_token(
        data.credential
    )

    google_id = google_user["sub"]
    email = google_user.get("email")
    name = google_user.get("name")
    picture = google_user.get("picture")

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Google account email not available",
        )

    # Find by Google ID
    user = (
        db.query(User)
        .filter(User.google_id == google_id)
        .first()
    )

    # If not found, try email
    if not user:
        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

    # Existing user
    if user:
        user.google_id = google_id
        user.name = name
        user.profile_picture = picture

    # New user
    else:
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            profile_picture=picture,
        )

        db.add(user)

    db.commit()
    db.refresh(user)

    access_token = create_access_token(
        user.id
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            profile_picture=user.profile_picture,
        ),
    )