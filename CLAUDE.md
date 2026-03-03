# CLAUDE.md

## 프로젝트 개요

OpenPerso - 누구나 AI 캐릭터를 만들고, 대화하고, 공유하는 오픈소스 플랫폼.
Character.AI 유사 서비스로, 텍스트→음성→아바타 멀티모달 지원을 목표로 함.

## 모노레포 구조

```
openperso/
├── backend/       # FastAPI + Python 3.12
├── frontend/      # Next.js 16 + TypeScript + Tailwind + shadcn/ui
├── nginx/         # Nginx reverse proxy 설정
├── docs/          # 기획 문서
└── docker-compose.yml
```

## 빌드 및 실행

```bash
# 인프라 서비스 실행 (PostgreSQL, Redis, MinIO)
docker-compose up -d

# 백엔드 개발 모드
cd backend && uv sync && PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8200

# 프론트엔드 개발 모드
cd frontend && npm install && npm run dev -- -p 3200

# DB 마이그레이션
cd backend && uv run alembic upgrade head
```

## 기술 스택

- **Backend**: FastAPI, SQLAlchemy 2.0 (async), Alembic, Redis
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **DB**: PostgreSQL 16 + pgvector
- **스토리지**: MinIO (로컬) → S3 (운영)
- **LLM**: OpenAI 호환 API (메인: 고품질 / 보조: 저렴한 모델)

## 주요 규칙

- 백엔드는 전면 async/await 사용
- API는 `/api/v1/` 접두사 사용
- DB 모델 변경 시 반드시 Alembic 마이그레이션 생성
- 환경 변수는 `.env` 파일로 관리, 절대 커밋 금지
- 프론트엔드 컴포넌트는 shadcn/ui 기반으로 통일
- LLM 호출은 반드시 services/llm.py 추상화 레이어를 통해
- 코드 스타일: backend은 ruff, frontend은 eslint + prettier

## 상세 기획

`docs/PLANNING.md` 참조
