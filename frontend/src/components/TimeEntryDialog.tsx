import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import type { Project, TimeEntry, TimeEntryFormData, TimeEntryFormErrors, TimeEntryInput } from '../types';
import { DESCRIPTION_MAX_LENGTH } from '../data/mockData';
import { formatDurationInput, minutesToDurationInput, parseDurationInput } from '../lib/duration';
import { cn } from '../lib/utils';

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: TimeEntry;
  projects: Project[];
  onSave: (data: TimeEntryInput) => Promise<void>;
}

const ERROR_TEXT = 'text-sm font-medium text-red-700';
const ERROR_BORDER = 'border-red-600 hover:border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/30';
const FIELD_HOVER = 'transition-colors hover:border-ring';
const SELECT_CLASS =
  'flex h-9 w-full cursor-pointer appearance-none rounded-md border border-input bg-transparent px-3 pr-9 text-sm text-foreground shadow-xs outline-none transition-colors hover:border-ring focus-visible:ring-2 focus-visible:ring-ring/50';

function todayIso(): string {
  return new Date().toLocaleDateString('en-CA');
}

function validate(data: TimeEntryFormData): TimeEntryFormErrors {
  const errors: TimeEntryFormErrors = {};
  if (!data.projectId) errors.projectId = 'Оберіть проєкт.';
  if (!data.date) errors.date = 'Оберіть дату.';
  const minutes = parseDurationInput(data.duration);
  if (minutes === null) {
    errors.duration = data.duration === ''
      ? 'Вкажіть тривалість у форматі ГГ:хх.'
      : 'Тривалість має бути у форматі ГГ:хх.';
  } else if (minutes === 0) {
    errors.duration = 'Тривалість має бути більшою за 0.';
  }
  if (data.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Опис не може перевищувати ${DESCRIPTION_MAX_LENGTH} символів.`;
  }
  return errors;
}

function initialForm(entry?: TimeEntry): TimeEntryFormData {
  if (!entry) return { projectId: '', date: todayIso(), duration: '', description: '' };
  return {
    projectId: entry.projectId,
    date: entry.date,
    duration: minutesToDurationInput(entry.durationMinutes),
    description: entry.description,
  };
}

interface TimeEntryFormProps {
  entry?: TimeEntry;
  projects: Project[];
  onSave: (data: TimeEntryInput) => Promise<void>;
  onCancel: () => void;
}

function TimeEntryForm({ entry, projects, onSave, onCancel }: TimeEntryFormProps) {
  const [form, setForm] = useState<TimeEntryFormData>(() => initialForm(entry));
  const [errors, setErrors] = useState<TimeEntryFormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const hasErrors = Object.keys(errors).length > 0;

  const update = (patch: Partial<TimeEntryFormData>) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (submitAttempted) setErrors(validate(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    const durationMinutes = parseDurationInput(form.duration);
    setSubmitAttempted(true);
    setErrors(found);
    if (Object.keys(found).length === 0 && durationMinutes !== null) {
      setSaving(true);
      setSaveError('');
      try {
        await onSave({
          projectId: form.projectId,
          date: form.date,
          durationMinutes,
          description: form.description.trim(),
        });
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Не вдалося зберегти запис.');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={entry ? 'Редагувати запис часу' : 'Новий запис часу'} className="flex flex-col gap-5">
      {submitAttempted && hasErrors && (
        <div role="alert" className="rounded-md border border-red-600 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Не вдалося зберегти запис. Перевірте обов’язкові поля.
        </div>
      )}
      {saveError && (
        <div role="alert" className="rounded-md border border-red-600 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {saveError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="entry-project">Проєкт <span aria-hidden="true">*</span></Label>
        <div className="relative">
          <select
            id="entry-project"
            value={form.projectId}
            onChange={(e) => update({ projectId: e.target.value })}
            className={cn(SELECT_CLASS, errors.projectId && ERROR_BORDER)}
            aria-required="true"
            aria-invalid={!!errors.projectId}
            aria-describedby={errors.projectId ? 'entry-project-error' : undefined}
          >
            <option value="">Оберіть проєкт</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        </div>
        {errors.projectId && <p id="entry-project-error" className={ERROR_TEXT}>{errors.projectId}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="entry-date">Дата <span aria-hidden="true">*</span></Label>
          <Input
            id="entry-date"
            type="date"
            value={form.date}
            onChange={(e) => update({ date: e.target.value })}
            className={cn('cursor-pointer', FIELD_HOVER, errors.date && ERROR_BORDER)}
            aria-required="true"
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'entry-date-error' : undefined}
          />
          {errors.date && <p id="entry-date-error" className={ERROR_TEXT}>{errors.date}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="entry-duration">Тривалість (години) <span aria-hidden="true">*</span></Label>
          <Input
            id="entry-duration"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Напр. 02:30"
            maxLength={5}
            value={form.duration}
            onChange={(e) => update({ duration: formatDurationInput(e.target.value) })}
            className={cn(FIELD_HOVER, errors.duration && ERROR_BORDER)}
            aria-required="true"
            aria-invalid={!!errors.duration}
            aria-describedby={errors.duration ? 'entry-duration-error' : 'entry-duration-hint'}
          />
          {errors.duration ? (
            <p id="entry-duration-error" className={ERROR_TEXT}>{errors.duration}</p>
          ) : (
            <p id="entry-duration-hint" className="text-sm text-muted-foreground">Формат ГГ:хх, наприклад 02:30</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="entry-description">Опис роботи</Label>
        <Textarea
          id="entry-description"
          rows={4}
          placeholder="Коротко опишіть виконану роботу (необов’язково)"
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          className={cn(FIELD_HOVER, errors.description && ERROR_BORDER)}
          aria-invalid={!!errors.description}
          aria-describedby="entry-description-counter"
        />
        {errors.description ? (
          <p id="entry-description-counter" className={ERROR_TEXT}>{errors.description}</p>
        ) : (
          <p id="entry-description-counter" className="text-sm text-muted-foreground">
            До {DESCRIPTION_MAX_LENGTH} символів.
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-start">
        <Button type="submit" className="cursor-pointer" disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти запис'}
        </Button>
        <Button type="button" variant="secondary" className="cursor-pointer" onClick={onCancel}>
          Скасувати
        </Button>
      </div>
    </form>
  );
}

export function TimeEntryDialog({ open, onOpenChange, entry, projects, onSave }: TimeEntryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg" showCloseButton={false}>
        <div className="flex items-center justify-between gap-4">
          <DialogTitle className="text-lg font-bold">
            {entry ? 'Редагувати запис часу' : 'Новий запис часу'}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="secondary" size="sm" className="cursor-pointer gap-1.5" aria-label="Закрити">
              <X className="h-4 w-4" aria-hidden="true" />
              Закрити
            </Button>
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">
          {entry ? 'Форма редагування запису часу' : 'Форма створення нового запису часу'}
        </DialogDescription>
        <TimeEntryForm
          entry={entry}
          projects={projects}
          onSave={async (data) => { await onSave(data); onOpenChange(false); }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
