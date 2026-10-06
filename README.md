# KluZTD

나만의 할 일 관리. **로컬 전용** — 데이터는 이 폴더의 JSON 파일 하나에만 저장된다.

화면 넷, 자유공간은 어디서나. **체크리스트 한 줄 = 상태 관리 카드 하나 = 같은 할 일** — 어디서 바꾸든 모두에 반영된다.

| | 하는 일 |
|---|---|
| **일일 관리** | 날짜별 체크리스트. 적으면 상태 관리 «진행 예정»에도 생기고, 체크하면 «진행 완료». 줄 옆에서 **마감·담당자·프로젝트**, «자세히»에서 메모·이슈. 못 끝낸 건 «오늘로 가져오기»/«다음 날로 미루기», «체크리스트에서 빼기»(상태 관리엔 남음). 아래는 그날 **이슈** — 아무 할 일에나 연결할 수 있고, 연결하면 그 할 일 상세·카드·프로젝트에도 같은 이슈로 보인다(상세에서 적은 이슈도 오늘 이슈 칸에 보임). 줄의 이슈 아이콘은 연결된 이슈로 이동·강조만 한다(새로 만들기는 줄 메뉴 «이슈 기록»). 오른쪽(모바일은 위)에 **빨간 알림**: 마감 3일 안(또는 지남)인데 체크리스트에 없는 할 일 → «오늘에 넣기». |
| **상태 관리** | 칸반 — 진행 예정 · 진행 중 · 진행 완료 · 대기, 드래그 앤 드롭. 상세의 «체크리스트» 날짜를 정하면 그날 체크리스트로. 프로젝트로 필터. |
| **달력** | 한 달 전체 — 날짜마다 체크리스트(진행 1/3), 이날 마감(점선), 미해결 이슈, 그날 완료한 일. 고른 날에 할 일 추가 → 그날 체크리스트 + 상태 관리. 끌어서 다른 날로. |
| **프로젝트** | 프로젝트마다 **Next Action**(마감일 가까운 순)과 **한 일**(완료·시작·이슈 타임라인). 할 일 상세의 «프로젝트»에 이름을 적고 Enter 로 바로 만들기. |
| **자유공간** | 어느 화면에서나 오른쪽 **책갈피**(모바일은 상단 바 아이콘, 단축키 `M`). |

- **삭제는 바로 지운다** (확인 창 없음, 몇 초간 «되돌리기»만). 다른 탭·기기의 오래된 사본이 되살리지 않도록 지운 id 만 30일 남긴다.
- 화면 이름은 `src/constants/nav.ts`, 임박 기준(3일)은 `src/utils/task.ts` 의 `URGENT_DAYS`.

### 메모·이슈 에디터 (노션식)

- 마크다운 단축 입력: `#` `##` `###` 제목 · `-` 목록 · `1.` 번호 · `[ ]` 체크리스트 · `>` 인용 · ` ``` ` 또는 `</>` 코드 블록 · `!>` 콜아웃 · `---` 구분선 · `**굵게**` `` `코드` `` `==형광펜==`
- `/` 블록 메뉴: 텍스트, 제목 1–3, 목록, 번호 목록, 체크리스트, **표**, **코드**, **콜아웃**, 인용, 구분선 — 한글 초성 검색 가능 (`/ㅍ` → 표)
- **떠 있는 서식 막대**: 일일 관리·상세·자유공간을 쓰는 동안 화면 아래에 계속 떠 있다 — 제목, 굵게/기울임…, 목록, 체크리스트, 인용, 코드, 콜아웃, 표, 구분선, **수식**. 마지막으로 쓴 메모에 적용, 손잡이로 끌어 옮기기(두 번 누르면 제자리), 접기. 모바일은 입력 중에만 키보드 위에.
- **수식 (KaTeX)**: `$$x^2$$` 문장 안 수식, `$$$x^2$$$` 수식 블록, `/수식`, 막대의 Σ — 누르면 LaTeX 편집 창(미리보기)
- 글자 선택 → 서식 막대(굵게·기울임·밑줄·취소선·코드·형광펜·링크), 표 안 → 행/열 추가·삭제 막대
- 코드 블록: 언어 선택 + 색 구분 + 복사 / 콜아웃: 아이콘을 누르면 종류(메모·정보·주의·완료·위험) 변경

### 모션

모든 반응은 **0.5~1.0초, `ease`** — 화면 전환(떠오르기), 날짜·달·칸 이동(좌우로 밀려 들어오기), 자유공간·상세·목록·달력·토스트·서식 막대는 나올 때와 들어갈 때 모두, 체크리스트 줄·이슈는 추가되면 떠오르고 지우면 접히며 사라짐, 누르는 모든 것에 눌림 효과, 드래그 이동·놓기, 라이트↔다크 전환.
값은 `src/styles/theme-utilities.css` 의 `--kz-dur`(0.5s)·`--kz-dur-md`(0.6s)·`--kz-ease` 와 `src/lib/motion.ts` 에서 바꾼다. OS 의 '동작 줄이기'를 켜면 꺼진다.

### 단축키

`N` 할 일 추가 · `1`–`4` 화면 이동 · `M` 자유공간 · `/` 상태 관리 검색 · `Esc` 닫기 · 카드에서 `Enter` 열기, `Space` 집어서 화살표로 옮기기 (한글 입력 상태에서도 동작)

## 실행

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

또는 `KluZTD.command` 더블클릭 → 빌드 후 http://localhost:4273 (PWA 설치 가능 — 주소창의 설치 버튼).

### 휴대폰에서 쓰기

```bash
pnpm dev:lan      # 같은 와이파이의 휴대폰에서 http://<맥 IP>:5173
```

- 데이터 API 가 네트워크에 열리므로 **집/개인망에서만** 쓴다.
- 휴대폰 홈 화면 설치(PWA)·오프라인 캐시는 브라우저 정책상 **HTTPS 에서만** 된다 (localhost 는 예외). LAN 의 `http://` 로는 웹으로만 쓰인다.
- 서버에 못 닿으면 그 기기에 보관했다가 다시 연결되면 자동으로 합쳐서 저장한다.

