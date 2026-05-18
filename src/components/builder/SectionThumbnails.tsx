/**
 * SectionThumbnails — SectionPresetMenu 의 카드 그리드용 라이트웨이트 SVG 썸네일.
 *
 * 각 썸네일은 해당 섹션의 시각적 구조를 도식화한 200×120 SVG.
 * 실 컴포넌트 렌더 스케일 다운 대신 SVG 로 처리 — 메뉴 오픈 시 성능/시각 일관성 ↑.
 *
 * 색상은 ODS 토큰의 라이트 톤 (`#F5F5F5`, `#E0E0E0`, `#00A1FF`, `#FFC300`) 사용.
 */

import type { SectionPresetId } from "@/schema/section-presets";

type ThumbProps = {
  className?: string;
};

const VIEWBOX = "0 0 200 120";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox={VIEWBOX} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <rect width={200} height={120} rx={6} fill="#FFFFFF" />
      {children}
    </svg>
  );
}

function Card({
  x,
  y,
  w,
  h,
  fill = "#F5F5F5",
  stroke = "#E0E0E0",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
}) {
  return <rect x={x} y={y} width={w} height={h} rx={4} fill={fill} stroke={stroke} strokeWidth={1} />;
}

function TextBar({
  x,
  y,
  w,
  h = 4,
  opacity = 1,
  fill = "#8C8C8C",
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  opacity?: number;
  fill?: string;
}) {
  return <rect x={x} y={y} width={w} height={h} rx={2} fill={fill} opacity={opacity} />;
}

// ───────────────────────────────────────────────────────────
// 섹션별 썸네일
// ───────────────────────────────────────────────────────────

/** usp / 카드 그리드 — 2×2 그리드 + 헤더 */
export function ThumbCardGrid({ className }: ThumbProps) {
  return (
    <div className={className}>
      <Frame>
        <TextBar x={10} y={12} w={70} h={6} opacity={0.85} fill="#141414" />
        <TextBar x={10} y={24} w={50} fill="#8C8C8C" />
        {/* 2×2 그리드 */}
        <Card x={10} y={40} w={87} h={32} />
        <Card x={103} y={40} w={87} h={32} />
        <Card x={10} y={78} w={87} h={32} />
        <Card x={103} y={78} w={87} h={32} />
      </Frame>
    </div>
  );
}

/** review / 후기 리스트 — 별점 카드 2×2 */
export function ThumbReview({ className }: ThumbProps) {
  return (
    <div className={className}>
      <Frame>
        <TextBar x={10} y={12} w={70} h={6} opacity={0.85} fill="#141414" />
        {/* 4개 카드 with 별점 indicator */}
        {[
          { x: 10, y: 28 },
          { x: 103, y: 28 },
          { x: 10, y: 72 },
          { x: 103, y: 72 },
        ].map((p, i) => (
          <g key={i}>
            <Card x={p.x} y={p.y} w={87} h={38} fill="#FFFFFF" />
            {/* 별 5개 */}
            {Array.from({ length: 5 }).map((_, s) => (
              <circle key={s} cx={p.x + 6 + s * 4} cy={p.y + 8} r={1.5} fill="#FFC300" />
            ))}
            <TextBar x={p.x + 6} y={p.y + 14} w={60} h={3} fill="#141414" opacity={0.85} />
            <TextBar x={p.x + 6} y={p.y + 22} w={70} h={3} />
            <TextBar x={p.x + 6} y={p.y + 28} w={50} h={3} />
          </g>
        ))}
      </Frame>
    </div>
  );
}

/** process / 신청 단계 — 번호 원 + 가로 화살표 */
export function ThumbSteps({ className }: ThumbProps) {
  return (
    <div className={className}>
      <Frame>
        <TextBar x={10} y={12} w={70} h={6} opacity={0.85} fill="#141414" />
        {/* 4단계 원 + 라벨 */}
        {[0, 1, 2, 3].map((i) => {
          const cx = 32 + i * 46;
          return (
            <g key={i}>
              <circle cx={cx} cy={55} r={14} fill="#F5F5F5" stroke="#E0E0E0" />
              <text x={cx} y={59} textAnchor="middle" fontSize={10} fontWeight={600} fill="#141414">
                {i + 1}
              </text>
              <TextBar x={cx - 16} y={80} w={32} h={3} fill="#141414" opacity={0.85} />
              <TextBar x={cx - 12} y={87} w={24} h={3} />
            </g>
          );
        })}
        {/* 화살표 */}
        {[0, 1, 2].map((i) => {
          const x = 49 + i * 46;
          return <line key={i} x1={x} y1={55} x2={x + 12} y2={55} stroke="#E0E0E0" strokeWidth={1} />;
        })}
      </Frame>
    </div>
  );
}

/** cross-sell / 크로스셀링 — 가로 리스트 카드 */
export function ThumbListCards({ className }: ThumbProps) {
  return (
    <div className={className}>
      <Frame>
        <TextBar x={10} y={12} w={70} h={6} opacity={0.85} fill="#141414" />
        {/* 가로 카드 (좌 아이콘 + 우 텍스트) 2장 */}
        {[28, 72].map((y, i) => (
          <g key={i}>
            <Card x={10} y={y} w={180} h={36} fill="#FFFFFF" />
            <rect x={16} y={y + 6} width={24} height={24} rx={4} fill="#00A1FF" opacity={0.15} />
            <TextBar x={48} y={y + 10} w={80} h={4} fill="#141414" opacity={0.85} />
            <TextBar x={48} y={y + 20} w={120} h={3} />
            <TextBar x={48} y={y + 26} w={60} h={3} />
          </g>
        ))}
      </Frame>
    </div>
  );
}

