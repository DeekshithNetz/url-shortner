from datetime import datetime

from pydantic import BaseModel, HttpUrl


class URLCreate(BaseModel):
    url: HttpUrl


class URLResponse(BaseModel):
    original_url: str
    short_code: str
    short_url: str


class URLListResponse(BaseModel):
    id: int
    original_url: str
    short_code: str
    short_url: str
    click_count: int
    created_at: datetime


class GoogleLoginRequest(BaseModel):
    credential: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str | None = None
    profile_picture: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse