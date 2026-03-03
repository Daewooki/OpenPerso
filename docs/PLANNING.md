# AI Persona Platform - 기획 문서

## 제품 정의

| 항목 | 내용 |
|------|------|
| **제품명** | AI Persona Platform (가칭) |
| **한 줄 설명** | 누구나 AI 페르소나를 만들고, 대화하고, 공유하는 플랫폼 |
| **타겟** | 전체 사용자 (진입장벽 최소화) |
| **핵심 차별점** | 멀티모달 (텍스트→음성→아바타), 강력한 메모리, 쉬운 페르소나 구축 |
| **보조 차별점** | 한국어 특화, 크리에이터 이코노미, 깊은 커스터마이징 |
| **수익 모델** | Freemium (무료 텍스트 챗 + 유료 음성/고급 기능) - 상세는 개발 후 |

---

## Phase 1 MVP 기능 범위

| 기능 | 포함 여부 |
|------|----------|
| 이메일/비번 회원가입·로그인 | O |
| Google OAuth | O |
| 페르소나 생성 (간편 + 고급) | O |
| AI 자동 페르소나 구축 (웹 검색) | O |
| 텍스트 채팅 (SSE 스트리밍) | O |
| 대화 이력 관리 | O |
| 메모리 시스템 (전역 + 페르소나별) | O |
| 탐색/검색/카테고리/인기 랭킹 | O |
| 좋아요 | O |
| 사용자 프로필 | O |
| 음성 채팅 | X (Phase 2) |
| 아바타 | X (Phase 3) |
| 결제/구독 | X (Phase 4) |
| 크리에이터 대시보드 | X (Phase 4) |

---

## 기술 스택

| 계층 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | FastAPI + Python 3.12 + async |
| ORM | SQLAlchemy 2.0 (async) + Alembic |
| DB | PostgreSQL 16 + pgvector |
| 캐시/큐 | Redis |
| 비동기 작업 | Celery |
| 인증 | NextAuth.js (프론트) + JWT (백엔드) |
| 스토리지 | MinIO (로컬) → S3 (운영) |
| LLM (메인) | 고품질 모델 (OpenAI 호환 API) |
| LLM (보조) | 저렴한 모델 (요약, 메모리 추출, 페르소나 생성) |
| 인프라 | Docker Compose → K8s |

---

## 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Persona  │  │ Chat     │  │ Explore/          │  │
│  │ Builder  │  │ Interface│  │ Marketplace       │  │
│  │ Studio   │  │ (Multi)  │  │                   │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└───────────────────────┬─────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │   API Gateway     │
              │   (Auth + Rate)   │
              └─────────┬─────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
┌───▼────┐      ┌──────▼──────┐     ┌──────▼──────┐
│Persona │      │ Conversation│     │  Social     │
│Service │      │ Service     │     │  Service    │
│        │      │             │     │             │
│- CRUD  │      │- Text Chat  │     │- 공유/탐색  │
│- 자동구축│      │- Voice Chat │     │- 좋아요/팔로│
│- RAG   │      │- Memory     │     │- 랭킹      │
│- 평가   │      │- Streaming  │     │- 리뷰      │
└───┬────┘      └──────┬──────┘     └──────┬──────┘
    │                  │                   │
    └──────────┬───────┴───────────────────┘
               │
    ┌──────────▼──────────┐
    │   Shared Services   │
    │                     │
    │ - PostgreSQL (메타)  │
    │ - pgvector (벡터)    │
    │ - Redis (캐시/큐)    │
    │ - MinIO (파일)      │
    │ - Celery (비동기)    │
    └─────────────────────┘
```

---

## 페르소나 생성 흐름

### 간편 모드 (3단계)

1. **기본 정보 입력**: 이름(필수), 한 줄 소개(선택), 카테고리 선택
2. **AI 자동 생성**: 이름 + 카테고리 기반으로 성격, 말투, 배경, 인사말, 시스템 프롬프트 자동 생성. 실존 인물은 웹 검색 반영
3. **확인 & 수정**: AI 결과 검토, 부분 수정, 아바타 업로드/AI 생성, 테스트 대화, 공개 설정

### 고급 모드 (크리에이터용)

간편 모드의 모든 항목 + 시스템 프롬프트 직접 편집, 성격 슬라이더 + 자유 텍스트, 말투 세부 설정, 금지 주제 설정

### 카테고리

- 유명인 / 역사적 인물
- 애니·만화·게임 캐릭터
- 나만의 캐릭터
- 도우미 (학습, 상담, 코칭)
- 친구 / 롤플레이

### 실존 인물 정책

생성 허용, 공개 시 면책 문구 표시

---

## LLM 프롬프트 구조

```
System Prompt:
  [1] 플랫폼 기본 규칙 (~500 토큰, 고정)
      - 역할 수행 지침, 안전 가이드라인, 응답 형식 규칙
  [2] 페르소나 정의 (~1,500 토큰, 고정)
      - 이름, 배경, 성격 특성 (슬라이더→텍스트), 말투, 추가 설명, 금지사항
  [3] 사용자 메모리 (~1,000 토큰, 가변, 최대 10개)
      - 전역 메모리 + 페르소나별 메모리 (pgvector 유사도 검색)
  [4] 대화 가이드 (~500 토큰)
      - 첫 대화: 인사말 / 이어서 대화: 이전 대화 요약

