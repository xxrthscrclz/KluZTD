import { FolderKanban } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import PageHeader from '@/components/layout/PageHeader';
import ProjectDetail from '@/components/projects/ProjectDetail';
import ProjectList from '@/components/projects/ProjectList';
import EmptyState from '@/components/ui/EmptyState';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTaskStore } from '@/stores/taskStore';
import { summarizeProject } from '@/utils/project';

/** 프로젝트 — 프로젝트마다 뭘 했는지(한 일)와 마감일 기준 남은 Next Action */
export default function ProjectsPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const projects = useTaskStore((s) => s.projects);
  const tasks = useTaskStore((s) => s.tasks);
  const days = useTaskStore((s) => s.days);
  const addProject = useTaskStore((s) => s.addProject);

  const summaries = useMemo(
    () =>
      projects
        .map((p) => summarizeProject(p, { tasks, days }))
        // 남은 일 있는 것 먼저, 그 안에선 이름순
        .sort((a, b) => Number(!a.nextActions.length) - Number(!b.nextActions.length) || a.project.name.localeCompare(b.project.name, 'ko')),
    [projects, tasks, days],
  );
  const selected = summaries.find((s) => s.project.id === id) ?? (isMobile ? null : summaries[0]) ?? null;

  const select = (pid: string) => navigate(`/projects/${pid}`);

  return (
    <div className="@container mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 pt-4 pb-24 sm:px-8 sm:pt-7">
      <PageHeader compactOnMobile title="프로젝트" description="프로젝트마다 한 일과, 마감일 기준으로 남은 Next Action" />

      {!projects.length ? (
        <div className="flex flex-col gap-4">
          <ProjectList summaries={[]} selectedId={null} onSelect={select} onCreate={(name) => select(addProject(name))} />
          <EmptyState
            icon={<FolderKanban className="size-5" />}
            title="아직 프로젝트가 없어요"
            description="위에서 만들거나, 할 일 상세의 «프로젝트»에서 이름을 적으면 바로 생겨요."
          />
        </div>
      ) : isMobile && selected ? (
        <ProjectDetail summary={selected} onBack={() => navigate('/projects')} />
      ) : (
        <div className="grid grid-cols-1 gap-5 @3xl:grid-cols-[18rem_minmax(0,1fr)]">
          <ProjectList summaries={summaries} selectedId={selected?.project.id ?? null} onSelect={select} onCreate={(name) => select(addProject(name))} />
          {selected ? <ProjectDetail summary={selected} /> : null}
        </div>
      )}
    </div>
  );
}
