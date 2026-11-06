import { useState, useMemo } from 'react';
import { Download, Clock, FolderOpen, AlignJustify } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import type { TimeEntry } from '../types';
import { formatDuration, formatDate } from '../data/mockData';

interface DashboardProps {
  timeEntries: TimeEntry[];
  onNavigateToEntries: () => void;
}

type PeriodPreset = 'current-week' | 'last-week' | 'current-month' | 'last-month' | 'custom';

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'current-week', label: 'Поточний тиждень' },
  { value: 'last-week', label: 'Минулий тиждень' },
  { value: 'current-month', label: 'Поточний місяць' },
  { value: 'last-month', label: 'Минулий місяць' },
  { value: 'custom', label: 'Власний діапазон' },
];

const DAYS_UK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function getWeekRange(offset = 0): [string, string] {
  const now = new Date('2026-10-30');
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return [fmt(monday), fmt(sunday)];
}

function getMonthRange(offset = 0): [string, string] {
  const now = new Date('2026-10-30');
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return [fmt(start), fmt(end)];
}

function presetToRange(preset: PeriodPreset): [string, string] {
  if (preset === 'current-week') return getWeekRange(0);
  if (preset === 'last-week') return getWeekRange(-1);
  if (preset === 'current-month') return getMonthRange(0);
  if (preset === 'last-month') return getMonthRange(-1);
  return getWeekRange(0);
}

const PROJECT_CHART_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#06b6d4'];

