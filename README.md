# KluZTD

나만의 GTD. **로컬 전용** — 정통 GTD를 그대로 따르지 않고 필요한 만큼만 쓴다.

## 데이터 저장 위치 (고정)

```
KluZTD/data/kluztd.json
```

절대 경로: `/Users/kluz/KluZTD/data/kluztd.json`

항목·프로젝트가 이 JSON 파일에 저장됩니다.
`pnpm dev` / `KluZTD.command`(preview) 실행 시에만 파일 읽기·쓰기가 됩니다.

## 실행

```bash
pnpm install
pnpm dev          # http://localhost:5273
```

또는 `KluZTD.command` 더블클릭 → `pnpm build` 후 preview (http://localhost:4273).

## 스택

- React + Vite + TypeScript
- Zustand
- Tailwind CSS v4 (색상 토큰은 eduFlow와 동일)
- 데이터: `data/kluztd.json` (Vite 로컬 API)

## 현재 구조

```
src/
├── index.tsx                  # 엔트리: 파일 hydrate → AppRouter
├── index.css                  # Tailwind + 테마 import + @theme 매핑
├── api/kluztdData.ts          # GET/PUT /api/kluztd
├── components/
│   ├── gtd/                   # QuickCapture, ItemRow, ListPanel
│   ├── layout/Sidebar.tsx     # 리스트 내비 + 저장경로 + 테마/Export/Import
│   └── ui/                    # Button, BrandLogo
├── constants/lists.ts         # 리스트 정의 (여기만 고치면 내비가 바뀜)
├── pages/home/index.tsx
├── routes/routes.tsx
├── stores/
│   ├── gtdStore.ts            # 항목·프로젝트 + 400ms 디바운스 자동 저장
│   └── themeStore.ts          # 라이트/다크
├── styles/                    # light-theme / dark-theme / theme-utilities
├── types/gtd.ts               # Item, Project, ListId
└── utils/                     # date, item
```

## 바꿀 때 어디를 건드리면 되는지

- **리스트 추가/삭제/이름 변경** → `src/constants/lists.ts` (`LISTS`)
- **항목 필드 추가** → `src/types/gtd.ts` + `src/utils/item.ts`(`createEmptyItem`) + `ItemRow`
- **실행 상황 태그** → `src/constants/lists.ts` (`CONTEXTS`)
- **색상** → `src/styles/light-theme.css` / `dark-theme.css` (둘 다 같은 토큰명)

개발 규칙은 `CLAUDE.md` 참고 (eduFlow 에이전트 가이드 그대로).
