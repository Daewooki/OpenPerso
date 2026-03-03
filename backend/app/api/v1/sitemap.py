from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.persona import Persona

router = APIRouter(tags=["sitemap"])


@router.get("/sitemap.xml")
async def sitemap(db: AsyncSession = Depends(get_db)):
    # Build base URL
    host = settings.backend_public_url or "http://localhost:3100"
    # Use frontend URL for sitemap
    base = host.replace(":8200", ":3100")  # frontend port

    result = await db.execute(
        select(Persona.id, Persona.updated_at)
        .where(Persona.visibility == "public")
        .order_by(Persona.updated_at.desc())
    )
    personas = result.all()

    urls = [
        f'<url><loc>{base}/explore</loc><priority>1.0</priority></url>',
        f'<url><loc>{base}/pricing</loc><priority>0.5</priority></url>',
        f'<url><loc>{base}/terms</loc><priority>0.3</priority></url>',
        f'<url><loc>{base}/privacy</loc><priority>0.3</priority></url>',
    ]

    for pid, updated in personas:
        urls.append(
            f'<url><loc>{base}/persona/{pid}</loc><lastmod>{updated.isoformat()[:10]}</lastmod><priority>0.8</priority></url>'
        )

    xml = '<?xml version="1.0" encoding="UTF-8"?>'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    xml += "".join(urls)
    xml += "</urlset>"

    return Response(content=xml, media_type="application/xml")
