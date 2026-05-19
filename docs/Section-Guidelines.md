# LandingPage Builder v2 섹션 디자인 구현 가이드라인

---

## 0. Claude Code용 Notion DB → HTML 변환 계약

### 0-1. 목적

이 문서는 Claude Code가 Notion DB의 섹션별 콘텐츠를 읽고, 오늘의집 랜딩페이지 스타일의 **단일 HTML 프리뷰 페이지**를 반환하기 위한 데이터 계약이다.

| 항목 | 규칙 |
|------|------|
| 입력 | Notion `Landing Pages DB`, `Page Sections DB`, 반복 콘텐츠 DB(card/table/review/process/cross-sell/faq/form) |
| 출력 | 완성된 HTML 문자열. `<!doctype html>`, `<html lang="ko">`, `<head>`, `<style>`, `<body>` 포함 |
| CSS | 외부 빌드 의존 없이 `<style>` 안에 포함한다 |
| JS | carousel, accordion 등 상호작용이 필요할 때만 inline script를 최소 사용한다 |
| 데이터 누락 | 필수 필드 누락 시 해당 섹션을 생략하지 말고 placeholder copy 또는 fallback asset을 사용한다 |
| 렌더 순서 | `Page Sections DB.sort_order` 오름차순 |
| 표시 조건 | `visible_mobile/tablet/desktop` 중 하나라도 false면 해당 viewport CSS에서 숨김 처리 |

### 0-2. Notion DB 전체 구조

```
Landing Pages DB
└─ Page Sections DB
   ├─ Hero data
   ├─ Card Components DB
   ├─ Table Components DB
   ├─ Review Components DB
   ├─ Process Components DB
   ├─ Cross-sell Components DB
   ├─ FAQ Components DB
   └─ Form Fields DB
```

| DB | 역할 | row 단위 |
|----|------|----------|
| `Landing Pages DB` | 랜딩페이지 1개를 정의 | LP 1개 |
| `Page Sections DB` | 페이지에 들어갈 섹션 인스턴스와 순서 정의 | 섹션 1개 |
| `Card Components DB` | `imgcard`, `listcard`, feature card 데이터 | 카드 1장 |
| `Table Components DB` | 비교표, 보장표, 혜택표 데이터 | table card 1개 또는 table row 1개 |
| `Review Components DB` | 후기/성공사례 카드 데이터 | 리뷰 1개 |
| `Process Components DB` | 절차/단계/탭 데이터 | 단계 1개 |
| `FAQ Components DB` | Q&A accordion 데이터 | 질문 1개 |
| `Form Fields DB` | 신청 폼 입력 필드 | field 1개 |

---

## A. Landing Pages DB

### A-1. Properties

| Property | Type | Required | Max | 설명 |
|----------|------|----------|-----|------|
| `page_title` | Title | Y | 40자 | 내부 관리명 |
| `slug` | Text | Y | 40자 | URL slug |
| `seo_title` | Text | Y | 60자 | HTML `<title>` |
| `seo_description` | Text | N | 120자 | meta description |
| `brand_label` | Text | N | 20자 | 예: 오늘의집, 오늘의집 사장님센터 |
| `target_url` | URL | N | - | 원본/참고 URL |
| `primary_cta_label` | Text | Y | 20자 | 전역 CTA 문구 |
| `primary_cta_href` | URL | N | - | CTA 이동 URL |
| `theme` | Select | N | - | `moving`, `partner`, `generic` |
| `status` | Status | Y | - | draft / review / published |
| `sections` | Relation | Y | - | `Page Sections DB` 연결 |

---

## B. Page Sections DB

### B-1. Properties

