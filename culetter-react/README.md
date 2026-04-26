# 큐레터 (Culetter) — React 버전

기존 `culetter_standalone.html` 프로토타입을 **React + TypeScript + Vite** 로 이식한 버전입니다.

## 실행 방법

### 1. Node.js 설치 확인
Node 18 이상 필요. 터미널에서:
```bash
node -v
```
설치되어 있지 않으면 [nodejs.org](https://nodejs.org) 에서 LTS 설치.

### 2. 의존성 설치
프로젝트 폴더에서:
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저가 자동으로 `http://localhost:5173` 을 열어줍니다.

### 4. 프로덕션 빌드 (선택)
```bash
npm run build    # dist/ 폴더에 정적 파일 생성
npm run preview  # 빌드 결과 로컬 미리보기
```

---

## 프로젝트 구조
```
culetter-react/
├─ public/
│  ├─ fonts/             메모먼트 꾹꾹체 (.ttf + .otf)
│  └─ images/            편지지 6종
├─ src/
│  ├─ main.tsx           React 엔트리
│  ├─ App.tsx            라우트 정의
│  ├─ data.ts            편지지 카탈로그 + 로고/아바타 SVG
│  ├─ styles/
│  │  └─ global.css      기존 HTML 스타일 이식 (단일 파일)
│  ├─ hooks/
│  │  ├─ useToast.tsx    토스트 컨텍스트
│  │  └─ useDraft.ts     (기능 잠금 상태. 나중에 임시저장 오픈 시 사용)
│  ├─ components/
│  │  ├─ Header.tsx      공용 헤더 (로고, 오른쪽 액션)
│  │  └─ LoadingOverlay.tsx  봉인 애니메이션 오버레이
│  └─ pages/
│     ├─ Home.tsx        홈 (3D 캐러셀)
│     ├─ Login.tsx       로그인
│     ├─ Select.tsx      편지지 선택 (카테고리 필터)
│     ├─ Write.tsx       편지 작성 (To/본문/From)
│     ├─ Send.tsx        링크 생성 / 공유
│     ├─ Profile.tsx     내 정보
│     └─ Read.tsx        편지 수신 (봉투 오픈)
├─ index.html            Vite 엔트리 HTML
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

## 기존 HTML과의 차이
| 항목 | HTML | React |
|---|---|---|
| 페이지 전환 | `go('pageId')` + display 토글 | React Router (`/`, `/login`, …) |
| 상태 관리 | 전역 DOM + localStorage | useState, useContext, sessionStorage |
| 토스트 | 싱글 전역 `showToast()` | `useToast()` 훅 |
| 편지지 카탈로그 | 마크업에 하드코딩 | `src/data.ts` 배열에서 렌더 |
| 애니메이션 | CSS 키프레임 + inline JS | 동일 CSS (global.css) + React useEffect |

## 주요 라우트
| URL | 화면 |
|---|---|
| `/` | 홈 (편지지 캐러셀) |
| `/login` | 로그인 |
| `/select` | 편지지 선택 |
| `/write` | 편지 작성 |
| `/send?t=xxx` | 링크 생성 / 공유 |
| `/profile` | 내 정보 |
| `/letter/:token` 또는 `/read` | 편지 수신 (봉투 오픈) |

## 백엔드 연동
`API.md` (프로젝트 루트 참조) 에 정의된 REST API 엔드포인트에 맞춰 `fetch`/`axios` 호출로 교체하면 됩니다.

---

## 편지지 상품화 비율
모든 편지지는 **A5 (148×210mm, 1 : 1.414)** 비율로 고정되어 있습니다. 새 편지지 이미지를 추가할 때도 같은 비율로 만들면 이후 실제 인쇄 상품 연결 시 바로 활용 가능합니다.
