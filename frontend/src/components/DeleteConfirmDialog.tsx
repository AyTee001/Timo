import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  title: string;
  summary: string;
  warning?: string;
  itemNoun: string;
  confirmLabel: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function DeleteConfirmDialog({
  open,
  title,
  summary,
  warning,
  itemNoun,
  confirmLabel,
  onConfirm,
  onOpenChange,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg bg-muted px-4 py-3 text-sm font-medium text-foreground">{summary}</div>
        <DialogDescription className="text-sm text-muted-foreground">
          {warning && <span className="mb-1 block font-medium text-red-700">{warning}</span>}
          Цю дію неможливо скасувати. {itemNoun} буде видалено назавжди.
        </DialogDescription>
        <DialogFooter className="gap-2 sm:justify-end">
          <DialogClose asChild>
            <Button variant="outline" className="cursor-pointer">Скасувати</Button>
          </DialogClose>
          <Button
            className="cursor-pointer bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