| Property | Type | Required | Max | 설명 |
|----------|------|----------|-----|------|
| `section_name` | Title | Y | 40자 | 내부 관리명 |
| `page` | Relation | Y | - | `Landing Pages DB` |
| `sort_order` | Number | Y | - | 위에서 아래 순서 |
| `preset` | Select | Y | - | `header`, `hero`, `usp`, `table`, `review`, `process`, `cross-sell`, `faq`, `cta-form`, `sticky-cta`, `footer` |
| `variant` | Select | N | - | `default`, `marketing`, `partner`, `dark`, `light`, `comparison`, `benefit` |
| `section_title` | Text | 조건부 | 22자 | 본문 섹션 타이틀. hero/footer/stickyCTA 제외 |
| `subtitle` | Text | N | 18자 | 섹션 보조 라벨 또는 eyebrow |
| `title_required` | Checkbox | N | - | true면 section_title 누락 시 placeholder 생성 |
| `subtitle_enabled` | Checkbox | N | - | false면 subtitle 무시 |
| `layout` | Select | N | - | `grid`, `list`, `carousel` |
| `card_usage` | Select | N | - | `imgcard`, `reviewcard`, `listcard`, `tablecard`, `faqcard` |
| `card_type` | Select | N | - | `bgfullimg`, `leading-asset` |
| `table_variant` | Select | N | - | `1row`, `2row` |
| `background` | Select | N | - | `white`, `gray`, `light`, `sky`, `dark`, `gradient` |
| `visible_mobile` | Checkbox | N | - | 기본 true |
| `visible_tablet` | Checkbox | N | - | 기본 true |
| `visible_desktop` | Checkbox | N | - | 기본 true |
| `content_items` | Relation | 조건부 | - | 카드/후기/프로세스/FAQ 등 반복 콘텐츠 |
| `asset_url` | Files/URL | N | - | hero 또는 섹션 대표 이미지 |
| `cta_label` | Text | N | 20자 | 섹션 CTA |
| `cta_href` | URL | N | - | 섹션 CTA 링크 |

### B-2. `section_title | subtitle` 규칙

| Preset | section_title | Max | subtitle | Max | 예시 |
|--------|---------------|-----|----------|-----|------|
| `hero` | `hero_title` 사용 | 48자 | eyebrow로 사용 | 20자 | `집을 잘 아니까,\n이사도 오늘의집에서` |
| `usp` | Y | 22자 | N/Y | 18자 | `이사 중 생기는 문제를\n이렇게 책임져요` |
| `table` | Y | 22자 | N/Y | 18자 | `오늘의집 이사는\n어떤 게 다를까요?` |
| `review` | Y | 22자 | N/Y | 18자 | `실제 고객들의\n생생한 이사 후기` |
| `process` | Y | 22자 | N/Y | 18자 | `견적 신청하고\n업체 선택하면 끝` |
| `cross-sell` | Y | 22자 | N/Y | 18자 | `복잡한 이사 준비,\n한 번에 끝내세요` |
| `faq` | Y | 22자 | N/Y | 18자 | `자주 묻는 질문` |
| `cta-form` | Y | 22자 | N/Y | 24자 | `무료 상담을 신청하세요` |
| `sticky-cta` | 사용 안 함 | - | 사용 안 함 | - | CTA label만 사용 |
| `footer` | 사용 안 함 | - | 사용 안 함 | - | copyright만 사용 |

---

## C. Card Components DB

### C-1. 공통 Properties

| Property | Type | Required | Max | 설명 |
|----------|------|----------|-----|------|
| `item_name` | Title | Y | 40자 | 내부 관리명 |
| `section` | Relation | Y | - | `Page Sections DB` |
| `sort_order` | Number | Y | - | 카드 순서 |
| `usage` | Select | Y | - | `imgcard`, `listcard`, `benefitcard`, `featurecard` |
| `tag` | Text | N | 12자 | 상단 라벨 |
| `title` | Text | Y | 20자 | 카드 제목 |
| `body` | Text | N | 40자 | 카드 설명 |
| `media_url` | Files/URL | N | - | 카드 이미지 |
| `media_alt` | Text | N | 60자 | 이미지 alt |
| `icon_key` | Select/Text | N | 40자 | ODS icon 또는 emoji key |
| `cta_label` | Text | N | 16자 | 카드 링크 문구 |
| `cta_href` | URL | N | - | 카드 링크 |
| `theme` | Select | N | - | `white`, `blue`, `green`, `dark` |
| `status` | Status | Y | - | active / hidden |

### C-2. 샘플별 card pattern

| 샘플 | Section | Pattern | Notion 데이터 |
|------|---------|---------|---------------|
| 이사 LP 문제 해결 카드 | `usp` | `imgcard + bgfullimg + grid 2col` | `tag`, `title`, `body`, `media_url` |
| 파트너센터 기능 소개 | `usp/process` | `imgcard + leading-asset + list` | `subtitle`, `title`, `body`, `media_url` |
| 파트너센터 혜택 pill | `usp` | `listcard + icon` | `icon_key`, `title`, `body` |
| 이사 연계 서비스 | `cross-sell` | `listcard + grid 2col` | `media_url`, `title`, `body`, `cta_href` |

---

