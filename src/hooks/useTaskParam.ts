import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

type DrawerState = { kzDrawer?: boolean } | null;

/**
 * 열린 할 일 상세는 URL(?t=ID&i=이슈ID)에 둔다 — 모바일 뒤로 가기로 닫히고, 새로고침해도 유지된다.
 * 상세를 열 때 history 에 한 칸 쌓고, 닫을 때 그 칸을 되돌린다 (뒤로 가기가 '빈 칸'을 밟지 않게).
 */
export function useTaskParam() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const taskId = params.get('t');
  const issueId = params.get('i');
  const pushed = Boolean((location.state as DrawerState)?.kzDrawer);

  const open = useCallback(
    (id: string, issue?: string) => {
      const next = new URLSearchParams(location.search);
      next.set('t', id);
      if (issue) next.set('i', issue);
      else next.delete('i');
      const alreadyOpen = Boolean(taskId);
      navigate(
        { pathname: location.pathname, search: `?${next.toString()}` },
        { replace: alreadyOpen, state: alreadyOpen ? location.state : { kzDrawer: true } },
      );
    },
    [location, navigate, taskId],
  );

  const close = useCallback(() => {
    if (pushed) {
      navigate(-1);
      return;
    }
    const next = new URLSearchParams(location.search);
    next.delete('t');
    next.delete('i');
    const search = next.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
  }, [pushed, location, navigate]);

  return { taskId, issueId, open, close };
}
