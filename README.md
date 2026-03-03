# OpenPerso

**Open-source AI character chat platform** — Create, share, and chat with AI characters.

[한국어](#한국어) | [English](#english)

---

## 한국어

### OpenPerso란?

누구나 AI 캐릭터를 만들고, 대화하고, 공유할 수 있는 오픈소스 플랫폼입니다.

- AI 캐릭터를 이름과 한 줄 설명만으로 원클릭 생성
- 텍스트 채팅 + 음성 대화 (TTS) 지원
- 대화 중 이미지 자동 생성
- 사용자별 기억(메모리) 시스템
- 30+ 시드 캐릭터 제공 (유명인, K-콘텐츠, 게임, 힐링 등)
- 게스트 3턴 무료 체험
- PWA 지원 (모바일 홈 화면 추가)

### 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | FastAPI, SQLAlchemy 2.0 (async), Alembic |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Database | PostgreSQL 16 + pgvector |
| Cache | Redis |
| Storage | MinIO (S3 호환) |
| LLM | OpenAI 호환 API |
| Auth | JWT (이메일/비밀번호, Google OAuth) |

### 빠른 시작

#### 사전 요구사항

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (Python 패키지 매니저)

#### 1. 레포 클론 & 환경 설정

```bash
git clone https://github.com/Daewooki/OpenPerso.git
cd OpenPerso

cp .env.example .env
# .env 파일을 열어 API 키 등을 설정하세요
```

#### 2. 인프라 서비스 실행

```bash
docker-compose up -d
# PostgreSQL, Redis, MinIO가 실행됩니다
```

#### 3. 백엔드 실행

```bash
cd backend
uv sync
PYTHONPATH=. uv run alembic upgrade head   # DB 마이그레이션
PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8200
```

#### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev -- -p 3200
```

`http://localhost:3200`에서 서비스를 확인하세요.

#### 5. (선택) 시드 데이터

```bash
cd backend
PYTHONPATH=. .venv/bin/python scripts/seed_personas.py
```

### 프로젝트 구조

```
openperso/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # API 엔드포인트
│   │   ├── models/         # SQLAlchemy 모델
│   │   ├── schemas/        # Pydantic 스키마
│   │   ├── services/       # 비즈니스 로직
│   │   └── workers/        # 백그라운드 작업
│   ├── alembic/            # DB 마이그레이션
│   └── scripts/            # 유틸리티 스크립트
├── frontend/
│   └── src/
│       ├── app/            # Next.js App Router 페이지
│       ├── components/     # React 컴포넌트
│       ├── hooks/          # Custom hooks
│       ├── lib/            # 유틸리티
│       └── types/          # TypeScript 타입
├── nginx/                  # Reverse proxy 설정
├── docker-compose.yml      # 인프라 서비스
└── docker-compose.prod.yml # 프로덕션 배포
```

### 환경 변수

`.env.example` 파일을 참고하여 `.env`를 설정하세요.

> **주의**: 기본값은 로컬 개발용입니다. 프로덕션 배포 시 반드시 모든 비밀번호와 시크릿 키를 변경하세요.

| 변수 | 설명 | 필수 |
|------|------|------|
| `LLM_API_KEY` | OpenAI API 키 | Yes |
| `SECRET_KEY` | JWT 시크릿 키 | Yes (프로덕션) |
| `POSTGRES_PASSWORD` | DB 비밀번호 | Yes (프로덕션) |

### 스크린샷

> 곧 추가 예정

---

## English

### What is OpenPerso?

An open-source platform where anyone can create, share, and chat with AI characters.

- One-click character creation from just a name and description
- Text chat + voice conversation (TTS)
- In-chat image generation
- Per-user memory system
- 30+ seed characters (celebrities, K-content, games, healing, etc.)
- 3-turn guest trial without sign-up
- PWA support

### Quick Start

```bash
git clone https://github.com/Daewooki/OpenPerso.git
cd OpenPerso
cp .env.example .env
# Edit .env with your API keys

# Infrastructure
docker-compose up -d

# Backend
cd backend && uv sync
PYTHONPATH=. uv run alembic upgrade head
PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8200

# Frontend (in another terminal)
cd frontend && npm install && npm run dev -- -p 3200
```

Visit `http://localhost:3200`.

### Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### License

This project is licensed under the [MIT License](LICENSE).

---

Built with FastAPI, Next.js, and OpenAI API.