## D. Table Components DB

### D-1. Table Card 방식

비교표와 보장표는 `tablecard` cell로 저장한다. `table_variant`는 카드 개수, `rows`는 카드 내부 항목 수를 뜻한다.

| Property | Type | Required | Max | 설명 |
|----------|------|----------|-----|------|
| `table_name` | Title | Y | 40자 | 내부 관리명 |
| `section` | Relation | Y | - | `Page Sections DB` |
| `sort_order` | Number | Y | - | table card 순서 |
| `table_variant` | Select | Y | - | `1row`, `2row` |
| `title` | Text | Y | 24자 | table card 상단 타이틀 |
| `row_1` | Text | Y | 32자 | 첫 번째 row |
| `row_2` | Text | Y | 32자 | 두 번째 row |
| `row_3` | Text | Y | 32자 | 세 번째 row |
| `row_4` | Text | Y | 32자 | 네 번째 row |
| `row_5` | Text | N | 32자 | 다섯 번째 row |
| `row_6` | Text | N | 32자 | 여섯 번째 row |
| `color_variant` | Select | Y | - | `grey`, `blue`, `green` |
| `highlight` | Checkbox | N | - | 강조 여부 |

### D-2. 샘플별 table pattern

| 샘플 | Section | Pattern | 데이터 예시 |
|------|---------|---------|------------|
| 타사 서비스 vs 오늘의집 이사 | `table` | `2row`, `grey + blue` | 카드 2개, 각 5 rows |
| 오늘의집 책임보장 | `table` | `1row`, `green` | 카드 1개, 4 rows |
| 플랜 구독 + 책임보장 | `table` | `1row`, `green` | 카드 1개, 3 rows |
| 구독 플랜 혜택 | `table` | `2row`, `blue/green` | 요금제별 혜택 비교 |

---

## E. Review Components DB

### E-1. Properties

| Property | Type | Required | Max | 설명 |
|----------|------|----------|-----|------|
| `review_name` | Title | Y | 40자 | 내부 관리명 |
| `section` | Relation | Y | - | `Page Sections DB` |
| `sort_order` | Number | Y | - | 표시 순서 |
| `rating` | Number | Y | 1-5 | 별점 |
| `title` | Text | Y | 40자 | 리뷰 헤드라인 |
| `body` | Text | Y | 180자 | 리뷰 본문 |
| `customer_meta_1` | Text | N | 20자 | 예: `30대 · 여성` |
| `customer_meta_2` | Text | N | 20자 | 예: `의정부시` |
| `customer_name` | Text | N | 20자 | 익명 처리 가능 |
| `photo_url` | Files/URL | N | - | 성공사례 이미지 또는 프로필 |
| `role_label` | Text | N | 20자 | 파트너 직함/업종 |
| `status` | Status | Y | - | active / hidden |

### E-2. 샘플별 review pattern

| 샘플 | Pattern | 필수 데이터 |
|------|---------|------------|
| 이사 후기 카드 | 별점 + 고객 메타 + 제목 + 본문 | `rating`, `customer_meta`, `title`, `body` |
| 사장님센터 성공사례 | 이미지 carousel + 제목 + 이름/업종 | `photo_url`, `title`, `customer_name`, `role_label` |

---

## F. Process Components DB

### F-1. Properties

| Property | Type | Required | Max | 설명 |
|----------|------|----------|-----|------|
| `step_name` | Title | Y | 20자 | 단계명 |
| `section` | Relation | Y | - | `Page Sections DB` |
| `sort_order` | Number | Y | - | 단계 순서 |
| `step_number` | Text/Number | N | 4자 | `01`, `02` 또는 탭 순서 |
| `title` | Text | Y | 20자 | 단계 제목 |
| `body` | Text | N | 60자 | 단계 설명 |
| `tab_label` | Text | N | 12자 | 탭 UI에 표시할 라벨 |
| `media_url` | Files/URL | N | - | 단계 이미지 |
| `media_alt` | Text | N | 60자 | 이미지 alt |

### F-2. 샘플별 process pattern

| 샘플 | Pattern | 데이터 |
|------|---------|--------|
| 견적 신청 → 업체 매칭 → 업체 선정 → 이사 진행 | tabbed process | `tab_label`, `title`, `body`, `media_url` |
| 광고 노출 → 지도 노출 → 시공경험 → 사례 확인 | vertical feature process | `tag/subtitle`, `title`, `body`, `media_url` |

---

