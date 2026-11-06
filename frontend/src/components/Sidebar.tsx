import { LayoutDashboard, Clock, FolderOpen, X } from 'lucide-react';
import type { Page } from '../types';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { page: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { page: 'time-entries', label: 'Мої записи часу', icon: Clock },
  { page: 'projects', label: 'Мої проєкти', icon: FolderOpen },
];

export function Sidebar({ currentPage, onNavigate, isOpen, onClose, email }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-border bg-background transition-transform duration-300 lg:static lg:translate-x-0 lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Бічна навігація"
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div>
            <div className="text-xl font-extrabold tracking-widest text-foreground leading-none">
              TIMO
            </div>
            <div className="text-xs font-semibold tracking-[0.2em] text-muted-foreground mt-0.5 uppercase">
              Time Tracking
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-7 w-7"
            onClick={onClose}
            aria-label="Закрити меню"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4" aria-label="Головне меню">
          <p className="px-2 mb-2 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
            Робочий простір
          </p>
          <ul role="list" className="space-y-0.5">
            {NAV_ITEMS.map(({ page, label, icon: Icon }) => (
              <li key={page}>
                <button
                  onClick={() => { onNavigate(page); onClose(); }}
                  aria-current={currentPage === page ? 'page' : undefined}
                  aria-label={`Перейти до: ${label}`}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    currentPage === page
                      ? 'bg-foreground text-background hover:bg-foreground/85'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User footer */}
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground mb-0.5 font-medium">Користувач:</p>
          <p className="text-sm font-semibold text-foreground truncate">{email}</p>
        </div>
      </aside>
    </>
  );
}
