/** iframe / 단독 프리뷰 — 빌더 다크 `globals` 와 분리된 라이트 서피스 */
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
      />
      <div className="min-h-screen bg-white font-pretendard text-[#141414]">
        {children}
      </div>
    </>
  );
}
