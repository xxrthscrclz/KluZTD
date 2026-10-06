/**
 * 로고 — public/logo.svg 를 그대로 쓴다. 로고를 바꾸려면 그 파일만 교체하면 된다.
 * (아이콘 PNG 들은 `pnpm icons` 로 logo.svg 에서 다시 만든다)
 */
export default function BrandMark({ size = 28, withName = true }: { size?: number; withName?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="./logo.svg" alt="" width={size} height={size} className="flex-none rounded-[22%]" draggable={false} />
      {withName ? <div className="text-[1.02rem] font-extrabold tracking-[-0.03em]">KluZTD</div> : null}
    </div>
  );
}
