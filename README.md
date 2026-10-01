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
pnpm dev          # http://localhost:5173
```

또는 `KluZTD.command` 더블클릭 → `pnpm build` 후 preview (http://localhost:4273).

## 스택

- React + Vite + TypeScript
- Zustand
- Tailwind CSS v4 (색상 토큰은 eduFlow와 동일)
- 데이터: `data/kluztd.json` (Vite 로컬 API)

## 쓰는 흐름

1. **수집** — 위쪽 입력창에 아무거나 던져 넣으면 «수집함»에 쌓인다.
2. **정리** — 항목의 «정리»를 눌러 펼치면 메모·실행 상황·날짜·대기 대상·프로젝트를 붙일 수 있다.
3. **분류** — 행 오른쪽 선택으로 «다음 행동»·«대기»·«일정»·«언젠가»·«참고»로 옮긴다.
4. **프로젝트** — 두 단계 이상 걸리는 일은 좌측 «프로젝트 + 새로»로 묶는다. 프로젝트 화면에서 원하는 결과·상태를 적고, 그 프로젝트의 다음 행동을 바로 추가한다.

편집은 모두 즉시 반영되고 400ms 뒤 `data/kluztd.json`에 자동 저장된다.

## 현재 구조

```
src/
├── index.tsx                  # 엔트리: 파일 hydrate → AppRouter
├── index.css                  # Tailwind + 테마 import + @theme 매핑
├── api/kluztdData.ts          # GET/PUT /api/kluztd
├── components/
│   ├── gtd/                   # QuickCapture, ItemRow, ItemDetail, ListPanel, ProjectPanel
│   ├── layout/Sidebar.tsx     # 리스트 내비 + 저장경로 + 테마/Export/Import
│   └── ui/                    # Button, BrandLogo
├── constants/lists.ts         # 리스트 정의 (여기만 고치면 내비가 바뀜)
├── pages/home/index.tsx
├── routes/routes.tsx
├── stores/
│   ├── gtdStore.ts            # 항목·프로젝트 + 리스트/프로젝트 뷰 + 400ms 디바운스 자동 저장
│   └── themeStore.ts          # 라이트/다크
├── styles/                    # light-theme / dark-theme / theme-utilities
├── types/gtd.ts               # Item, Project, ListId
└── utils/                     # date, item
```

## 바꿀 때 어디를 건드리면 되는지

- **리스트 추가/삭제/이름 변경** → `src/constants/lists.ts` (`LISTS`)
- **항목 필드 추가** → `src/types/gtd.ts` + `src/utils/item.ts`(`createEmptyItem`) + `ItemRow`
- **실행 상황 태그** → `src/constants/lists.ts` (`CONTEXTS`)
- **항목 편집 필드** → `src/components/gtd/ItemDetail.tsx`
- **프로젝트 화면** → `src/components/gtd/ProjectPanel.tsx`
- **색상** → `src/styles/light-theme.css` / `dark-theme.css` (둘 다 같은 토큰명)

개발 규칙은 `CLAUDE.md` 참고 (eduFlow 에이전트 가이드 그대로).

## 알아 둘 것

- 저장은 **마지막에 쓴 쪽이 이긴다**. 같은 파일을 보는 탭을 여러 개 띄우면 오래된 탭이 나중에 저장하면서 최신 내용을 덮어쓸 수 있다 — 한 번에 한 탭만 쓴다.
- `pnpm dev`는 브라우저를 자동으로 연다 (`vite.config.ts`의 `server.open`).
- 프로젝트 화면을 보고 있는지 여부는 저장하지 않는다. 새로고침하면 마지막 리스트로 돌아온다.