## 데이터

```
data/kluztd.json          ← 전부 여기 (git 에 안 올라감)
data/backups/             ← 하루 한 번 자동 백업, 최근 14개
```

- 저장: 바뀌면 0.6초 뒤 자동. 왼쪽 아래(모바일은 위) 점이 초록이면 저장됨, 주황이면 이 기기에만 보관 중.
- **여러 탭/기기 동시 사용 OK**: 서버가 버전(rev)을 확인해서 먼저 저장된 게 있으면 할 일 단위로 병합한다(이슈는 개별 병합). 다른 탭에서 바꾸면 실시간(SSE)으로 반영된다.

## 로고·아이콘 바꾸기

1. `public/logo.svg` 를 새 로고로 교체 (앱 안의 로고·파비콘은 이 파일을 쓴다)
2. `pnpm icons` → `public/icons/` 의 PWA 아이콘 PNG 를 다시 만든다
   (직접 만든 PNG 를 쓰려면 `icon-192.png`, `icon-512.png`, `maskable-512.png`(여백 12%), `apple-touch-icon.png`(180), `favicon-32.png` 를 같은 이름으로 덮어쓰면 된다)

## 테스트

```bash
pnpm test:e2e     # Playwright — 데스크톱 + 모바일(Pixel 7), 실제 데이터 대신 e2e/.data/ 사용
```

`e2e/ux.spec.ts` 는 화면 캡처를 `e2e/.shots/` 에 남긴다 (라이트/다크, 데스크톱/모바일).

## 구조

```
src/
├── index.tsx                 # 테마 → 동기화 시작 → 라우터
├── api/                      # command.ts(GET/PUT/SSE), client.ts(fetch 래퍼), errors, types
├── lib/sync.ts               # 캐시 ↔ 서버 저장·충돌 병합·실시간 반영
├── lib/feedback.ts           # 이동/삭제 알림 토스트
├── stores/                   # taskStore(데이터·동작), syncStore, uiStore(필터), themeStore, toastStore, dialogStore
├── types/task.ts             # Task, Issue, Status …
├── constants/                # status.ts(상태 칸 순서·라벨), nav.ts(화면 이름)
├── utils/                    # date, merge(병합·삭제 기록), order, task(정규화·이전·필터·임박), calendar(날짜별 요약), project(Next Action·한 일), issues(이슈 색인), doc
├── pages/                    # daily(일일 관리) / status(상태 관리) / calendar(달력) / projects(프로젝트)
├── components/
│   ├── board/                # Board, useBoardDnd, dnd(충돌 판정), BoardColumn, TaskCard, MobileTab, StatusSummary, BoardFilters
│   ├── daily/                # DayNav, DayChecklist, DayTaskRow, DayDueSection, DayIssues, UrgentPanel(빨간 알림)
│   ├── projects/             # ProjectList, ProjectDetail
│   ├── calendar/             # DayCell, ScheduleChip(끌어서 날짜 변경), DayDetail
│   ├── task/                 # 상세 패널, IssueList(공용 이슈 목록), IssueLog(할 일에 연결된 이슈), 속성 컨트롤
│   ├── editor/               # NoteEditor(TipTap), 떠 있는 서식 막대, 수식(KaTeX), 슬래시 메뉴, 콜아웃, 코드 블록
│   ├── layout/               # AppShell(사이드바·하단 메뉴), ScratchPanel(자유공간 책갈피), SyncBadge, ThemeSwitch
│   └── ui/                   # Select, DatePicker, Combobox, Popover(모바일은 아래 시트), Button, Badges, Toaster …
└── styles/                   # light/dark 토큰, editor.css, 스크롤바·애니메이션
vite.kluztd-data.ts           # 로컬 데이터 API (dev/preview 서버에 붙음)
```

- **화면 이름** → `src/constants/nav.ts` · **상태 칸 순서·이름** → `src/constants/status.ts`
- **색** → `src/styles/light-theme.css` / `dark-theme.css` (같은 토큰 이름)
- 개발 규칙은 `CLAUDE.md`
