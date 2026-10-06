/** 지연 로딩 중 자리 — 깜빡임 없게 아주 옅게 */
export default function PageFallback() {
  return (
    <div className="flex flex-1 items-start justify-center px-4 pt-24">
      <div className="anim-fade size-5 animate-spin rounded-full border-2 border-border-strong border-t-text-secondary [animation-delay:200ms]" />
    </div>
  );
}
