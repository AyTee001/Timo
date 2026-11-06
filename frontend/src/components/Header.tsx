import { LogOut, Menu } from 'lucide-react';
import type { Page } from '../types';
import { Button } from './ui/button';

const PAGE_LABELS: Record<Page, string> = {
  dashboard: 'Дашборд',
  'time-entries': 'Мої записи часу',
  projects: 'Мої проєкти',
};

interface HeaderProps {
  currentPage: Page;
  onMenuOpen: () => void;
  email: string;
  onLogout: () => void;
}

export function Header({ currentPage, onMenuOpen, email, onLogout }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8"
          onClick={onMenuOpen}
          aria-label="Відкрити меню навігації"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <nav aria-label="Хлібні крихти">
          <ol className="flex items-center gap-1.5 text-sm">
            <li>
              <span className="text-muted-foreground font-medium tracking-wide uppercase text-xs">
                Робочий простір
              </span>
            </li>
            <li aria-hidden="true">
              <span className="text-muted-foreground">/</span>
            </li>
            <li>
              <span className="font-semibold text-foreground">{PAGE_LABELS[currentPage]}</span>
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold leading-tight text-foreground">{email}</p>
        </div>
        <Button variant="ghost" size="sm" className="cursor-pointer gap-1.5" onClick={onLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Вийти
        </Button>
      </div>
    </header>
  );
}