## G. Cross-sell Components DB

### G-1. Properties

| Property | Type | Required | Max | 설명 |
|----------|------|----------|-----|------|
| `item_name` | Title | Y | 30자 | 서비스명 |
| `section` | Relation | Y | - | `Page Sections DB` |
| `sort_order` | Number | Y | - | 표시 순서 |
| `title` | Text | Y | 20자 | 카드 제목 |
| `body` | Text | N | 40자 | 카드 설명 |
| `media_url` | Files/URL | N | - | 썸네일 이미지 |
| `media_alt` | Text | N | 60자 | 이미지 alt |
| `cta_href` | URL | N | - | 이동 URL |

### G-2. 샘플 데이터 패턴

| title | body |
|-------|------|
| 입주 청소 | 전문가가 책임지고 무상 AS까지 |
| 가전 렌탈 | 정수기부터 공청기까지 실속 렌탈 |
| 인터넷 설치 | 최적 조건 비교하고 혜택 챙기기 |
| 설치 수리 | 커튼부터 수전까지 간편 제품 설치 |

---

## H. Form Fields DB

### H-1. Properties

| Property | Type | Required | Max | 설명 |
|----------|------|----------|-----|------|
| `field_name` | Title | Y | 20자 | 내부 관리명 |
| `section` | Relation | Y | - | `Page Sections DB` |
| `sort_order` | Number | Y | - | 표시 순서 |
| `label` | Text | Y | 20자 | 입력 라벨 |
| `placeholder` | Text | N | 30자 | placeholder |
| `field_type` | Select | Y | - | `text`, `tel`, `email`, `select`, `checkbox` |
| `required` | Checkbox | N | - | 필수 여부 |
| `options` | Text | N | - | select 옵션. `|`로 구분 |

---

## I. 섹션별 Notion → HTML 매핑

| Preset | 반복 DB | HTML section pattern | 샘플 근거 |
|--------|---------|----------------------|----------|
| `hero` | 없음 | eyebrow + title + media + CTA | 두 샘플 상단 hero |
| `usp` | `Card Components DB` | title block + img/list cards | 이사 문제 해결 카드, 파트너 기능 소개 |
| `table` | `Table Components DB` | comparison tablecard grid | 이사 비교표, 책임보장표 |
| `review` | `Review Components DB` | review grid 또는 carousel | 이사 후기, 성공사례 |
| `process` | `Process Components DB` | tabbed process 또는 vertical feature list | 견적 신청 단계, 파트너 노출 흐름 |
| `cross-sell` | `Cross-sell Components DB` | 2-column service list | 이사 연계 서비스 |
| `faq` | `FAQ Components DB` | accordion list | FAQ 섹션 |
| `cta-form` | `Form Fields DB` | form card + submit CTA | 견적/상담 신청 |
| `sticky-cta` | 없음 | sticky bottom CTA | 두 샘플 하단 CTA |
| `footer` | 없음 또는 Footer DB | company links + copyright | 두 샘플 footer |

### I-1. HTML 생성 시 필수 검증

| 검증 | 규칙 |
|------|------|
| section_title length | preset별 max 초과 시 의미 단위로 줄이고 `\n` 허용 |
| subtitle flag | `subtitle_enabled=false`면 subtitle을 렌더하지 않는다 |
| active item only | 반복 DB의 `status != active` row는 제외 |
| sort order | 모든 반복 콘텐츠는 `sort_order` 오름차순 |
| table rows | `row_1`~`row_4`는 필수, `row_5`~`row_6`은 있을 때만 렌더 |
| image alt | `media_alt` 없으면 `title`을 alt로 사용 |
| CTA href | URL이 없으면 `#` 처리 |
| empty section | 필수 반복 콘텐츠가 0개면 섹션은 렌더하지 않고 주석으로 사유 남김 |

---

## 1. 환경 조건

### 1-1. 기준 소스

| 구분 | 경로 |
|------|------|
| 프로젝트 | `/Users/jisun.moon/Documents/Claude/Projects/LandingPage-Builder v2` |
| 섹션 스키마 | `src/schema/section-presets.ts` |
| 카드 스키마 | `src/schema/card.ts` |
| 토큰 스키마 | `src/schema/ods-tokens.ts` |
| 섹션 런타임 | `src/components/preview/Section.tsx` |
| 카드 런타임 | `src/components/preview/Card.tsx` |
| 섹션 템플릿 | `src/components/preview/sections/*Template.tsx` |

