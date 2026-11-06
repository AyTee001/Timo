import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import type { Project, ProjectFormData, ProjectFormErrors } from '../types';
import { cn } from '../lib/utils';

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onSave: (data: ProjectFormData) => Promise<void>;
}

const ERROR_TEXT = 'text-sm font-medium text-red-700';
const ERROR_BORDER = 'border-red-600 hover:border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/30';
const PROJECT_DESCRIPTION_MAX_LENGTH = 500;

function validate(data: ProjectFormData): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  if (!data.name.trim()) errors.name = 'Введіть назву проєкту.';
  if (data.description.length > PROJECT_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Опис не може перевищувати ${PROJECT_DESCRIPTION_MAX_LENGTH} символів.`;
  }
  return errors;
}

interface ProjectFormProps {
  project?: Project;
  onSave: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
}

function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const [form, setForm] = useState<ProjectFormData>(() => ({
    name: project?.name ?? '',
    description: project?.description ?? '',
  }));
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (patch: Partial<ProjectFormData>) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (submitAttempted) setErrors(validate(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setSubmitAttempted(true);
    setErrors(found);
    if (Object.keys(found).length === 0) {
      setSaving(true);
      setSaveError('');
      try {
        await onSave({ name: form.name.trim(), description: form.description.trim() });
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Не вдалося зберегти проєкт.');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={project ? 'Редагувати проєкт' : 'Новий проєкт'} className="flex flex-col gap-5">
      {submitAttempted && errors.name && (
        <div role="alert" className="rounded-md border border-red-600 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Не вдалося зберегти проєкт. Перевірте обов’язкові поля.
        </div>
      )}
      {saveError && (
        <div role="alert" className="rounded-md border border-red-600 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {saveError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="project-name">Назва проєкту <span aria-hidden="true">*</span></Label>
        <Input
          id="project-name"
          placeholder="Напр. Новий вебсайт"
          maxLength={100}
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          className={cn('transition-colors hover:border-ring', errors.name && ERROR_BORDER)}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'project-name-error' : undefined}
        />
        {errors.name && <p id="project-name-error" className={ERROR_TEXT}>{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="project-description">Опис</Label>
        <Textarea
          id="project-description"
          rows={4}
          maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
          placeholder="Короткий опис проєкту"
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          className="transition-colors hover:border-ring"
          aria-invalid={!!errors.description}
        />
        {errors.description && <p className={ERROR_TEXT}>{errors.description}</p>}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-start">
        <Button type="submit" className="cursor-pointer" disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти'}
        </Button>
        <Button type="button" variant="secondary" className="cursor-pointer" onClick={onCancel}>
          Скасувати
        </Button>
      </div>
    </form>
  );
}

export function ProjectDialog({ open, onOpenChange, project, onSave }: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg" showCloseButton={false}>
        <div className="flex items-center justify-between gap-4">
          <DialogTitle className="text-lg font-bold">
            {project ? 'Редагувати проєкт' : 'Новий проєкт'}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="secondary" size="sm" className="cursor-pointer gap-1.5" aria-label="Закрити">
              <X className="h-4 w-4" aria-hidden="true" />
              Закрити
            </Button>
          </DialogClose>
        </div>
        <DialogDescription className="sr-only">
          {project ? 'Форма редагування проєкту' : 'Форма створення нового проєкту'}
        </DialogDescription>
        <ProjectForm
          project={project}
          onSave={async (data) => { await onSave(data); onOpenChange(false); }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
