# LandingPage Builder v2 — Setup & Workflow Manifest

다른 데스크탑/팀원이 동일한 워크플로우를 즉시 사용할 수 있도록 모든 영속화 정보를 담는 단일 문서.

가이드 표준은 `src/docs/Section-Guidelines.md`이며 이 문서는 **노션 워크스페이스와 Claude/Cowork 실행 환경의 연결**만 다룬다.

---

## 1. 사전 요구사항

| 항목 | 내용 |
|------|------|
| Claude Desktop | Cowork 모드 활성화 (Settings → Desktop app → Cowork) |
| Notion 워크스페이스 | Ohouse > Product Design > LandingPage demo v2. 편집 권한 |
| GitHub repo | `git clone https://github.com/Ohouse-product-design/LandingPage-Builder.git` |
| Node | npm install 후 코드 자산 사용 가능 |
| Connectors | Notion MCP 인증 (claude.ai/connectors) |

---

## 2. 노션 자산 ID 레지스트리

Claude가 새 세션에서도 즉시 DB를 찾을 수 있도록 ID를 박아둔다. URL은 노션 사이드바에서 확인 가능.

### 부모 페이지

| 자산 | ID | URL |
|------|-----|------|
| LandingPage demo v2. (root) | `365a597878a0808c9490ed098dcd19c9` | https://www.notion.so/365a597878a0808c9490ed098dcd19c9 |
| LP 대시보드 템플릿 | `365a5978-78a0-8107-94fc-d19b3fb21cf1` | https://www.notion.so/365a597878a0810794fcd19b3fb21cf1 |

### Databases (data_source_id 기준)

| DB | data_source_id | database URL |
|------|---------------|--------------|
| 📝 Landing Pages | `145d6e72-b170-435e-addc-ab5f9f9d862c` | https://www.notion.so/efa14d2c59924cb7a07610c0cf75e316 |
| 🧩 Page Sections | `33e46134-c1d4-459d-a5ca-1678a56bf8bb` | https://www.notion.so/736189122a0d4a229472dd6d88f108cb |
| 🎴 Card Components | `dd691851-e12e-413e-af99-376082effe4a` | https://www.notion.so/1796177d90904304ab8621bb397c928c |
| ⭐ Review Components | `376f90ec-5e53-47fe-93dd-17c05ea87653` | https://www.notion.so/5799d4c0686b47929d2822aa5ec10a9a |
| 🔄 Process Components | `d30807bb-83d8-42ea-b66b-06666c7b2e88` | https://www.notion.so/f04f3b37058d4c01860c50b7bdcbe847 |
| 🛍️ Cross-sell Components | `04ef8747-3f17-439b-b031-99a893664e95` | https://www.notion.so/34553cc253384c13970553f6e0a388d3 |
| 📍 Coverage Areas (legacy) | `10f4513f-27f9-4cec-b3e8-095f2337d725` | https://www.notion.so/9044ea9e635648cba90b43e274b32b2d |

### 미생성 (가이드 §D · §H 기준)

- Table Components DB — `table` preset용
- FAQ Components DB — `faq` preset용
- Form Fields DB — `cta-form` preset용

---

## 3. 시나리오 트리거 명세

각 트리거가 어떤 자동 실행을 일으키는지 절차적으로 정의. Cowork에 이 트리거 문구가 들어오면 Claude는 아래 절차를 그대로 실행한다.

### 3-1. `이사 LP 시작해줘`

**자동 생성 절차**

1. Landing Pages DB에 row 생성
   - LP 이름: `이사 LP — 1인 가구 타깃`
   - slug: `moving-1person`
   - seo_title: `30분이면 도착하는 이사 견적 · 오늘의집`
   - primary_cta_label: `무료 견적 받기`
   - 타깃 고객: `1인 가구`
   - 상태: `진행 중`
2. Page Sections DB에 7개 row 시드
   - #1 hero (자동)
   - #2 usp · imgcard · 4개 (Card Components에서 매핑)
   - #3 table · tablecard · 비교 카드 2개
   - #4 review · reviewcard · 4개 (Review Components)
   - #5 process · imgcard(leading-asset) · 4단계 (Process Components)
   - #6 faq · faqcard · 4개
   - #7 sticky-cta (자동)
3. 각 Section의 `USP rows`/`Review rows`/`Step rows` Relation을 자동 매핑 (의도 자연어 + 시나리오 톤 기준)
4. 새 LP row URL을 사용자에게 전달
5. artifact가 즉시 로드되도록 PRD URL 인풋 갱신 안내

### 3-2. `인터넷·렌탈 LP 시작해줘`

1. Landing Pages DB에 row 생성
   - LP 이름: `인터넷·렌탈 LP — 1인 가구 타깃`
   - slug: `internet-rental-1person`
   - seo_title: `최대 52만원 지원금 · 인터넷 설치 · 오늘의집`
   - primary_cta_label: `상담 신청하기`
   - 타깃 고객: `1인 가구`
2. Page Sections DB에 7개 row 시드
   - #1 hero, #2 usp(3), #3 review(4), #4 process(4), #5 cross-sell(3), #6 faq, #7 sticky-cta
3. Card Components의 인터넷 시나리오 row 4개를 #2에 매핑
4. Review Components 4개 모두를 #3에 매핑
5. Process Components 4개를 #4에 매핑
6. Cross-sell Components 3개를 #5에 매핑

### 3-3. `사장님센터 LP 시작해줘`