/** cta-form / 신청폼 — 입력 필드 + 버튼 */
export function ThumbForm({ className }: ThumbProps) {
  return (
    <div className={className}>
      <Frame>
        <TextBar x={10} y={12} w={70} h={6} opacity={0.85} fill="#141414" />
        <TextBar x={10} y={24} w={50} fill="#8C8C8C" />
        {/* 3개 input 필드 */}
        {[40, 56, 72].map((y, i) => (
          <g key={i}>
            <Card x={10} y={y} w={180} h={12} fill="#FFFFFF" />
            <TextBar x={16} y={y + 5} w={40} h={3} />
          </g>
        ))}
        {/* 제출 버튼 */}
        <rect x={10} y={92} width={180} height={18} rx={4} fill="#00A1FF" />
        <text x={100} y={104} textAnchor="middle" fontSize={9} fontWeight={600} fill="#FFFFFF">
          제출
        </text>
      </Frame>
    </div>
  );
}

/** faq — accordion (질문 stack + chevron) */
export function ThumbFaq({ className }: ThumbProps) {
  return (
    <div className={className}>
      <Frame>
        <TextBar x={10} y={12} w={70} h={6} opacity={0.85} fill="#141414" />
        {/* 4개 row */}
        {[28, 46, 64, 82].map((y, i) => (
          <g key={i}>
            <Card x={10} y={y} w={180} h={14} fill="#FFFFFF" />
            <TextBar x={16} y={y + 5} w={120} h={4} fill="#141414" opacity={0.75} />
            {/* chevron 아이콘 */}
            <path
              d={`M 178 ${y + 5} L 182 ${y + 9} L 186 ${y + 5}`}
              stroke="#8C8C8C"
              strokeWidth={1}
              fill="none"
            />
          </g>
        ))}
      </Frame>
    </div>
  );
}

/** tablecard / 비교 카드 — 2 column 비교 (grey + blue) */
export function ThumbTable({ className }: ThumbProps) {
  return (
    <div className={className}>
      <Frame>
        <TextBar x={10} y={12} w={70} h={6} opacity={0.85} fill="#141414" />
        {/* 좌 (grey) + 우 (blue) */}
        {([
          { x: 10, bar: "#E0E0E0", bg: "#F5F5F5" },
          { x: 103, bar: "#00A1FF", bg: "#F0F8FC" },
        ] as const).map((c, i) => (
          <g key={i}>
            <Card x={c.x} y={26} w={87} h={84} fill={c.bg} stroke="#E0E0E0" />
            <rect x={c.x} y={26} width={87} height={14} fill={c.bar} />
            {[46, 60, 74, 88].map((y, j) => (
              <g key={j}>
                <TextBar x={c.x + 8} y={y} w={70} h={3} fill="#141414" opacity={0.85} />
                {j < 3 && (
                  <line x1={c.x + 6} y1={y + 7} x2={c.x + 81} y2={y + 7} stroke="#EDEDED" strokeWidth={0.5} />
                )}
              </g>
            ))}
          </g>
        ))}
      </Frame>
    </div>
  );
}

/** hero — 큰 헤드라인 + CTA */
export function ThumbHero({ className }: ThumbProps) {
  return (
    <div className={className}>
      <Frame>
        <rect x={0} y={0} width={200} height={120} rx={6} fill="#F7F9FA" />
        <TextBar x={20} y={30} w={120} h={10} fill="#141414" opacity={0.9} />
        <TextBar x={20} y={48} w={140} h={6} />
        <rect x={20} y={75} width={70} height={20} rx={4} fill="#00A1FF" />
        <text x={55} y={89} textAnchor="middle" fontSize={9} fontWeight={600} fill="#FFFFFF">
          무료 신청
        </text>
      </Frame>
    </div>
  );
}

/** sticky-cta — 화면 하단 고정 바 */
export function ThumbStickyCta({ className }: ThumbProps) {
  return (
    <div className={className}>
      <Frame>
        <rect x={10} y={6} width={180} height={84} rx={4} fill="#F5F5F5" />
        <rect x={10} y={96} width={180} height={18} rx={4} fill="#00A1FF" />
        <text x={100} y={108} textAnchor="middle" fontSize={9} fontWeight={600} fill="#FFFFFF">
          무료 견적 신청하기
        </text>
      </Frame>
    </div>
  );
}

/** header / footer — 단순 바 */
export function ThumbBar({ className }: ThumbProps) {
  return (
    <div className={className}>
      <Frame>
        <rect x={0} y={0} width={200} height={24} fill="#F5F5F5" />
        <TextBar x={10} y={10} w={50} h={4} fill="#141414" />
        <TextBar x={140} y={10} w={50} h={4} />
        <TextBar x={10} y={50} w={180} h={3} />
        <TextBar x={10} y={60} w={160} h={3} />
        <TextBar x={10} y={70} w={170} h={3} />
      </Frame>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// 매핑
// ───────────────────────────────────────────────────────────

/**
 * SectionPresetId → 썸네일 컴포넌트.
 * variant 가 마케팅이어도 동일 썸네일을 사용 (라벨로 구분).
 */
export const SECTION_THUMBNAILS: Record<SectionPresetId, (p: ThumbProps) => JSX.Element> = {
  header: ThumbBar,
  hero: ThumbHero,
  usp: ThumbCardGrid,
  review: ThumbReview,
  process: ThumbSteps,
  "cross-sell": ThumbListCards,
  table: ThumbTable,
  faq: ThumbFaq,
  "cta-form": ThumbForm,
  "sticky-cta": ThumbStickyCta,
  footer: ThumbBar,
};