export function Dashboard({ timeEntries, onNavigateToEntries }: DashboardProps) {
  const [period, setPeriod] = useState<PeriodPreset>('current-week');
  const [dateFrom, setDateFrom] = useState(() => presetToRange('current-week')[0]);
  const [dateTo, setDateTo] = useState(() => presetToRange('current-week')[1]);
  const [appliedFrom, setAppliedFrom] = useState(dateFrom);
  const [appliedTo, setAppliedTo] = useState(dateTo);

  const handlePeriodChange = (val: PeriodPreset) => {
    setPeriod(val);
    if (val !== 'custom') {
      const [from, to] = presetToRange(val);
      setDateFrom(from);
      setDateTo(to);
    }
  };

  const handleApply = () => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  };

  const filtered = useMemo(
    () => timeEntries.filter((e) => e.date >= appliedFrom && e.date <= appliedTo),
    [timeEntries, appliedFrom, appliedTo]
  );

  const totalMinutes = useMemo(() => filtered.reduce((s, e) => s + e.durationMinutes, 0), [filtered]);

  const activeProjectIds = useMemo(
    () => new Set(filtered.map((e) => e.projectId)),
    [filtered]
  );

  // Time by project for pie chart
  const timeByProject = useMemo(() => {
    const map: Record<string, { name: string; minutes: number }> = {};
    filtered.forEach((e) => {
      if (!map[e.projectId]) map[e.projectId] = { name: e.projectName, minutes: 0 };
      map[e.projectId].minutes += e.durationMinutes;
    });
    return Object.entries(map).map(([id, v], i) => ({
      id,
      name: v.name,
      minutes: v.minutes,
      color: PROJECT_CHART_COLORS[i % PROJECT_CHART_COLORS.length],
    }));
  }, [filtered]);

  // Time by day of week for bar chart
  const timeByDay = useMemo(() => {
    const map: Record<string, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    filtered.forEach((e) => {
      const d = new Date(e.date + 'T00:00:00');
      const dow = (d.getDay() + 6) % 7; // Monday=0
      map[dow] = (map[dow] || 0) + e.durationMinutes;
    });
    return DAYS_UK.map((day, i) => ({ day, hours: +(map[i] / 60).toFixed(1) }));
  }, [filtered]);

  const handleExportCsv = () => {
    const header = ['Дата', 'Проєкт', 'Тривалість (хв)', 'Опис'];
    const rows = filtered.map((e) => [formatDate(e.date), e.projectName, String(e.durationMinutes), e.description]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `timo-${appliedFrom}_${appliedTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const recentEntries = useMemo(() => [...timeEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [timeEntries]);

  return (
    <main className="flex-1 overflow-y-auto p-4 lg:p-6" aria-label="Дашборд">
      {/* Page title */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Дашборд</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Зведена статистика вашого робочого часу.</p>
        </div>
        <Button variant="outline" size="sm" className="self-start shrink-0 gap-1.5" onClick={handleExportCsv}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Експортувати CSV
        </Button>
      </div>

      {/* Period filter */}
      <section aria-labelledby="filter-heading" className="mb-5">
        <h2 id="filter-heading" className="sr-only">Фільтр за періодом</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="period-select" className="text-sm font-medium text-foreground">Період</label>
            <Select value={period} onValueChange={(v) => handlePeriodChange(v as PeriodPreset)}>
              <SelectTrigger id="period-select" className="w-48 cursor-pointer transition-colors hover:bg-accent/50" aria-label="Оберіть період">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date-from" className="text-sm font-medium text-foreground">Від</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPeriod('custom'); }}
              className="h-9 w-36 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Дата початку"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date-to" className="text-sm font-medium text-foreground">До</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPeriod('custom'); }}
              className="h-9 w-36 cursor-pointer rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Дата кінця"
            />
          </div>
          <Button onClick={handleApply} variant="outline" size="sm" aria-label="Застосувати фільтр">
            Застосувати
          </Button>
        </div>
      </section>

      {/* Stats cards */}
      <section aria-labelledby="stats-heading" className="mb-5">
        <h2 id="stats-heading" className="sr-only">Статистика</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="p-4">
            <dl>
              <div className="flex items-center justify-between mb-2">
                <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Загальний час</dt>
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <dd className="text-2xl font-bold text-foreground">{formatDuration(totalMinutes)}</dd>
              <dd className="text-xs text-muted-foreground mt-1">За обраний період</dd>
            </dl>
          </Card>

          <Card className="p-4">
            <dl>
              <div className="flex items-center justify-between mb-2">
                <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Активні проєкти</dt>
                <FolderOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <dd className="text-2xl font-bold text-foreground">{activeProjectIds.size}</dd>
              <dd className="text-xs text-muted-foreground mt-1">Мають записи за період</dd>
            </dl>
          </Card>

          <Card className="p-4">
            <dl>
              <div className="flex items-center justify-between mb-2">
                <dt className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Записи часу</dt>
                <AlignJustify className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <dd className="text-2xl font-bold text-foreground">{filtered.length}</dd>
              <dd className="text-xs text-muted-foreground mt-1">У межах обраного періоду</dd>
            </dl>
          </Card>
        </div>
      </section>

      {/* Charts */}
      <section aria-labelledby="charts-heading" className="mb-5">
        <h2 id="charts-heading" className="sr-only">Графіки</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pie chart */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Розподіл часу за проєктами</h3>
            {timeByProject.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Немає даних за обраний період
              </div>
            ) : (
              <div className="flex items-center justify-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={timeByProject}
                      dataKey="minutes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={0}
                      aria-label="Кругова діаграма розподілу часу за проєктами"
                    >
                      {timeByProject.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [formatDuration(Number(value)), name]}
                      contentStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="space-y-2" aria-label="Легенда діаграми">
                  {timeByProject.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm text-foreground">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                        aria-hidden="true"
                      />
                      {p.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Bar chart */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Час за днями</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={timeByDay} aria-label="Стовпчаста діаграма часу за днями тижня">
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${Number(value)} год`, 'Час']}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="hours" fill="#22c55e" radius={[3, 3, 0, 0]} name="Час" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </section>

      {/* Recent entries */}
      <section aria-labelledby="recent-heading">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 id="recent-heading" className="text-sm font-semibold text-foreground">Останні записи</h2>
            <button
              onClick={onNavigateToEntries}
              className="text-sm font-medium text-foreground hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
              aria-label="Переглянути всі записи часу"
            >
              Усі записи →
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Нещодавно доданий час.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Останні записи часу">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Дата</th>
                  <th scope="col" className="py-2 pr-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Проєкт</th>
                  <th scope="col" className="py-2 pr-4 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Тривалість</th>
                  <th scope="col" className="py-2 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide">Опис</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-3 pr-4 text-foreground">{formatDate(entry.date)}</td>
                    <td className="py-3 pr-4 text-foreground">{entry.projectName}</td>
                    <td className="py-3 pr-4 text-foreground">{formatDuration(entry.durationMinutes)}</td>
                    <td className="py-3 text-foreground">{entry.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </main>
  );
}