1. Landing Pages DB에 row 생성
   - LP 이름: `사장님센터 LP — 신규 파트너`
   - slug: `partner-onboarding`
   - seo_title: `오늘의집 사장님센터 · 무료 광고 등록`
   - primary_cta_label: `파트너 신청하기`
   - 타깃 고객: `사업장`
2. Page Sections DB에 5개 row 시드
   - #1 hero, #2 usp(feature), #3 review(성공사례), #4 process, #5 cta-form
3. (파트너 시나리오 콘텐츠는 별도 시드 row 필요 — 현재 미생성)

### 3-4. `빈 LP 시작해줘`

1. Landing Pages DB에 row 생성 (모든 필드 빈 값)
2. Page Sections DB에 3개 자동 row만 (hero / sticky-cta / footer)
3. 사용자가 노션에서 직접 채움

---

## 4. Project Instructions에 박을 내용

Cowork → Project Settings → Instructions에 아래 텍스트를 그대로 붙여넣는다.

```
이 프로젝트는 LandingPage Builder v2. Notion DB → HTML pipeline.

[가이드 표준]
src/docs/Section-Guidelines.md를 항상 우선 참조.

[노션 자산 ID]
- Parent page: 365a597878a0808c9490ed098dcd19c9
- LP 대시보드 템플릿: 365a597878a0810794fcd19b3fb21cf1
- Landing Pages DB: 145d6e72-b170-435e-addc-ab5f9f9d862c
- Page Sections DB: 33e46134-c1d4-459d-a5ca-1678a56bf8bb
- Card Components DB: dd691851-e12e-413e-af99-376082effe4a
- Review Components DB: 376f90ec-5e53-47fe-93dd-17c05ea87653
- Process Components DB: d30807bb-83d8-42ea-b66b-06666c7b2e88
- Cross-sell Components DB: 04ef8747-3f17-439b-b031-99a893664e95

[시나리오 트리거]
"이사 LP 시작해줘" / "인터넷·렌탈 LP 시작해줘" / "사장님센터 LP 시작해줘" / "빈 LP 시작해줘"
입력을 받으면 SETUP.md §3 시나리오 트리거 명세를 그대로 실행한다.

[노션 입력 줄바꿈]
notion-update-page 호출 시 multi-line content는 raw newline character로 직접 보낸다 (\\n 문자열 사용 금지).

[Landing Pages DB archived ancestor 이슈]
새 LP row 생성 시 archived ancestor 에러가 나면 부모 페이지의 일반 자식 페이지로 LP를 만들고 사용자에게 DB 복구 안내.

[artifact]
LP Preview Panel artifact (id: lp-preview-panel-phase1)가 노션 데이터 fetch → responsive HTML 빌드 + 코드 export 담당.
```

---

## 5. 트러블슈팅

### 5-1. 노션 본문이 `\n` 글자로 깨질 때

`notion-update-page`의 `new_str`·`content`에 escape sequence(`\n`)을 보내지 말고 **raw line feed character**를 직접 사용. `mcp__workspace__bash`처럼 문자열 안에 진짜 줄바꿈을 두면 정상 처리.

### 5-2. `Can't edit page on block with an archived ancestor`

1. `notion-update-data-source({data_source_id, in_trash: false})` 시도
2. 그래도 실패하면 노션 사이드바에서 직접 DB 복구
3. 그래도 실패하면 부모 페이지의 일반 자식 페이지로 대체 생성

### 5-3. `notion-search` 결과가 일관되지 않음

semantic search라 한국어 키워드 매칭이 누락 가능. 모든 row 조회가 필요한 경우 **각 row의 Relation Property**에서 URL 추출 후 개별 fetch하는 방식 사용 (PRD → Section Briefs → Content rows의 3-step fetch와 동일).

### 5-4. artifact가 노션 데이터를 fetch 못 함

`window.cowork.callMcpTool`이 listed mcp_tools에만 작동. artifact 만들 때 `mcp_tools: ["mcp__b0c9e582-...__notion-fetch", "mcp__b0c9e582-...__notion-search"]`를 반드시 포함.

---

## 6. 7단계 체크리스트 (다른 데스크탑 이식)

체크하면서 진행:

- [ ] 1. Claude Desktop 설치 + Cowork 모드 켜기
- [ ] 2. Notion connector OAuth 인증 (Ohouse 워크스페이스 접근 가능 계정)
- [ ] 3. `git clone https://github.com/Ohouse-product-design/LandingPage-Builder.git` + `npm install`
- [ ] 4. Cowork에 LandingPage-Builder 폴더 연결
- [ ] 5. Project Instructions에 §4 텍스트 붙여넣기
- [ ] 6. 노션에서 LandingPage demo v2 페이지 + 모든 자식 DB·페이지 편집 권한 확인
- [ ] 7. Cowork에서 `LP Preview Panel artifact 다시 만들어줘` 입력 → 사이드바에 artifact 보임

위 모두 완료되면 Cowork에 `이사 LP 시작해줘`를 입력했을 때 §3-1 절차가 자동 실행된다.

---

## 7. 참조 문서

- 가이드 표준 (DB ↔ HTML 계약): `src/docs/Section-Guidelines.md`
- 섹션 preset 카탈로그: `src/schema/section-presets.ts`
- 카드 변형 + slotSpec.maxChar: `src/schema/card.ts`
- ODS 디자인 자산: `src/catalog/ods-*.json`
- 빌더 어드민 UI: `src/components/builder/`
- 프리뷰 컴포넌트: `src/components/preview/sections/`, `src/components/lead/`