### 1-2. 화면 사이즈

| 속성 | 값 |
|------|-----|
| Mobile preview | 375px |
| Tablet preview | 768px |
| Desktop preview | 1280px |
| Tailwind breakpoint | `mobile: max 767px`, `tablet: 768-1023px`, `desktop: min 1024px` |

### 1-3. 페이지 구조

```
LandingPageDoc
├─ meta
├─ globalTokens
└─ sections[]
   ├─ header       locked, max 1
   ├─ hero         locked, max 1
   ├─ section      title + content slot
   ├─ section      title + content slot
   ├─ cta-form     title + form fields
   ├─ sticky-cta   locked, max 1
   └─ footer       locked, max 1
```

| 영역 | 속성 |
|------|------|
| 고정 섹션 | `header`, `hero`, `sticky-cta`, `footer`는 기본 `locked: true` |
| 본문 섹션 | `usp`, `table`, `review`, `process`, `cross-sell`, `faq`는 `sectionTitle + sectionSubtitle + content slot` 구조 |
| CTA 섹션 | `cta-form`은 `sectionTitle + fields slot + submitLabel + consentText` 구조 |
| 표시 조건 | 모든 섹션은 `visibility: { mobile, tablet, desktop }`를 가진다 |

---

## 2. 공통 토큰과 시스템

### 2-1. 컬러 시스템

| 토큰 | HEX / 값 | 용도 |
|------|----------|------|
| `color.primary` | `#00A1FF` | Primary CTA, 링크, 강조 보더 |
| `color.responsibility-green` | `#05A558` | 최강조, 보장/책임 메시지 |
| `color.star-yellow` | `#FFC300` | 별점 |
| `color.text.primary` | `#141414` | 주요 텍스트 |
| `color.text.secondary` | `#2F3438` | 보조 본문 |
| `color.text.tertiary` | `#8C8C8C` | 메타, 캡션, 보조 정보 |
| `color.surface.gray` | `#F5F5F5` | 회색 섹션 배경, 카드 베이스 |
| `color.surface.light` | `#F7F9FA` | 밝은 보조 배경, 폼 배경 |
| `color.border.default` | `#E0E0E0` | 기본 보더, 구분선 |
| `gradient.responsibility` | `linear-gradient(90deg, #59D99B 0%, #0AB261 100%)` | 보장/책임 강조 배경 |

### 2-2. 테이블 컬러 variant

| Variant | Title bar | Row background | Text | Border / Shadow | 용도 |
|---------|-----------|----------------|------|-----------------|------|
| `grey` | `#E0E0E0` | `#F5F5F5` | `#141414` | 없음 | 일반 비교 대상 |
| `blue` | `#00A1FF` | `#F0F8FC` | `#141414` | `1px #00A1FF` | 추천 또는 선택 후보 |
| `green` | `#0AB261` | `#F2FFF8` | `#05924E` | `2px #0AB261`, green glow | 최강조, 대표 선택지 |

### 2-3. 타이포그래피

| 토큰 | 값 | Tailwind | 용도 |
|------|-----|----------|------|
| `typography.display-lg` | 32px / 42px / 600 / -0.3px | `text-ods-display-lg` | Desktop 섹션 타이틀 |
| `typography.display-md` | 24px / 32px / 600 / -0.3px | `text-ods-display-md` | Mobile/Tablet 섹션 타이틀 |
| `typography.title-lg` | 20px / 28px / 600 / -0.3px | `text-ods-title-lg` | 카드 타이틀 |
| `typography.title-md` | 17px / 22px / 600 / -0.3px | `text-ods-title-md` | 테이블 타이틀 |
| `typography.body-lg` | 15px / 24px / 500 / -0.3px | `text-ods-body-lg` | 카드 본문, 서브 텍스트 |
| `typography.body-md` | 14px / 20px / 400 / -0.3px | `text-ods-body-md` | 일반 본문, 입력 placeholder |
| `typography.caption` | 12px / 15px / 500 / -0.3px | `text-ods-caption` | 메타, 라벨, 캡션 |

### 2-4. 간격 & 정렬

