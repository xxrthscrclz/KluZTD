import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/ui/Button';
import Popover from '@/components/ui/Popover';
import { useLatest } from '@/hooks/usePresence';

import { renderLatex, useMathStore } from './math';

const EXAMPLES = ['x^2 + y^2 = z^2', '\\frac{a}{b}', '\\sum_{i=1}^{n} x_i', '\\sqrt{x}', '\\int_0^1 f(x)\\,dx', '\\alpha + \\beta'];

/** 수식(LaTeX) 편집 창 — 수식을 누르거나 새로 넣으면 뜬다 */
export default function MathPopover() {
  const current = useMathStore((s) => s.target);
  const close = useMathStore((s) => s.close);
  const target = useLatest(current);
  const [latex, setLatex] = useState('');
  const anchorRef = useRef<HTMLElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!current) return;
    const target = current;
    anchorRef.current = target.anchor;
    setLatex(target.latex);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [current]);

  const preview = useMemo(() => (target ? renderLatex(latex, target.kind === 'blockMath') : ''), [latex, target]);

  if (!target) return null;
  const { editor, pos, kind } = target;

  /** 바깥을 누르거나 Esc — 고친 게 있으면 적용, 새로 넣고 안 고쳤으면 지움 */
  const dismiss = () => {
    if (target.fresh && latex.trim() === target.latex) remove();
    else apply();
  };

  const finish = (refocus = true) => {
    close();
    if (refocus && !editor.isDestroyed) editor.commands.focus();
  };

  const apply = () => {
    const value = latex.trim();
    if (!value) return remove();
    if (kind === 'inlineMath') editor.chain().updateInlineMath({ latex: value, pos }).run();
    else editor.chain().updateBlockMath({ latex: value, pos }).run();
    finish();
  };

  const remove = () => {
    if (kind === 'inlineMath') editor.chain().deleteInlineMath({ pos }).run();
    else editor.chain().deleteBlockMath({ pos }).run();
    finish();
  };

  return (
    <Popover anchorRef={anchorRef} open={Boolean(current)} onClose={dismiss} title={kind === 'blockMath' ? '수식 블록' : '수식'} placement="bottom-start">
      <div className="flex w-full flex-col gap-2.5 p-3 sm:w-[22rem]" data-testid="math-popover">
        <textarea
          ref={inputRef}
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              apply();
            }
          }}
          rows={kind === 'blockMath' ? 3 : 2}
          spellCheck={false}
          data-no-arrows
          placeholder="LaTeX 입력 — 예: \frac{a}{b}"
          aria-label="LaTeX"
          className="w-full resize-y rounded-lg bg-bg-muted px-3 py-2 font-mono text-[0.82rem] leading-relaxed outline-none focus:bg-bg-surface focus:ring-2 focus:ring-accent/30"
        />
        <div
          className="grid min-h-12 place-items-center overflow-x-auto rounded-lg border border-dashed border-border-strong px-3 py-2 text-text-primary"
          data-testid="math-preview"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setLatex(ex)}
              className="h-7 flex-none rounded-md bg-bg-muted px-2 font-mono text-[0.68rem] text-text-secondary hover:bg-bg-active"
            >
              {ex}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" icon={<Trash2 className="size-3.5" />} onClick={remove}>
            삭제
          </Button>
          <div className="flex items-center gap-2">
            <div className="hidden text-[0.7rem] text-text-muted sm:block">Enter 적용 · Shift+Enter 줄바꿈</div>
            <Button variant="primary" size="sm" onClick={apply}>
              적용
            </Button>
          </div>
        </div>
      </div>
    </Popover>
  );
}
