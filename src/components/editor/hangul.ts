const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

/** '체크리스트' → 'ㅊㅋㄹㅅㅌ' (한글이 아닌 글자는 그대로) */
export function choseong(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0) - 0xac00;
    out += code >= 0 && code < 11172 ? CHO[Math.floor(code / 588)] : ch;
  }
  return out;
}

/** 검색어가 대상과 맞는지 — 그냥 포함 또는 초성 포함 ('ㅊㅋ' → '체크리스트') */
export function hangulMatch(target: string, query: string): boolean {
  const t = target.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (t.includes(q)) return true;
  // 자음만 쳤을 때만 초성 검색 — '체'가 '추가'에 걸리지 않도록
  return /^[ㄱ-ㅎ]+$/.test(q) && choseong(t).includes(q);
}