| 토큰 | 값 | 용도 |
|------|-----|------|
| `spacing.1` | 4px | 아이콘-텍스트 최소 간격 |
| `spacing.2` | 8px | 카드 사이 고정 간격, compact row gap |
| `spacing.3` | 12px | 버튼/필드 내부 간격 |
| `spacing.4` | 16px | 기본 padding, 카드 내부 gap |
| `spacing.5` | 20px | 카드 좌우 padding |
| `spacing.6` | 24px | 섹션 타이틀 하단 간격 |
| `spacing.8` | 40px | Tablet 이상 섹션 타이틀 하단 간격 |
| `spacing.9` | 60px | Desktop 섹션 상하 padding |

| 영역 | 규칙 |
|------|------|
| Section container | `px-4 py-8 md:py-12 lg:py-[60px]` |
| Section title block | subtitle → title 순서, 하단 `24px`, `md` 이상 `40px` |
| Card grid/list/carousel gap | 런타임 기준 `8px` 고정 |
| Card radius | 기본 `radius.8` 또는 `radius.12` |
| 정렬 | hero는 중앙 정렬, section title은 좌측 기준, footer는 반응형 grid |

---

## 3. 주요 섹션 레이아웃

### 3-1. `section(title + slot)`

| 속성 | 값 |
|------|-----|
| 적용 preset | `usp`, `table`, `review`, `process`, `cross-sell`, `faq` |
| props | `sectionTitle`, `sectionSubtitle` |
| slot | `content` |
| allowed component | `card` |
| slot 개수 | min 1, max 1 |
| 배경 | `usp/table/process/faq = white`, `review/cross-sell = gray` |

```
Section
├─ SectionTitleBlock
│  ├─ sectionSubtitle
│  └─ sectionTitle
└─ content slot
   └─ Card
      ├─ layout
      └─ cells[]
```

### 3-2. `hero`

| 속성 | 값 |
|------|-----|
| category | `hero` |
| locked | true |
| maxPerPage | 1 |
| props | `eyebrow`, `title`, `subtitle`, `primaryCtaLabel`, `secondaryCtaLabel` |
| asset slot | `background`, required, 권장 600×400 |
| layout | 중앙 정렬 세로 스택 |
| visual frame | `225×150` 기준, `object-contain` |
| background | sky blue fade + `#F5F5F5` fill |

### 3-3. `stickyCTA`

| 속성 | 값 |
|------|-----|
| preset | `sticky-cta` |
| locked | true |
| maxPerPage | 1 |
| props | `label` |
| 위치 | `sticky bottom-0 z-10` |
| button | full width, `radius.8`, `#00A1FF`, 14px semibold |

### 3-4. `footer`

| 속성 | 값 |
|------|-----|
| preset | `footer` |
| locked | true |
| maxPerPage | 1 |
| props | `copyright` |
| 배경 | `#F7F9FA` |
| Desktop layout | max 1256px, `256px | 1px | 256px | 1px | minmax(0,1fr)` |
| Tablet layout | `1fr | 1px | 1fr`, 회사 정보는 full span |
| Mobile layout | 1열, 구분선은 가로선 |
| interaction | 회사 정보 accordion, 링크 hover underline |

---

## 4. Slot 컴포넌트 타입별 variants

### 4-1. Layout variants

| Layout | 스키마 | 구현 규칙 | 용도 |
|--------|--------|-----------|------|
| `grid` | `columns`, `gap`, `minCellHeight` | 현재 런타임은 대부분 2열, `listcard`만 mobile 1열 / tablet+ 2열 | USP, process, table |
| `list` | `gap`, `align`, `inset` | 세로 스택. `listcard`는 mobile 1열, tablet+ 2열 grid | FAQ, service list |
| `carousel` | `cardWidth`, `gap`, `autoScroll`, `showArrows`, `showDots` | 고정폭 카드, `autoScroll=true`면 marquee animation | cross-sell, review, image card |

### 4-2. Card variants

| Variant | usage | 허용 layout | 기본 layout | minWidth | 주요 slot |
|---------|-------|-------------|-------------|----------|----------|
| `imgcard` | `imgcard` | `grid`, `carousel`, `list` | `grid` | 240px | `media`, `tag`, `stepNumber`, `title`, `body` |
| `listcard` | `listcard` | `list`, `grid` | `list` | 320px | `icon`, `title`, `body`, `cta` |
| `reviewcard` | `reviewcard` | `grid`, `list`, `carousel` | `grid` | 254px | `rating`, `title`, `meta`, `body` |
| `tablecard` | `tablecard` | `grid`, `list` | `grid` | 199px | `title`, `meta` |
| `faqcard` | `faqcard` | `list` | `list` | 320px | `title`, `body` |

### 4-3. `imgcard` sub variants

