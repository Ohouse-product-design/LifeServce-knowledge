# Naming Conventions — Section Presets, Slots, and Items

> Status: Draft v2 · Last updated: 2026-05-17
> Companion to [PRD.md](./PRD.md) and [SPEC.md](./SPEC.md). This document is the source of truth for preset, slot, item-variant, layout, data-source, and interaction naming.

---

## 1. Principle

Names describe **structure and function**, never **business semantics**.

A preset is a layout template. The same template should be reusable across moving, renovation, expert matching, commerce, and any future vertical. Naming a preset after one business' usage of it (`usp`, `coverage`, `review`, `cross-sell`) leaks that vertical's vocabulary into the catalog and makes the preset feel "wrong" in other contexts even when the structure fits perfectly.

Rule of thumb: **if you can't reuse the name in a totally different business without it sounding weird, the name is too semantic.**

Business semantics belong on the **prompt** side (the user's intent), not the **preset** side. The mapping from semantic intent to structural preset is maintained in the preset's `intents` tag array (see SPEC §2.2).

## 2. Global Namespace

All IDs live under one of three namespaces:

```
section.{structural-pattern}      e.g.  section.card-grid
slot-item.{variant}               e.g.  slot-item.review-card
slot-layout.{variant}             e.g.  slot-layout.carousel
```

(The previous `component.*` namespace is replaced by `slot-item.*` — it more accurately describes what these things are: items that fill section slots, not freestanding components.)

## 3. Naming Rule

- **Lowercase, kebab-case** after the namespace.
- **Structural noun** (what it *is*: `card-grid`, `accordion`, `quote-list`) or **structural verb-of-display** (`steps`, `tabs`).
- **No business nouns** (no `usp`, `pricing`, `feature`, `testimonial`, `partner`, `service`, `coverage`, etc.).
- **No marketing verbs** (no `promote`, `convert`, `engage`).
- **Cardinality, when meaningful, goes in the name**: `card-grid` (many uniform cards) vs. `card-single`.
- Prefer **2 tokens**; allow 3 only when needed to disambiguate.

### Quick test

Read the ID out loud to someone unfamiliar with the project. They should be able to sketch the layout from the name alone, without knowing what business is being built.

## 4. Section Anatomy

**Every section preset has the same outer shape.** This is the contract a preset must satisfy to be usable in the builder.

```
Section
├─ title                    (string, required, default provided by preset)
├─ subtitle                 (string, optional)
└─ slots[]                  (zero or more named slots)
   └─ Slot
      ├─ name               (e.g. "items")
      ├─ accepts            (list of slot-item variants)
      ├─ layouts            (list of valid slot-layout variants)
      ├─ defaultLayout
      ├─ dataSource         (optional: google-sheet | static)
      └─ items[]            (resolved at runtime)
```

The editor flow is fixed:

1. Pick a section preset → title + subtitle? are filled with the preset defaults.
2. For each slot, pick an item variant from `accepts`.
3. Pick a layout from `layouts` (default pre-selected).
4. (Optional) bind to a data source — see §9.
5. Fill items (or let the data source populate them).

**Chrome presets** (`section.header`, `section.footer`, `section.sticky-bar`) MAY omit `slots` entirely. **Body presets** MUST have at least one slot.

## 5. Section Preset Vocabulary (v1)

These are the structural primitives v1 ships with. The catalog can grow via the request-driven flow in PRD §6.3.

### 5.1 Chrome (pinned by default)

| ID | What it is | Slots |
|---|---|---|
| `section.header` | Site header bar. | — |
| `section.footer` | Site footer block. | — |
| `section.sticky-bar` | Floating persistent bar. | — |

### 5.2 Body — single-block patterns (no repeating slot)

| ID | What it is | Slots |
|---|---|---|
| `section.banner` | Full-width prominent intro block. (The "hero" pattern.) | `actions` (optional) |
| `section.headline` | Heading + subheading only. Acts as a section divider. | — |
| `section.media-text` | Media on one side, text on the other. | `media` |
| `section.cta-band` | Single horizontal call-to-action bar. | `actions` |

### 5.3 Body — slot-driven patterns (repeating items)

These presets are **slot-shaped** — their visual identity comes from the items in their `items` slot and the chosen layout.

| ID | Default item variant | Allowed layouts |
|---|---|---|
| `section.card-grid` | `card` | `grid` (default), `list` |
| `section.card-list` | `list-card` | `list` (default), `grid` |
| `section.card-carousel` | `card` | `carousel` (default) |
| `section.quote-list` | `review-card` | `list` (default), `carousel`, `grid` |
| `section.steps` | `progress-card` | `list` (default), `grid` |
| `section.logo-strip` | `card` | `carousel` (default), `grid` |
| `section.metric-strip` | `card` | `grid` (default) |

### 5.4 Body — structured patterns

| ID | What it is | Slots |
|---|---|---|
| `section.table` | Rows × columns data table. | `columns`, `rows` |
| `section.tabs` | Tabbed switcher. | `tabs`, `items` |
| `section.accordion` | Collapsible disclosure list. | `items` |
| `section.form` | Lead/contact form. | `fields` (`input` items) |

## 6. Slot Conventions

### 6.1 Slot names

Slot names follow a structural vocabulary. Pick from the list below.

| Slot name | Use it for |
|---|---|
| `items` | The primary repeating slot of the preset. |
| `media` | A single image / video / Lottie. |
| `actions` | Buttons / CTAs attached to the section. |
| `fields` | Form inputs (slot-item variant: `input`). |
| `columns` | Table column definitions. |
| `rows` | Table rows (when columns are headers). |
| `tabs` | Tab definitions for tabbed patterns. |

**Banned slot names:** `cards`, `reviews`, `services`, `usps`, `features`, `steps` (as a slot name), and any other business-flavored noun.

### 6.2 Slot spec

A slot declares three axes:

```ts
type SlotSpec = {
  name: SlotName;
  accepts: SlotItemVariant[];     // §7
  layouts: SlotLayout[];           // §8 — empty if layout is fixed by the preset
  defaultLayout?: SlotLayout;
  dataSource?: DataSourceSpec;     // §9
  min?: number;
  max?: number;
};
```

If a preset has only one repeating slot, name it `items`. Specific slot names (`fields`, `columns`, etc.) are reserved for structurally distinct slots that need their own type/spec.

## 7. Slot Item Variants

The vocabulary of what can fill a slot. Exactly five item variants in v1:

### 7.1 `slot-item.card`

Generic content card. The most common item.

**Cells (Storybook spec):**

| Cell | Type | Notes |
|---|---|---|
| `media` | image / Lottie / icon | Optional. Top of card. |
| `tag` | string | Optional. Eyebrow above title. |
| `title` | string | Required. |
| `body` | string | Optional. |
| `meta` | string | Optional. Footer line. |

### 7.2 `slot-item.review-card`

Quote / testimonial / statement card. Anything where the structure is "a quote attributed to someone."

| Cell | Type | Notes |
|---|---|---|
| `rating` | number 0–5 | Optional. |
| `title` | string | Optional. Headline of the quote. |
| `body` | string | Required. The quote itself. |
| `meta` | string | Optional. Attribution (name, role, date). |
| `media` | image | Optional. Avatar or proof image. |

### 7.3 `slot-item.list-card`

Vertical-list card with prominent media. Often used as a richer card with an image on one side and text on the other.

| Cell | Type | Notes |
|---|---|---|
| `media` | image / Lottie | Required. Left (desktop) / top (mobile). |
| `tag` | string | Optional. |
| `title` | string | Required. |
| `body` | string | Optional. |
| `cta` | action | Optional. Inline link/button. |

### 7.4 `slot-item.progress-card`

Numbered/ordered step card.

| Cell | Type | Notes |
|---|---|---|
| `stepNumber` | string/number | Required. Auto-incremented if not set. |
| `title` | string | Required. |
| `body` | string | Optional. |
| `media` | image / icon | Optional. |

### 7.5 `slot-item.input`

Form input field.

| Cell | Type | Notes |
|---|---|---|
| `label` | string | Required. |
| `placeholder` | string | Optional. |
| `fieldType` | enum | `text` / `tel` / `email` / `select` / `checkbox` / `textarea` |
| `required` | boolean | Default `false`. |
| `options` | string[] | Required for `select`. |

### 7.6 Naming rule recap

Every item variant ID follows `slot-item.{noun}-card` or `slot-item.{noun}` for non-card items. Variants beyond the v1 five must be added through the catalog extension flow (PRD §6.3) and listed in this document in the same PR.

## 8. Layout Vocabulary

Slots can arrange their items in one of three layouts:

| Layout | What it is | Best for |
|---|---|---|
| `grid` | 2D grid. Columns adapt by viewport (1 / 2 / 3+). | Many short cards; visual scanning. |
| `carousel` | Horizontally swipeable row. | Long lists where vertical space is precious; mobile-first. |
| `list` | Vertical stack. One item per row. | Rich cards (media + text); reading order matters. |

**Rule:** layout is a property of the **slot** (how items are arranged), not of the item itself. The same `slot-item.card` can render in any of the three layouts.

**Banned layout names** (do not introduce): `row` (use `carousel` or `list`), `swiper`, `slider`, `gallery`, `masonry` (unless added with explicit consensus).

### 8.1 Allowed (preset → layout) combinations

Each preset declares which layouts make sense for its body. The editor surfaces only those layouts in the slot inspector.

```
section.card-grid       → [grid, list]
section.card-list       → [list, grid]
section.card-carousel   → [carousel]
section.quote-list      → [list, carousel, grid]
section.steps           → [list, grid]
section.logo-strip      → [carousel, grid]
section.metric-strip    → [grid]
```

## 9. Data Source Convention

Items in a slot can be populated in one of two ways:

### 9.1 `static`

The composer hand-fills each item in the inspector. This is the default.

```ts
dataSource: { type: "static" }
```

### 9.2 `google-sheet`

Items are sourced from a Google Sheet. Each row becomes one item; each column maps to a cell in the item variant.

```ts
dataSource: {
  type: "google-sheet";
  sheetId: string;                  // Google Sheet ID
  range: string;                    // e.g. "Sheet1!A2:E"
  columnMap: Record<string, string>; // cell name → sheet column
  refresh: "manual" | "on-publish"; // when to re-fetch
}
```

**Column map example** for `slot-item.review-card`:

```ts
columnMap: {
  rating:   "A",
  title:    "B",
  body:     "C",
  meta:     "D",
  href:     "E",
}
```

The Apps Script publisher (`apps-script/`) is the read bridge. Auth is handled there; the builder never receives Sheet credentials directly. See SPEC §6.

**Rule:** if a slot's `dataSource.type === "google-sheet"`, the composer cannot edit individual items in the inspector — only the column map and the Sheet binding. To override one item, switch the slot to `static`.

## 10. Item Interaction Convention

Every slot item can declare an interaction. Two fields:

```ts
type SlotItem = {
  // ...cells per §7
  href?: string;                    // absolute URL or placeholder
  onClick?: ItemAction;
};

type ItemAction =
  | { type: "navigate"; href: string; target?: "_self" | "_blank" }
  | { type: "anchor";   sectionId: string }
  | { type: "modal";    modalId: string }
  | { type: "submit"; }             // for inputs in a form section
  | { type: "none"; };
```

**Rules:**

- `href` is the simple case (a link). Setting it implicitly creates `onClick: { type: "navigate", href }`.
- `onClick` is the full case. If both are set, `onClick` wins and `href` is treated as the visible `data-href` attribute only.
- Placeholder hrefs use the `#TODO-{label}` pattern (also enforced in code export, SPEC §7.6).
- `slot-item.input` ignores `href` / `onClick.navigate` — its only valid action is `submit`.
- For `google-sheet` data sources, `href` and `onClick` can be column-mapped; otherwise they're set per-item in the inspector.

## 11. Card Component Width (Global Default)

All card variants (`slot-item.card`, `.review-card`, `.list-card`, `.progress-card`, `.table-card`) declare a **`minWidth`** — the smallest width at which the card still renders correctly. Cards do **not** declare a fixed width; they grow with the slot container up to the variant's natural max.

### 11.1 Rule

Each variant declares its `minWidth` in the variant's spec (Storybook story `parameters.preset.minWidth`).

At render time, the slot container computes the per-card width given its current layout:

- `grid`     → `containerWidth / columnCount - gap`
- `carousel` → `settings.cardWidth[viewport]` (already fixed by carousel settings)
- `list`     → `containerWidth` (full width, 100%)

If the computed per-card width **drops below `minWidth`**, the slot **automatically falls back** to a layout where cards do not have to shrink:

```
grid (cells would shrink below minWidth)
   │
   ├─ if variant allows `carousel`  → switch to carousel (horizontal scroll, cardWidth = minWidth)
   └─ else if variant allows `list` → switch to list (stack, each card 100% of container)
```

### 11.2 Why min-width (not fixed)

- **Fixed width** assumes the designer knows every slot's container width up-front — false for a builder that composes pages across verticals with arbitrary section nesting.
- **Min-width + auto-fallback** lets the designer specify only the lower bound below which the card breaks visually. The layout system handles the rest — carousel when horizontal space exists, list when it doesn't.
- The fallback is **deterministic**: same variant + same container width always picks the same layout. No designer surprise.

### 11.3 Designer responsibility

Per variant, declare in the spec:

```ts
parameters: {
  preset: {
    minWidth: 240,                                  // px
    allowedLayouts: ["grid", "carousel", "list"],   // CONVENTIONS §8 — also defines fallback order
    fallbackOrder: ["carousel", "list"],            // optional, defaults to allowedLayouts order minus current
  }
}
```

The slot inspector surfaces the currently-active layout (including auto-fallback transitions) with a badge so the composer understands why a chosen grid is rendering as a carousel at narrow viewports.

Per-variant minWidth values are tracked in [QA-CARD.md](./QA-CARD.md) (Figma 시안 diff 표) — keep this doc and Figma spec in sync.

**Runtime implementation:** `resolveLayoutWithFallback()` in `src/components/preview/Card.tsx`. Per-card width is approximated from `viewport` (mobile=360 / tablet=750 / desktop=1200 usable) — a more accurate ResizeObserver-based measurement is future work.

## 12. Section Composition Rule

**모든 body 섹션은 `title` + `card slot` 의 조합으로만 구성된다.**

예외 카테고리 (이 룰의 적용 외):

| 예외 | 이유 |
|---|---|
| `section.header`, `section.footer`, `section.sticky-bar` | chrome 영역. 자체 구조 (로고/네비/푸터 정보 / 고정 바). |
| `section.banner` (hero) | hero 카테고리. 큰 카피 + 배경 이미지 + CTA. |
| `section.form`, `section.cta-band` | cta 카테고리. 입력 필드 또는 단일 CTA 바. |

그 외 모든 body 섹션 (`section.card-grid`, `.card-list`, `.card-carousel`, `.quote-list`, `.steps`, `.table`, `.logo-strip`, `.metric-strip` 등) 은:

1. **uiSpec 에 `sectionTitle` (required) 와 `sectionSubtitle` (optional) 를 선언**
2. **단일 슬롯 `content` (또는 `items`) 를 두고 `allows: ["card"]` 만 허용**

**금지 사항:**
- body 섹션이 `card` 외의 컴포넌트 프리셋을 슬롯에 허용하는 것 (예: 과거 `review.tabs` 에 `["tab"]` 허용 — v3에서 제거됨).
- title 없이 카드만 가지는 섹션 (시각적 컨텍스트 없이 카드 그룹만 노출되는 패턴은 권장하지 않음).

**왜 이 원칙인가:**
- 빌더 사용자에게 한 가지 멘탈 모델만 학습시킴: "섹션을 추가하면 = 타이틀 + 카드 그룹". 매번 새 슬롯 구조를 외울 필요 없음.
- 카드 변형(`slot-item.*`) + 레이아웃(grid/carousel/list) 의 조합만으로 시각적 다양성 확보. 섹션마다 별도 슬롯 타입을 추가하지 않아도 됨.
- 디자이너의 Storybook 카드 카탈로그가 모든 body 섹션의 비주얼을 100% 커버.

**구현:**
- `src/schema/section-presets.ts` 의 모든 body preset 의 `slots[].allows` 는 `["card"]` 단일이어야 함.
- 신규 body preset 추가 시 이 컨벤션을 따르도록 PR 리뷰에서 강제.

## 14. Section Flags

Two boolean flags replace the old `fixed / content / cta` categorization:

```ts
type SectionPreset = {
  pinned: boolean;   // cannot be reordered or removed by composer
  unique: boolean;   // at most one instance per page
};
```

- Pinned + unique → `section.header`, `section.footer`.
- Pinned + not unique → `section.sticky-bar`.
- Not pinned + not unique → all body presets.

Per PRD FR-6, `pinned` blocks structure changes only. Composers may still edit copy (title, subtitle, item cells) and swap assets on pinned sections.

The semantic "is this a CTA?" question is answered by the preset's `intents` tags, not by a category.

## 15. Migration Table

From the current codebase (`src/schema/section-presets.ts`, `src/schema/component-presets.ts`, `src/schema/card.ts`).

### 12.1 Section presets

| Old | New | Notes |
|---|---|---|
| `header` | `section.header` | Direct rename. |
| `footer` | `section.footer` | Direct rename. |
| `hero` | `section.banner` | Layout idiom; renamed for purity. |
| `sticky-cta` | `section.sticky-bar` | Structure is a sticky bar; CTA-ness is an intent. |
| `usp` | `section.card-grid` | Default item: `slot-item.card`. |
| `table` | `section.table` | Kept. |
| `coverage` | `section.card-grid` | (or `section.metric-strip` if rendered as KPIs) |
| `review` | `section.quote-list` | Default item: `slot-item.review-card`. |
| `process` | `section.steps` | Default item: `slot-item.progress-card`. |
| `cross-sell` | `section.card-carousel` | Default item: `slot-item.card`. |
| `cta-form` | `section.form` | Default item: `slot-item.input`. |

### 12.2 Component presets → slot items

Today's unified `card` component with a `usage` enum maps directly:

| Old (`card.usage`) | New (`slot-item.*`) |
|---|---|
| `usp` | `slot-item.card` |
| `review` | `slot-item.review-card` |
| `step` | `slot-item.progress-card` |
| `service` | `slot-item.list-card` |
| `custom` | `slot-item.card` (open cells) |

Non-card components:

| Old | New |
|---|---|
| `form-field` | `slot-item.input` |
| `table-row` | (kept as slot-internal type for `section.table.rows`) |
| `tab` | (kept as slot-internal type for `section.tabs.tabs`) |
| `badge` | (kept as inline element inside cells, not a slot item) |

### 12.3 Layouts

| Old (`CardLayout`) | New (`slot-layout.*`) |
|---|---|
| `grid` | `grid` |
| `carousel` | `carousel` |
| `row` | `list` (renamed for clarity — `row` was ambiguous) |

## 16. Adding a New Pattern or Variant

A designer adds something new by:

1. Choosing a name that satisfies §1 and §3 (no business semantics, structural noun, kebab-case under the correct namespace).
2. Adding it to the appropriate vocabulary section of this document (§5 / §7 / §8) **in the same PR** as the Storybook story.
3. Letting CI auto-tag `intents` for the new preset (SPEC §3.3). Override manually only if the auto-tag is wrong.
4. Going through the catalog-extension flow (PRD §6.3) if the trigger is a non-designer request.

**Variant vs. new preset rule:** if the new pattern overlaps with an existing primitive (a card grid with different border radius, a carousel with autoplay), it's almost certainly a **prop variant** of the existing preset, not a new preset. Add a prop; don't add a preset.

**Layout vs. variant rule:** if the new thing is "the same items arranged differently," it's a layout, not a new item variant. Extend §8 instead of §7.

## 17. Out of Scope for Naming

- **Visual variants** (compact, marketing, dark) → props on the preset.
- **Per-vertical content defaults** (moving-specific copy in a banner) → seed data, not preset.
- **Per-business intent vocabulary** → the `intents` tag array (open vocabulary, auto-tagged at build).
- **Data source connectors beyond Google Sheet** → future work; this document will be extended at that point.
