import FocusPanel from '@/components/gtd/FocusPanel';
import ListPanel from '@/components/gtd/ListPanel';
import ProjectPanel from '@/components/gtd/ProjectPanel';
import QuickCapture from '@/components/gtd/QuickCapture';
import Sidebar from '@/components/layout/Sidebar';
import { useGtdStore } from '@/stores/gtdStore';

export default function HomePage() {
  const activeProjectId = useGtdStore((s) => s.activeProjectId);
  const activeListId = useGtdStore((s) => s.activeListId);

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[292px_1fr]">
      <Sidebar />
      <main className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-5 pb-12 md:px-8 md:py-7">
        {activeProjectId ? (
          <div className="animate-[fadeUp_0.35s_ease_both]">
            <ProjectPanel projectId={activeProjectId} />
          </div>
        ) : activeListId === 'focus' ? (
          <div className="animate-[fadeUp_0.35s_ease_both]">
            <FocusPanel />
          </div>
        ) : (
          <>
            <div className="animate-[fadeUp_0.35s_ease_both]">
              <QuickCapture />
            </div>
            <div className="animate-[fadeUp_0.4s_ease_both]">
              <ListPanel />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
