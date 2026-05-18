# Card 컴포넌트 QA — Figma vs 구현

> Last updated: 2026-05-17
> Figma file: `kffOnFVN7j3nAdHugX9rHa/Components`
> 대상: `src/components/preview/Card.tsx` 의 5종 카드 변형

---

## 디자인 시안 매핑

| Variant | Figma node | minWidth | 비고 |
|---|---|---|---|
| `imgcard` (bgfullimg) | `1:132` (`dim`) | 240px | dim overlay 단독 노드. imgcard 전체 시안은 별도 노드 필요 |
| `imgcard` (leading-asset) | `1:49` (`graphiccard`) | 240px | 구 stepcard. imgcard 의 cardType 토글로 통합 |
| `reviewcard` | `1:82` (`reviewcard`) | 254px | |
| `tablecard` | `2:166` (`table`) | 199px | 변형 1row/2row, color grey/blue/green |
| `listcard` | — | 320px | 디자인 시안 미제공 |

링크는 `Card.stories.tsx` 의 `parameters.design` 에 등록되어 있다. Figma 임베드 패널을 보려면 `@storybook/addon-designs` 설치 필요.

```bash
pnpm add -D @storybook/addon-designs
# .storybook/main.ts 의 addons 에 "@storybook/addon-designs" 추가
```

---

## 1. imgcard — `1:132` (dim overlay 참조)

Figma 노드는 dim overlay 단독. imgcard 본체 시안이 별도로 없어 dim 만 비교 가능.

### 디자인 스펙 (dim)

- gradient: `linear-gradient(to bottom, rgba(0,0,0,0.1) 32.222%, rgba(0,0,0,0.5) 100%)`
- 즉 상단 32% 는 완전 투명, 32% 지점부터 0.1 opacity 검정 시작 → 100% 지점에서 0.5 opacity

### 현재 구현 (Card.tsx:448)

```tsx
<div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />
```

→ 0% 부터 0.1 opacity 가 시작됨.

### Diff

| 항목 | Figma | 구현 | 결과 |
|---|---|---|---|
| gradient 시작 stop | 32.222% | 0% | ❌ |
| 시작 opacity | 0.1 | 0.1 | ✅ |
| 끝 opacity | 0.5 | 0.5 | ✅ |

### 수정 항목

- gradient 의 시작 stop 을 `32%` 로 조정. Tailwind 로 표현 시: `from-[32%] from-black/10 to-black/50`.

### 의문점

- imgcard 전체 시안 (배경 이미지 위 dim + 텍스트 오버레이) 의 Figma 노드 ID 추가 필요. 현재 dim 만으로는 카드 자체의 패딩·타이포·media 비율을 검증 불가.

---

## 2. reviewcard — `1:82`

### 디자인 스펙

