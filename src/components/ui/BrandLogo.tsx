import logoUrl from '@/assets/logo.svg';

type Props = {
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: { mark: 'size-8', word: 'text-xl', gap: 'gap-2' },
  md: { mark: 'size-10', word: 'text-[1.65rem]', gap: 'gap-2.5' },
  lg: { mark: 'size-12', word: 'text-[2rem]', gap: 'gap-3' },
} as const;

/** 가로형 워드마크 — 아이콘 + KluZTD */
export default function BrandLogo({ size = 'md' }: Props) {
  const s = sizeMap[size];

  return (
    <div className={`group flex items-center ${s.gap}`}>
      <img
        src={logoUrl}
        alt=""
        aria-hidden
        draggable={false}
        className={`${s.mark} shrink-0 object-contain drop-shadow-[0_8px_18px_rgba(29,111,232,0.32)] transition duration-300 group-hover:-translate-y-0.5 group-hover:drop-shadow-[0_12px_26px_rgba(29,111,232,0.42)]`}
      />
      <div className="min-w-0">
        <div className={`font-display ${s.word} leading-none font-extrabold tracking-tight`}>
          <div className="inline text-text-primary">KluZ</div>
          <div
            className="inline bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(90deg, #1d6fe8 0%, #4da3ff 50%, #5bb8ff 100%)',
            }}
          >
            TD
          </div>
        </div>
        <div className="mt-1.5 text-[0.68rem] font-bold tracking-[0.12em] text-text-muted uppercase">
          My Own GTD
        </div>
      </div>
    </div>
  );
}
