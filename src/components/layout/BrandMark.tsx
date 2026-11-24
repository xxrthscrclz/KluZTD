/**
 * 로고 — public/logo.png (모서리까지 깎인 PNG).
 * 바꾸려면 build/icon-source.png 를 교체하고 `pnpm icons` — 앱 아이콘·PWA 아이콘도 함께 다시 만들어진다.
 */
export default function BrandMark({ size = 28, withName = true }: { size?: number; withName?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="./logo.png" alt="" width={size} height={size} className="flex-none" draggable={false} />
      {withName ? <div className="text-[1.02rem] font-extrabold tracking-[-0.03em]">KluZTD</div> : null}
    </div>
  );
}