Messages:
  [5] 대화 이력 (~8,000 토큰, 가변)
      - 최근 대화 턴 (초과 시 요약 대체)
  [6] 현재 사용자 입력 (~500 토큰)
```

### 모델 분리

| 용도 | 모델 등급 |
|------|----------|
| 메인 대화 | 고품질 (GPT-4o, Claude 등) |
| 대화 요약, 메모리 추출, 페르소나 자동 생성 | 저렴 (GPT-4o-mini 등) |

---

## 메모리 시스템

### 메모리 계층

| 구분 | 범위 | 내용 |
|------|------|------|
| 세션 컨텍스트 | 현재 대화 (휘발) | 최근 N턴 대화 이력 |
| 전역 메모리 | 모든 페르소나 공유 (영구) | 이름, 나이, 직업 등 기본 사실 |
| 페르소나별 메모리 | 해당 페르소나만 (영구) | 관계, 개인적 이야기, 대화 맥락 |
| 대화 요약 | 해당 페르소나만 (영구) | 과거 대화 세션별 요약문 |

### 추출 전략 (하이브리드)

**실시간 (규칙 기반, 비용 ~0)**:
- 패턴 매칭으로 명시적 사실 추출 ("내 이름은 X", "나 X살", "X 좋아해")
- 즉시 DB 저장, 같은 대화 내에서 바로 반영

**비동기 (대화 종료 후, 저렴한 LLM)**:
- 대화 전체 요약 생성
- 암시적 정보 추출 (취향, 감정 패턴)
- 관계 변화 감지 (말투 변화, 별명 등)

### 메모리 관리

- 사용자에게 저장된 메모리 목록 열람/삭제 기능 제공
- 충돌 시 최신 값으로 업데이트 (updated_at 갱신)

---

## 대화 컨텍스트 관리

### 세션 생명주기

1. **시작**: [대화하기] 클릭 또는 [새 대화] → greeting_message로 시작
2. **진행**: 브라우저 닫아도 세션 유지, 재접속 시 이어서 표시
3. **종료 트리거**:
   - 명시적: 사용자가 [새 대화] 시작
   - 암묵적: 3시간 무응답 후 새 메시지 → "이어하기/새 대화" 선택지

### 종료 시 처리 (Celery 비동기)

- 대화 요약 생성 (저렴한 LLM)
- 메모리 추출 (사실, 관계)
- 대화 제목 자동 생성

### 컨텍스트 윈도우 관리

- 전체 토큰 버짓: ~12,000 토큰 (보수적 운용)
- 대화 이력 8,000 토큰 초과 시:
  1. 최근 6턴 무조건 유지
  2. 나머지 오래된 메시지 제거
  3. 제거된 부분을 2~3줄 요약으로 대체 (저렴한 LLM 실시간 처리)
  4. 요약 + 최근 6턴 합쳐서 전송

### "이어하기" vs "새 대화"

| | 이어하기 | 새 대화 |
|---|---------|--------|
| 메시지 이력 | 기존 대화에 이어서 추가 | 빈 상태에서 시작 |
| 컨텍스트 | 기존 턴들이 그대로 | greeting + 이전 대화 요약 |
| 메모리 추출 | 안 함 (진행 중) | 이전 대화에서 추출 완료 후 반영 |

---

## DB 스키마

### users
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| email | VARCHAR | UNIQUE |
| password_hash | VARCHAR | nullable (OAuth 사용자) |
| name | VARCHAR | 표시 이름 |
| avatar_url | VARCHAR | 프로필 이미지 |
| provider | VARCHAR | local, google |
| provider_id | VARCHAR | OAuth provider ID |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### personas
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| creator_id | UUID | FK → users |
| name | VARCHAR | 페르소나 이름 |
| tagline | VARCHAR | 한 줄 소개 |
| description | TEXT | 상세 설명 |
| avatar_url | VARCHAR | |
| system_prompt | TEXT | LLM 시스템 프롬프트 |
| greeting_message | TEXT | 첫 인사 메시지 |
| personality | JSONB | 성격 슬라이더 값 + 자유 텍스트 |
| voice_config | JSONB | 음성 설정 (Phase 2) |
| visibility | VARCHAR | public, private, unlisted |
| category | VARCHAR | |
| tags | JSONB | 태그 배열 |
| chat_count | INTEGER | 대화 수 |
| like_count | INTEGER | 좋아요 수 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### conversations
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| persona_id | UUID | FK → personas |
| title | VARCHAR | 자동 생성 |
| summary | TEXT | 대화 요약 (비동기 생성) |
| last_message_at | TIMESTAMP | |
| created_at | TIMESTAMP | |

### messages
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| conversation_id | UUID | FK → conversations |
| role | VARCHAR | user, assistant, system |
| content | TEXT | |
| created_at | TIMESTAMP | |

### user_global_memories
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| fact | TEXT | 기억 내용 |
| category | VARCHAR | name, age, job, preference 등 |
| embedding | VECTOR(1536) | pgvector |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### user_persona_memories
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | FK → users |
| persona_id | UUID | FK → personas |
| fact | TEXT | 기억 내용 |
| memory_type | VARCHAR | relationship, personal, emotional |
| embedding | VECTOR(1536) | pgvector |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### persona_likes
| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | UUID | FK → users |
| persona_id | UUID | FK → personas |
| created_at | TIMESTAMP | |
| PK | (user_id, persona_id) | 복합 키 |

---

## API 엔드포인트

### 인증
| Method | Path | 설명 |
|--------|------|------|
| POST | /api/v1/auth/register | 이메일 회원가입 |
| POST | /api/v1/auth/login | 로그인 → JWT |
| POST | /api/v1/auth/google | Google OAuth 콜백 |
| GET | /api/v1/auth/me | 내 정보 조회 |

### 페르소나
| Method | Path | 설명 |
|--------|------|------|
| POST | /api/v1/personas | 생성 |
| GET | /api/v1/personas/{id} | 상세 조회 |
| PUT | /api/v1/personas/{id} | 수정 |
| DELETE | /api/v1/personas/{id} | 삭제 |
| POST | /api/v1/personas/{id}/like | 좋아요 토글 |
| POST | /api/v1/personas/generate | AI 자동 생성 |

### 탐색
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/v1/explore | 인기/최신/카테고리 |
| GET | /api/v1/explore/search?q= | 검색 |

### 대화
| Method | Path | 설명 |
|--------|------|------|
| POST | /api/v1/chat/conversations | 대화 시작 |
| GET | /api/v1/chat/conversations | 내 대화 목록 |
| GET | /api/v1/chat/conversations/{id} | 대화 이력 |
| POST | /api/v1/chat/conversations/{id}/messages | 메시지 전송 (SSE) |
| DELETE | /api/v1/chat/conversations/{id} | 대화 삭제 |

### 프로필
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/v1/users/me/personas | 내 페르소나 목록 |
| PUT | /api/v1/users/me | 프로필 수정 |

### 메모리
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/v1/memories/global | 전역 메모리 목록 |
| DELETE | /api/v1/memories/global/{id} | 전역 메모리 삭제 |
| GET | /api/v1/memories/personas/{id} | 페르소나별 메모리 목록 |
| DELETE | /api/v1/memories/personas/{id}/{memoryId} | 페르소나별 메모리 삭제 |

---

## 페이지 구조

```
/ (랜딩 페이지)
├── /login (로그인)
├── /register (회원가입)
├── /explore (메인 - 탐색)
│   └── 검색, 카테고리 필터, 인기 랭킹
├── /persona/[id] (페르소나 상세)
│   └── 설명, 좋아요, [대화 시작]
├── /create (페르소나 생성)
│   └── 스텝 폼 + 미리보기
├── /chat/[id] (채팅)
│   └── 스트리밍 텍스트 챗 + 사이드바(대화 목록)
└── /profile (내 프로필)
    ├── 내 페르소나 관리
    ├── 메모리 관리
    └── 설정
```

---

## Docker Compose 구성

| 서비스 | 이미지 | 포트 |
|--------|--------|------|
| frontend | Next.js | 3000 |
| backend | FastAPI | 8000 |
| celery-worker | Celery | - |
| postgres | PostgreSQL 16 + pgvector | 5432 |
| redis | Redis | 6379 |
| minio | MinIO | 9000/9001 |
| nginx | Nginx | 80 |

---

## 로드맵

| Phase | 범위 | 상태 |
|-------|------|------|
| **Phase 1** | 인증 + 페르소나 CRUD + 텍스트 챗 + 메모리 + 탐색 | 진행 중 |
| **Phase 2** | 음성 채팅 (ASR + TTS) | 예정 |
| **Phase 3** | 아바타 (A2B + 3D 렌더링) | 예정 |
| **Phase 4** | 결제/구독 + 크리에이터 대시보드 | 예정 |
