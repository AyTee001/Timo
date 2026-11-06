import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ProjectDialog } from '../components/ProjectDialog';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import type { Project, ProjectFormData } from '../types';
import { formatDate } from '../data/mockData';
import { toast } from 'sonner';

interface ProjectsProps {
  projects: Project[];
  onSave: (data: ProjectFormData, projectId?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
  loadError: string;
  onRetry: () => void;
}

export function Projects({ projects, onSave, onDelete, isLoading, loadError, onRetry }: ProjectsProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setFormOpen(true);
  };

  const deleteEntryCount = deleteTarget?.timeEntriesCount ?? 0;

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6" aria-labelledby="projects-heading">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 id="projects-heading" className="text-2xl font-bold text-foreground">Мої проєкти</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Керуйте своїми проєктами для відстеження часу.</p>
        </div>
        <Button size="sm" className="cursor-pointer shrink-0 gap-1.5 self-start" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Новий проєкт
        </Button>
      </div>

      <section aria-labelledby="projects-list-heading">
        <h2 id="projects-list-heading" className="sr-only">Список проєктів</h2>
        {isLoading ? (
          <Card>
            <p className="py-16 text-center text-sm text-muted-foreground" role="status">Завантаження проєктів…</p>
          </Card>
        ) : loadError ? (
          <Card>
            <div className="flex flex-col items-center gap-3 py-16">
              <p className="text-sm text-red-700" role="alert">{loadError}</p>
              <Button size="sm" variant="outline" className="cursor-pointer" onClick={onRetry}>
                Спробувати ще раз
              </Button>
            </div>
          </Card>
        ) : projects.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <p className="text-sm">Проєктів ще немає.</p>
              <Button size="sm" variant="outline" className="cursor-pointer" onClick={openCreate}>
                Додати перший проєкт
              </Button>
            </div>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <li key={project.id}>
                <Card className="flex h-full flex-col gap-3 p-4 transition-shadow hover:shadow-md">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{project.name}</h3>
                    {project.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Створено {formatDate(project.createdAt.slice(0, 10))}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-end gap-2 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer gap-1.5"
                      onClick={() => openEdit(project)}
                      aria-label={`Редагувати проєкт ${project.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Редагувати
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-3 h-8 w-8 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeleteTarget(project)}
                      aria-label={`Видалити проєкт ${project.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProjectDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editing}
        onSave={(data) => onSave(data, editing?.id)}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Видалити проєкт?"
        summary={deleteTarget?.name ?? ''}
        warning={deleteEntryCount > 0
          ? `Разом із проєктом буде видалено всі його записи часу (${deleteEntryCount}).`
          : undefined}
        itemNoun="Проєкт"
        confirmLabel="Видалити проєкт"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await onDelete(deleteTarget.id);
            setDeleteTarget(null);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Не вдалося видалити проєкт.');
          }
        }}
      />
    </main>
  );
}
