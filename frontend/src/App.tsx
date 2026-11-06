import { useEffect, useState } from 'react';
import { Toaster } from './components/ui/sonner';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { TimeEntries } from './pages/TimeEntries';
import { Projects } from './pages/Projects';
import type { Page, Project, ProjectFormData, TimeEntry, TimeEntryInput } from './types';
import { authApi, projectsApi, timeEntriesApi, type AuthenticatedUser } from './services/api';
import { toast } from 'sonner';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [timeEntriesLoading, setTimeEntriesLoading] = useState(false);
  const [timeEntriesError, setTimeEntriesError] = useState('');

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

  const loadTimeEntries = async () => {
    setTimeEntriesLoading(true);
    setTimeEntriesError('');
    try {
      setTimeEntries(await timeEntriesApi.list());
    } catch (error) {
      setTimeEntriesError(error instanceof Error ? error.message : 'Не вдалося завантажити записи часу.');
      throw error;
    } finally {
      setTimeEntriesLoading(false);
    }
  };

  const loadWorkspace = async () => {
    const results = await Promise.allSettled([loadProjects(), loadTimeEntries()]);
    for (const result of results) {
      if (result.status === 'rejected') {
        toast.error(result.reason instanceof Error ? result.reason.message : 'Не вдалося завантажити дані.');
      }
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
          await loadWorkspace();
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
    await loadWorkspace();
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setProjects([]);
      setProjectsError('');
      setTimeEntries([]);
      setTimeEntriesError('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не вдалося вийти з облікового запису.');
    }
  };

  const handleSaveEntry = async (data: TimeEntryInput, entryId?: string) => {
    const oldEntry = entryId ? timeEntries.find((entry) => entry.id === entryId) : undefined;
    const savedEntry = entryId
      ? await timeEntriesApi.update(entryId, data)
      : await timeEntriesApi.create(data);
    if (entryId) {
      setTimeEntries((prev) => prev.map((entry) => entry.id === entryId ? savedEntry : entry));
    } else {
      setTimeEntries((prev) => [...prev, savedEntry]);
    }
    if (oldEntry && oldEntry.projectId !== savedEntry.projectId) {
      setProjects((prev) => prev.map((project) => ({
        ...project,
        timeEntriesCount: Math.max(0, project.timeEntriesCount + (
          project.id === oldEntry.projectId ? -1 : project.id === savedEntry.projectId ? 1 : 0
        )),
      })));
    } else if (!oldEntry) {
      setProjects((prev) => prev.map((project) => project.id === savedEntry.projectId
        ? { ...project, timeEntriesCount: project.timeEntriesCount + 1 }
        : project));
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const entry = timeEntries.find((item) => item.id === id);
    await timeEntriesApi.delete(id);
    setTimeEntries((prev) => prev.filter((e) => e.id !== id));
    if (entry) {
      setProjects((prev) => prev.map((project) => project.id === entry.projectId
        ? { ...project, timeEntriesCount: Math.max(0, project.timeEntriesCount - 1) }
        : project));
    }
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
            isLoading={timeEntriesLoading}
            loadError={timeEntriesError}
            onRetry={() => { void loadTimeEntries().catch(() => undefined); }}
            onNavigateToProjects={() => setCurrentPage('projects')}
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