- 컨테이너: `bg-white p-[16px] rounded-[12px] w-[286px]` — **width 고정**, 높이 가변
- contents: `flex flex-col gap-[20px] w-full`
- product (title + media): `flex gap-[12px] items-start justify-center`
- title block: `flex-1 gap-[6px] items-center justify-center` — **세로 가운데 정렬**
  - title: Body16 SemiBold 16/20 -0.3, line-clamp-2 형태
  - sub (meta): Detail12 Medium 12/16, `whitespace-nowrap`
    - 모든 항목 사이 `·` 구분자 (#c1c1c1)
    - 값 텍스트는 #8c8c8c
- media: `size-[48px] rounded-[10px]` + overlay `bg-[rgba(0,0,0,0.05)]`
- body: Body14 Regular 14/20 -0.3, **line-clamp 미명시** (디자인 노트: 5줄까지 노출 후 ellipsis)
- **rating 슬롯 없음**

### 현재 구현 (Card.tsx:483–568)

- 컨테이너: `h-[200px] w-full p-4 rounded-ods-12 bg-white`
- title block: `items-start` (세로 위 정렬)
- meta 구분자: 중간은 `·`, 마지막 항목은 `|`
- body: `line-clamp-3`
- rating 슬롯 활성화 (`asRating` 호출, 채워지면 별점 노출)

### Diff

| 항목 | Figma | 구현 | 결과 |
|---|---|---|---|
| width | 286px 고정 | `w-full` | ⚠ 의도적 차이 가능 (반응형) |
| height | 콘텐츠 가변 | **`h-[200px]` 고정** | ❌ |
| title block 세로 정렬 | center | start | ❌ |
| meta 구분자 마지막 | `·` | **`\|`** | ❌ |
| body line-clamp | 5줄 | **3줄** | ❌ |
| rating | 없음 | 옵셔널 (채워지면 노출) | ⚠ 데이터 의존 |
| gap | 20px | 20px (`gap-5`) | ✅ |
| padding | 16px | 16px (`p-4`) | ✅ |
| 타이포 | Body16/Detail12/Body14 | Body16/Detail12/Body14 | ✅ |

### 수정 항목

1. **height 고정 해제** (`h-[200px]` 제거). 콘텐츠 기반 가변 + 캐러셀 행간 정렬 다른 방식으로 (`items-stretch` on parent 등).
2. title block `items-start` → `items-center`.
3. meta 구분자 통일: 모든 사이 `·`. `|` 분기 제거 (`Card.tsx:495–496, 532`).
4. body `line-clamp-3` → `line-clamp-5`.
5. rating 노출 정책 확정 — 디자인에 없으므로 default 미노출이 안전. fixture 에서 `rating` 슬롯 비움.

### 의문점

- Figma `w-[286px]` 가 sm 기준인지 lg 기준인지 명시 없음. 캐러셀 카드 폭이 cardWidth.{mobile,tablet,desktop} 으로 가변되는 것과 어떻게 정합할지 확정 필요.
- height 가변 시 캐러셀 안에서 카드별 높이가 달라질 수 있음 — `align-items: stretch` 로 가장 긴 카드에 맞출지, 시각적 정렬을 위해 max-height 를 둘지 디자인 결정 필요.

---

## 3. stepcard — `1:49` (graphiccard)

### 디자인 스펙

- 컨테이너: `min-w-[240px] max-w-[320px] w-[240px]`, `px-[20px] py-[30px]`, `rounded-[12px]`
- 배경: `linear-gradient(171.626deg, rgba(239,239,239,0.2) 1.59%, rgba(139,195,235,0.2) 92.35%), #F5F5F5`
- 정렬: `flex flex-col items-start justify-end` — **좌측 정렬, 아래 정렬**
- img 영역: `flex items-start justify-center pb-[20px] w-full`
  - 내부 asset: `size-[251.5px]` (251.5×251.5 정사각, padding 10px)
  - 옵션: Motion Badge 표시 가능
- text block: `flex flex-col gap-[4px] items-start w-full`
  - 좌측 라운드 `rounded-bl-[8px] rounded-tl-[8px]`
  - title: Heading20 SemiBold 20/28 -0.3 opacity-80, `text-ellipsis` (1줄)
  - body: Body15 Regular 15/24 -0.3 opacity-80, `text-ellipsis whitespace-pre-wrap`
  - **title 안에 stepNumber 텍스트로 포함** (예: "1.상담 신청")

### 현재 구현 (Card.tsx:578–635)

- 컨테이너: `h-[260px] w-full px-5 pb-5 rounded-ods-12` — **세로 패딩 비대칭** (top 없음)
- 정렬: `items-center justify-between` — **중앙·양끝 정렬**
- img 영역: `max-w-[240px] pt-2`, 내부 `h-[160px] w-full overflow-hidden`
  - asset: `object-contain` (✅)
- text block: `gap-1 items-start` (gap=4px ≈ ✅, items-start ✅ 단 그 위 컨테이너가 center)
  - 좌측 라운드 **누락**
- stepNumber 처리: `displayTitle = stepNumber ? "{n}. {title}" : title` — 디자인과 동일한 결과

### Diff

| 항목 | Figma | 구현 | 결과 |
|---|---|---|---|
| width | 240px 고정 (min 240 / max 320) | `w-full` | ⚠ 그리드 셀 폭 따라감 (의도) |
| height | 콘텐츠 가변 | **`h-[260px]` 고정** | ❌ |
| 컨테이너 padding | `px-[20px] py-[30px]` | `px-5 pb-5` (top 누락) | ❌ |
| 컨테이너 정렬 | items-start, justify-end | items-center, justify-between | ❌ |
| img 영역 비율 | 251.5×251.5 정사각 | 160 (높이 고정) × 100% | ❌ |
| img 영역 padding | `pb-[20px]` | `pt-2` | ❌ |
| asset object-fit | (정사각 비율 유지) | `object-contain` | ✅ |
| text 좌측 라운드 | `rounded-l-[8px]` | 없음 | ❌ |
| title typography | Heading20 SemiBold 20/28 | text-[20px] semibold leading-7 | ✅ |
| title overflow | `text-ellipsis` (자동 wrap) | `whitespace-nowrap text-ellipsis` | ⚠ (nowrap 차이) |
| title opacity | 80% | 80% | ✅ |
| body typography | Body15 Regular 15/24 | text-[15px] regular leading-6 | ✅ |
| body wrap | `whitespace-pre-wrap` | `whitespace-pre-line line-clamp-2` | ❌ |
| body opacity | 80% | 80% | ✅ |
| Motion Badge | 옵셔널 노출 가능 | 미지원 | ❌ (slot 부재) |

### 수정 항목

1. **세로 정렬 반전**: `items-center justify-between` → `items-start justify-end`. 텍스트 블록이 카드 하단에 붙어야 한다.
2. **컨테이너 패딩**: `py-[30px] px-[20px]`. (현재 `pt` 누락)
3. **img 영역**: 정사각 비율 박스 (예: `aspect-square`) + `pb-[20px]`. 현재의 `h-[160px]` 고정은 디자인 비율 위반.
4. **height 고정 해제**: `h-[260px]` 제거.
5. **text 블록 좌측 라운드** 추가 `rounded-bl-[8px] rounded-tl-[8px]`.
6. **title wrap 정책**: `whitespace-nowrap` 제거 (디자인은 ellipsis 만, wrap 허용). nowrap 이면 긴 step 타이틀이 ellipsis 만으로 잘림.
7. **body `whitespace-pre-line` → `pre-wrap`** + line-clamp 정책 디자인 컨펌 필요 (Figma 는 line-clamp 미지정).
8. **Motion Badge 슬롯** 추가 — 디자인은 옵셔널 노출. schema 에 `motionBadge` 슬롯 또는 `media.kind="animated"` 분기 필요.

### 의문점

- Figma 의 `w-[240px]` 고정 vs 현재의 `w-full` (grid 셀 폭 따라감) — 그리드 컬럼 수에 따라 카드 폭이 크게 달라짐. 디자인은 240–320 범위만 의도. **그리드 셀의 max-width 제한 정책 필요**.
- `pt-2` 의 출처가 불명 (디자인엔 없음). 의도된 fine-tuning 인지 잔재인지 컨펌.

---

## 4. tablecard — `1:1694`

### 디자인 스펙

- 컨테이너: `h-[372px] w-[199px] rounded-[8px] overflow-clip` — 가로 좁고 세로 김
- title bar: `bg-[#e0e0e0] h-[40px] flex items-center justify-center`
  - Heading17 SemiBold 17/22 -0.3 center
- row 컨테이너: `bg-[#f5f5f5] pb-[8px] px-[12px]`
- 각 row: `h-[64px] flex flex-col items-center justify-center`
  - Body16 Medium 16/20 -0.3 center
  - row 사이 `Divider` (`bg-#ededed h-px`)
- **row 5개 고정** (디자인상)

### 현재 구현 (Card.tsx:333–334)

```tsx
case "tablecard":
  return <CardContentsCell cell={cell} onRequestSlotEdit={slotEdit("media")} />;
```

→ `imgcard` 의 `CardContentsCell` 을 그대로 재사용. **디자인과 전혀 다른 컴포넌트가 렌더됨**.

### Diff

| 항목 | Figma | 구현 | 결과 |
|---|---|---|---|
| 전용 렌더러 | tablecard 전용 | imgcard 재사용 | ❌ **컴포넌트 누락** |
| 타이틀 바 | `bg-#e0e0e0 h-[40px]` Heading17 | 없음 (imgcard 의 dim 위 텍스트) | ❌ |
| row 컨테이너 | `bg-#f5f5f5 px-[12px] pb-[8px]` | 없음 | ❌ |
| 각 row | `h-[64px]` Body16 Medium center + Divider | meta 렌더 안 됨 | ❌ |
| width | 199px 고정 | imgcard width 따라감 | ❌ |
| height | 372px 고정 | imgcard `aspect-[3/4]` | ❌ |

### 수정 항목

이번 라운드 작업의 **최우선 수정**. 별도 `CardTableCell` 컴포넌트 신설 필요.

스펙:

```
- container: aspect 무시 + h-[372px] (디자인) or 콘텐츠 가변 (권장)
- title bar: bg-#e0e0e0 h-[40px] text-center Heading17 SemiBold
  - 소스: cell.slots.title
- rows: cell.slots.meta.items 를 2개씩 묶어 (label, value) 처리 OR meta.items 를 그대로 row 리스트로
  - row: h-[64px] Body16 Medium #141414 center
  - 사이 Divider
- (선택) footer/cta: cell.slots.cta — 디자인엔 없으나 슬롯 정의에 있으므로 결정 필요
```

### 의문점

- 디자인은 row 5개 고정. cell.slots.meta.items 가 짝수개 (label·value 쌍) 또는 N 개 (단순 텍스트 리스트) 인지 데이터 모델 결정 필요. 현재 schema 는 `meta.items: string[]` 단순 배열 — 디자인의 row 라벨 구조와 1:1 매핑 안 됨.
- cta 슬롯이 디자인에 없음. v1 에서 cta 노출 여부 결정 필요.
- title bar 의 `#e0e0e0` 는 토큰 미정. ODS 토큰 매핑 필요 (`backgroundDisabled` 또는 신규 토큰).
- 카드 폭 `199px` 가 sm 기준인지 — 그리드 안에서 데스크탑 컬럼 폭과 다름. 디자인 측 responsive 스펙 필요.

---

## 5. listcard — 디자인 시안 미제공

`Card.tsx:645–692` 의 `ListCell` 만 존재. 디자인 PR 으로 Figma 노드 추가되면:

1. 본 문서에 매핑 항목 추가
2. `Card.stories.tsx` `ListcardList.parameters.design.url` 채우기
3. 비교 QA 수행

---

## 글로벌 (모든 변형 공통)

### Responsive 스펙 부재
- Figma 시안이 단일 사이즈만 제공. mobile/tablet/desktop 별 동작이 디자인에 없음.
- 현재 코드는 `viewport === "mobile"` 기반 분기를 사용 (예: listcard 1↔2 col, imgcard grid 2col 고정).
- **디자인 측에서 각 카드의 sm/md/lg 시안 또는 responsive rule 명시 필요.**

### 토큰 정합
- 색: `#e0e0e0`, `#f5f5f5`, `#ededed`, `#8c8c8c`, `#c1c1c1` 등 Figma 변수명이 `backgroundDisabled` / `foregroundWeak` 등으로 노출되지만 코드는 일부 하드코딩 (예: tablecard 의 `#c1c1c1`). ODS 토큰 카탈로그(`src/schema/ods-tokens.ts`)에 매핑 후 Tailwind class 로 통일.
- 폰트: Pretendard 4 사이즈(13/14/15/16/17/20) 사용 중. 모두 ODS typography 토큰화 가능. Tailwind 의 `text-[15px]` 하드코딩 → `text-ods-body15` 토큰 클래스로.

### 라운드
- Figma: 8px / 10px / 12px 혼용. ODS radius 토큰(`rounded-ods-8/10/12`) 과 정합 확인 — 코드는 일부 `rounded-[10px]` 하드코딩 (reviewcard avatar) 존재.

### 접근성
- 모든 카드의 ARIA role · alt 누락 점검 필요. `reviewcard` 의 `role="img"` 별점만 명시. tablecard 는 `role="table"` 적용 검토.

### Responsive 정책 연계
- 카드 컴포넌트는 [CONVENTIONS §11](./CONVENTIONS.md) 의 **min-width + 자동 폴백** 규칙을 따른다. 각 variant 가 `minWidth` 를 선언하고, 슬롯의 컨테이너 폭이 이 값 아래로 떨어지면 grid → carousel → list 순으로 자동 전환된다. 디자이너는 fix-width 가 아닌 minWidth 만 명시한다.

---

## 우선순위 요약 (수정 권고)

| 우선순위 | 항목 |
|---|---|
| P0 | **tablecard 전용 렌더러 신설** (현재 imgcard 재사용 — 디자인과 전혀 다름) |
| P0 | tablecard 의 cell.meta 구조 결정 (label·value 쌍 vs 단순 리스트) |
| P1 | reviewcard height 고정 해제 + meta 구분자 통일 + body line-clamp 5 |
| P1 | stepcard 정렬 반전 (items-start justify-end) + 컨테이너 padding 균등화 |
| P1 | imgcard dim gradient stop (0% → 32%) |
| P2 | Figma 측 imgcard·listcard 시안 추가 요청 |
| P2 | 모든 변형의 responsive 스펙 (sm/md/lg) 디자인 추가 요청 |
| P3 | 토큰 하드코딩 → ODS 토큰 클래스로 통일 |
| P3 | `@storybook/addon-designs` 설치 + main.ts addons 등록 |