| Sub variant | 값 | 구조 | 용도 |
|-------------|-----|------|------|
| Full background image | `cardType: "bgfullimg"` | `aspect-ratio 3/4`, full-bleed media, dim gradient, white overlay text | USP 이미지 카드 |
| Leading asset | `cardType: "leading-asset"` | 높이 260px, 상단 240×160 media, 하단 title/body | process step 카드 |

### 4-4. Table variants

| Variant | 정의 | 권장 사용 |
|---------|------|----------|
| `1row` | table section 안에 `tablecard` cell 1개를 배치 | 단일 요금제/단일 옵션 설명 |
| `2row` | table section 안에 `tablecard` cell 2개를 배치 | 2개 옵션 비교. 현재 자동 생성 기본값 |
| Row count | `meta.items` 4-6개 | 각 `meta.items[n]`이 테이블 row 1개로 렌더링 |
| Color variants | `grey`, `blue`, `green` | 일반/강조/최강조 비교 카드 |

> 현재 코드 기준 `TABLECARD_ROW_LIMITS`는 min 4, max 6이다. 따라서 `1row`, `2row`는 테이블 내부 row 수가 아니라 tablecard cell의 배치 수로 운용한다.

### 4-5. Section preset과 기본 card 매핑

| Section preset | 기본 card usage | 기본 cell 수 | 비고 |
|----------------|-----------------|--------------|------|
| `usp` | `imgcard`, `bgfullimg` | 4 | 카드 그리드 |
| `review` | `reviewcard` | 4 | 후기 리스트 |
| `process` | `imgcard`, `leading-asset` | 4 | 프로세스 단계 |
| `cross-sell` | `listcard` | 3 | 카드 캐러셀/서비스 리스트 |
| `table` | `tablecard` | 2 | 비교 카드 |
| `faq` | `faqcard` | 4 | accordion |

---

## 5. Design Assets Library, Repo Link

### 5-1. 에셋 타입

| 타입 | 값 | 렌더링 |
|------|-----|--------|
| Image | `image` | `OdsAssetRenderer`에서 image 또는 CDN path로 렌더 |
| SVG/Icon | `svg` | ODS icon component 또는 svg asset |
| Video | `video` | `AssetRef` 타입에서 허용 |
| Lottie | `lottie` | `LottieAssetView`에서 JSON fetch 후 렌더 |

### 5-2. AssetRef 구조

| 필드 | 설명 |
|------|------|
| `assetId` | ODS StillImage/Lottie 컴포넌트명 또는 legacy path id |
| `url` | 직접 URL fallback |
| `alt` | 접근성 필수 텍스트 |
| `responsive` | mobile/tablet/desktop별 asset override |
| `type` | `image`, `svg`, `video`, `lottie` |
| `meta` | width, height, sizeKB, updatedAt |

### 5-3. 라이브러리 링크

| 항목 | 링크 |
|------|------|
| LandingPage Builder repo | `https://github.com/Ohouse-product-design/LandingPage-Builder.git` |
| design-assets source | `https://github.com/bucketplace/design-assets` |
| web app source | `https://github.com/bucketplace/apps-web` |
| Android source | `https://github.com/bucketplace/ohs-android` |
| iOS source | `https://github.com/bucketplace/ohs-iOS` |

### 5-4. 로컬 미러

| 파일 | 용도 |
|------|------|
| `src/catalog/ods-assets.json` | ODS image/Lottie catalog |
| `src/catalog/ods-icons.json` | ODS icon catalog |
| `src/catalog/ods-asset-paths.json` | assetId → CDN 상대 경로 |

---

## 6. 라이팅 규칙

### 6-1. 공통 문체

- UI 텍스트는 짧고 구체적으로 작성한다.
- 버튼은 동사형으로 작성한다. 예: `견적 받기`, `상담 신청`, `자세히 보기`.
- 섹션 타이틀은 혜택 또는 사용자가 얻는 결과를 먼저 쓴다.
- `sectionSubtitle`은 보조 설명 또는 카테고리 라벨로만 사용한다.
- 같은 섹션 안에서는 높임말과 반말을 섞지 않는다.
- 리뷰 본문은 실제 사용자 발화처럼 자연스럽게 작성하되 과장 표현을 피한다.

### 6-2. 글자수/줄수 제한

