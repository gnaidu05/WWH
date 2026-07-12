"""YouTube upload via the Data API v3 using an OAuth refresh token.

One-time setup (see README):
  1. Create a Google Cloud project, enable "YouTube Data API v3".
  2. Create OAuth client credentials (Desktop app).
  3. Run `python -m pipeline.upload --authorize` locally once to mint a
     refresh token, then store YT_CLIENT_ID / YT_CLIENT_SECRET /
     YT_REFRESH_TOKEN as GitHub Actions secrets.
"""
import argparse
from pathlib import Path

from .config import env

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def _credentials():
    from google.oauth2.credentials import Credentials

    client_id = env("YT_CLIENT_ID")
    client_secret = env("YT_CLIENT_SECRET")
    refresh_token = env("YT_REFRESH_TOKEN")
    if not all([client_id, client_secret, refresh_token]):
        raise RuntimeError(
            "Missing YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN — "
            "run with --no-upload or configure the secrets."
        )
    return Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES,
    )


def upload_video(video_path: Path, meta: dict) -> str:
    """Upload and return the YouTube video id."""
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    youtube = build("youtube", "v3", credentials=_credentials())
    body = {
        "snippet": {
            "title": meta["title"],
            "description": meta["description"],
            "tags": meta["tags"],
            "categoryId": meta["category_id"],
        },
        "status": {
            "privacyStatus": meta["privacy"],
            "selfDeclaredMadeForKids": meta["made_for_kids"],
        },
    }
    media = MediaFileUpload(str(video_path), chunksize=8 * 1024 * 1024,
                            resumable=True, mimetype="video/mp4")
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
    response = None
    while response is None:
        _, response = request.next_chunk()
    return response["id"]


def authorize_interactive() -> None:
    """Local one-time flow to obtain a refresh token."""
    from google_auth_oauthlib.flow import InstalledAppFlow

    client_id = env("YT_CLIENT_ID")
    client_secret = env("YT_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise SystemExit("Set YT_CLIENT_ID and YT_CLIENT_SECRET env vars first.")
    flow = InstalledAppFlow.from_client_config(
        {"installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }},
        scopes=SCOPES,
    )
    creds = flow.run_local_server(port=0, access_type="offline", prompt="consent")
    print("\nYT_REFRESH_TOKEN =", creds.refresh_token)
    print("Store it as a GitHub Actions secret — it is shown only once.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--authorize", action="store_true",
                        help="run the one-time local OAuth flow")
    args = parser.parse_args()
    if args.authorize:
        authorize_interactive()
