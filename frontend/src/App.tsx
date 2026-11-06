import { useEffect, useState } from 'react';
import { Toaster } from './components/ui/sonner';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { TimeEntries } from './pages/TimeEntries';
import { Projects } from './pages/Projects';
import type { Page, Project, ProjectFormData, TimeEntry, TimeEntryInput } from './types';
import { authApi, projectsApi, type AuthenticatedUser } from './services/api';
import { toast } from 'sonner';

let nextEntryId = 100;

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState('');

  const loadProjects = async () => {
    setProjectsLoading(true);
    setProjectsError('');
    try {
      setProjects(await projectsApi.list());
    } catch (error) {
      setProjectsError(error instanceof Error ? error.message : 'Не вдалося завантажити проєкти.');
      throw error;
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const currentUser = await authApi.currentUser();
        if (!active) return;
        setUser(currentUser);
        if (currentUser) {
          try {
            await loadProjects();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Не вдалося завантажити проєкти.');
          }
        }
      } catch {
        if (active) toast.error('Не вдалося підключитися до сервера.');
      } finally {
        if (active) setAuthLoading(false);
      }
    })();

    return () => { active = false; };
  }, []);

  const handleAuthenticated = async (authenticatedUser: AuthenticatedUser) => {
    setUser(authenticatedUser);
    try {
      await loadProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не вдалося завантажити проєкти.');
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setProjects([]);
      setProjectsError('');
      setTimeEntries([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не вдалося вийти з облікового запису.');
    }
  };

  const handleSaveEntry = (data: TimeEntryInput, entryId?: string) => {
    const project = projects.find((p) => p.id === data.projectId);
    if (!project) return;
    const fields = {
      date: data.date,
      projectId: project.id,
      projectName: project.name,
      durationMinutes: data.durationMinutes,
      description: data.description,
    };
    if (entryId) {
      setTimeEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, ...fields } : e)));
    } else {
      setTimeEntries((prev) => [...prev, { ...fields, id: `e${++nextEntryId}` }]);
    }
  };

  const handleDeleteEntry = (id: string) => {
    setTimeEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSaveProject = async (data: ProjectFormData, projectId?: string) => {
    if (projectId) {
      const updatedProject = await projectsApi.update(projectId, data);
      setProjects((prev) => prev.map((project) => project.id === projectId ? updatedProject : project));
      setTimeEntries((prev) =>
        prev.map((e) => (e.projectId === projectId ? { ...e, projectName: data.name } : e))
      );
    } else {
      const project = await projectsApi.create(data);
      setProjects((prev) => [...prev, project].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const handleDeleteProject = async (id: string) => {
    await projectsApi.delete(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTimeEntries((prev) => prev.filter((e) => e.projectId !== id));
  };

  if (authLoading) {
    return <main className="flex min-h-svh items-center justify-center text-sm text-muted-foreground" role="status">Завантаження…</main>;
  }

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        email={user.email}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header currentPage={currentPage} onMenuOpen={() => setSidebarOpen(true)} email={user.email} onLogout={handleLogout} />

        {currentPage === 'dashboard' && (
          <Dashboard
            timeEntries={timeEntries}
            onNavigateToEntries={() => setCurrentPage('time-entries')}
          />
        )}
        {currentPage === 'time-entries' && (
          <TimeEntries
            timeEntries={timeEntries}
            projects={projects}
            onSave={handleSaveEntry}
            onDelete={handleDeleteEntry}
          />
        )}
        {currentPage === 'projects' && (
          <Projects
            projects={projects}
            onSave={handleSaveProject}
            onDelete={handleDeleteProject}
            isLoading={projectsLoading}
            loadError={projectsError}
            onRetry={() => { void loadProjects().catch(() => undefined); }}
          />
        )}
      </div>

      <Toaster />
    </div>
  );
}