| 대상 | 제한 |
|------|------|
| Hero eyebrow | 20자, 1줄 |
| Hero title | 48자, 3줄, 필수 |
| Hero subtitle | 48자, 2줄 |
| Hero CTA | 20자, 1줄 |
| Section title | 22자, 2줄, 필수 |
| Section subtitle | 18자, 1줄 |
| CTA form subtitle | 24자, 1줄 |
| Submit label | 12자, 1줄, 필수 |
| Sticky CTA label | 16자, 1줄, 필수 |
| Footer copyright | 60자, 1줄 |

### 6-3. Card slot writing spec

| Variant | Slot | 제한 |
|---------|------|------|
| `imgcard` | `tag` | 12자, 1줄 |
| `imgcard` | `stepNumber` | 4자, 1줄 |
| `imgcard` | `title` | 20자, 2줄, 필수 |
| `imgcard` | `body` | 40자, 2줄 |
| `reviewcard` | `title` | 40자, 2줄, 필수 |
| `reviewcard` | `body` | 180자, 3줄, 필수 |
| `listcard` | `title` | 20자, 1줄, 필수 |
| `listcard` | `body` | 40자, 2줄 |
| `tablecard` | `title` | 24자, 1줄, 필수 |
| `faqcard` | `title` | 80자, 2줄, 필수 |
| `faqcard` | `body` | 400자, 10줄, 필수 |

### 6-4. 강조 표기

- 리뷰 본문에서 인라인 강조는 `**강조할 문구**`로 입력한다.
- 런타임은 `**...**` 구간을 `font-semibold`로 렌더한다.
- 강조는 한 문장 안에서 1회 이하로 제한한다.

---

## 7. Animation, Interaction 명세

### 7-1. Carousel

| 속성 | 규칙 |
|------|------|
| `autoScroll: true` | cells를 2회 반복 렌더링하고 CSS keyframes marquee 적용 |
| duration | 기본 `30000ms` |
| easing | `linear infinite` |
| gap | 런타임 기준 8px |
| card width | `cardWidth[viewport]`, 기본 mobile 280 / tablet 320 / desktop 360 |
| arrows | `showArrows && !autoScroll`일 때 이전/다음 버튼 노출 |
| dots | 스키마에 존재하나 현재 런타임 표시 구현은 없음 |

### 7-2. Layout fallback

| 조건 | 동작 |
|------|------|
| 선택 layout이 `grid` | viewport별 사용 가능 폭을 계산 |
| per-card width < usage minWidth | `carousel` 허용 시 carousel로 fallback |
| carousel 미허용, list 허용 | list로 fallback |
| 둘 다 불가 | 원래 grid 유지 |

### 7-3. FAQ accordion

| 상태 | 동작 |
|------|------|
| closed | 질문 row만 표시 |
| open | 답변 영역 표시, top border 추가 |
| icon | chevron 180도 회전 |
| transition | `duration-200` |
| hover | `bg-ods-surface-gray` |

### 7-4. Footer interaction

| 요소 | 동작 |
|------|------|
| 회사 정보 버튼 | `aria-expanded` 기반 accordion |
| 링크 | hover 시 underline |
| 소셜 아이콘 | hover 시 색상 변경 |

### 7-5. Asset interaction

| 상태 | 동작 |
|------|------|
| 빌더 프리뷰 | 에셋 슬롯 클릭 시 Asset modal open context 전달 |
| asset 없음 | placeholder 또는 fallback asset 렌더 |
| hero background | `slotName: "background"`로 교체 |
| card media/icon | `cellId + cardSlotName`으로 교체 |

---

## 8. 구현 금지/주의 규칙

- 본문 섹션은 `hero`, `cta-form`, `sticky-cta`, `footer`를 제외하고 반드시 `sectionTitle + card slot` 구조를 유지한다.
- 신규 본문 섹션에서 `table-row`, `tab`, `badge` preset을 사용하지 않는다. 현재 스키마에는 남아 있지만 deprecated이다.
- `card` 외 개별 `UspCard`, `ReviewCard`, `StepCard`, `ServiceCard`를 새로 분기하지 않는다.
- ODS 토큰은 `src/schema/ods-tokens.ts`와 `tailwind.config.ts`를 1:1로 맞춘다.
- 이미지/아이콘은 가능한 ODS asset library의 `assetId`를 사용하고, 직접 URL은 fallback으로만 사용한다.
- 카드가 깨지는 viewport에서는 minWidth fallback 규칙을 우선한다.
- tablecard의 내부 row 수는 4-6개를 유지한다.
