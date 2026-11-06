import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { TimeEntryDialog } from '../components/TimeEntryDialog';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import type { Project, TimeEntry, TimeEntryInput } from '../types';
import { formatDuration, formatDate } from '../data/mockData';

interface TimeEntriesProps {
  timeEntries: TimeEntry[];
  projects: Project[];
  onSave: (data: TimeEntryInput, entryId?: string) => void;
  onDelete: (id: string) => void;
}

export function TimeEntries({ timeEntries, projects, onSave, onDelete }: TimeEntriesProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TimeEntry | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<TimeEntry | null>(null);

  const sorted = [...timeEntries].sort((a, b) => b.date.localeCompare(a.date));

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (entry: TimeEntry) => {
    setEditing(entry);
    setFormOpen(true);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6" aria-labelledby="time-entries-heading">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 id="time-entries-heading" className="text-2xl font-bold text-foreground">Мої записи часу</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Керуйте своїми записами робочого часу.</p>
        </div>
        <Button size="sm" className="cursor-pointer shrink-0 gap-1.5 self-start" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Новий запис
        </Button>
      </div>

      <section aria-labelledby="entries-table-heading">
        <h2 id="entries-table-heading" className="sr-only">Список записів часу</h2>
        <Card>
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <p className="text-sm">Записів ще немає.</p>
              <Button size="sm" variant="outline" className="cursor-pointer" onClick={openCreate}>
                Додати перший запис
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Записи часу</caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Дата</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Проєкт</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Тривалість</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Опис</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className="sr-only">Дії</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((entry) => (
                    <tr key={entry.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
                      <td className="whitespace-nowrap px-4 py-3 text-foreground">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3 text-foreground">{entry.projectName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-foreground">{formatDuration(entry.durationMinutes)}</td>
                      <td className="px-4 py-3 text-foreground">{entry.description || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer gap-1.5"
                            onClick={() => openEdit(entry)}
                            aria-label={`Редагувати запис від ${formatDate(entry.date)}`}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Редагувати
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-3 h-8 w-8 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setDeleteTarget(entry)}
                            aria-label={`Видалити запис від ${formatDate(entry.date)}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <TimeEntryDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        entry={editing}
        projects={projects}
        onSave={(data) => onSave(data, editing?.id)}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Видалити запис часу?"
        summary={deleteTarget
          ? `${formatDate(deleteTarget.date)} · ${deleteTarget.projectName} · ${formatDuration(deleteTarget.durationMinutes)}`
          : ''}
        itemNoun="Запис"
        confirmLabel="Видалити запис"
        onConfirm={() => {
          if (deleteTarget) onDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </main>
  );
}
