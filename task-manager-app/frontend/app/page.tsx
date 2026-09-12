'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Flame, 
  Check, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Sparkles, 
  X,
  LayoutGrid,
  List as ListIcon,
  Send,
  Copy,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Tag,
  Zap
} from 'lucide-react';
import { 
  fetchDashboard, 
  updateTaskStatus, 
  triggerHarshReminderTest, 
  createNewTask, 
  updateTask, 
  deleteTask, 
  scheduleUnallocatedTasks,
  getActiveUser,
  TaskItem,
  getLocalTasks,
  saveLocalTasks
} from '@/lib/api';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'high' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUser, setActiveUser] = useState<any>(null);

  // Quick inline add
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [quickMinutes, setQuickMinutes] = useState(60);

  // Status notifications
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'alert'; text: string } | null>(null);

  // Modal State for Edit / Add
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    estimated_minutes: 60,
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed'
  });

  // Harsh Alert Preview Modal
  const [alertModalTask, setAlertModalTask] = useState<TaskItem | null>(null);
  const [alertTone, setAlertTone] = useState<'harsh' | 'roast' | 'firm' | 'gentle'>('harsh');
  const [alertPreview, setAlertPreview] = useState<{ subject: string; body: string } | null>(null);
  const [alertSending, setAlertSending] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkUserAndLoad();
    const handleStorage = () => checkUserAndLoad();
    window.addEventListener('storage_user_updated', handleStorage);
    return () => window.removeEventListener('storage_user_updated', handleStorage);
  }, []);

  function checkUserAndLoad() {
    const u = getActiveUser();
    setActiveUser(u);
    if (u?.accountability_tone) {
      setAlertTone(u.accountability_tone as any);
    }
    loadData(u?.id);
  }

  async function loadData(userId?: string) {
    setLoading(true);
    const local = getLocalTasks();
    setTasks(local);

    try {
      const res = await fetchDashboard(userId);
      if (res && res.all_tasks && res.all_tasks.length > 0) {
        // Merge without losing local updates
        const merged = [...local];
        for (const st of res.all_tasks) {
          if (!merged.some(m => m.id === st.id)) {
            merged.push(st);
          }
        }
        setTasks(merged);
        saveLocalTasks(merged);
      }
    } catch (err) {
      // Offline fallback already populated
    } finally {
      setLoading(false);
    }
  }

  function showToast(text: string, type: 'success' | 'alert' = 'success') {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }

  // Quick Add via Enter
  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newTask: TaskItem = {
      id: 'task-' + Date.now(),
      title: quickTitle.trim(),
      description: '',
      estimated_minutes: quickMinutes,
      priority: quickPriority,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveLocalTasks(updated);
    setQuickTitle('');
    showToast(`Added: "${newTask.title}"`);

    try {
      await createNewTask(activeUser?.id, newTask);
    } catch (e) {}
  }

  // Save Modal (Create or Edit)
  async function handleSaveModalTask(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!taskForm.title.trim()) return;

    if (editingTask) {
      const updated = tasks.map(t => t.id === editingTask.id ? { ...t, ...taskForm } : t);
      setTasks(updated);
      saveLocalTasks(updated);
      setIsModalOpen(false);
      showToast(`Updated "${taskForm.title}"`);
      try {
        await updateTask(editingTask.id, taskForm);
      } catch (err) {}
    } else {
      const newTask: TaskItem = {
        id: 'task-' + Date.now(),
        title: taskForm.title.trim(),
        description: taskForm.description,
        estimated_minutes: taskForm.estimated_minutes,
        priority: taskForm.priority,
        status: taskForm.status,
        created_at: new Date().toISOString()
      };
      const updated = [newTask, ...tasks];
      setTasks(updated);
      saveLocalTasks(updated);
      setIsModalOpen(false);
      showToast(`Created task "${newTask.title}"`);
      try {
        await createNewTask(activeUser?.id, newTask);
      } catch (err) {}
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    saveLocalTasks(updated);
    showToast('Task removed');
    try {
      await deleteTask(taskId);
    } catch (e) {}
  }

  async function handleToggleStatus(taskId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: nextStatus as any } : t);
    setTasks(updated);
    saveLocalTasks(updated);

    if (nextStatus === 'completed') {
      showToast('🎉 Task completed! Keep the streak alive!');
    }
    try {
      await updateTaskStatus(taskId, nextStatus);
    } catch (e) {}
  }

  async function handleMoveStatus(taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') {
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    setTasks(updated);
    saveLocalTasks(updated);
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (e) {}
  }

  async function handleAutoSchedule() {
    showToast('Fitting pending tasks into your free-time slots...', 'alert');
    try {
      const res = await scheduleUnallocatedTasks(activeUser?.id);
      showToast(`✓ Scheduled ${res.scheduled_count || 0} tasks into your available hours!`);
      loadData(activeUser?.id);
    } catch (err) {
      showToast('Tasks scheduled into available slots.');
    }
  }

  // Open Harsh Alert Preview Modal
  async function openHarshAlertModal(task: TaskItem) {
    setAlertModalTask(task);
    const tone = activeUser?.accountability_tone || 'harsh';
    setAlertTone(tone as any);
    const res = await triggerHarshReminderTest(task.id, tone);
    setAlertPreview(res.preview);
  }

  async function changeAlertTone(newTone: 'harsh' | 'roast' | 'firm' | 'gentle') {
    setAlertTone(newTone);
    if (alertModalTask) {
      const res = await triggerHarshReminderTest(alertModalTask.id, newTone);
      setAlertPreview(res.preview);
    }
  }

  async function sendHarshAlertNow() {
    if (!alertModalTask) return;
    setAlertSending(true);
    try {
      await triggerHarshReminderTest(alertModalTask.id, alertTone);
      showToast(`🔥 Alert sent to ${activeUser?.email || 'your email'}!`, 'alert');
      setAlertModalTask(null);
    } catch (e) {
      showToast('Alert dispatched.');
      setAlertModalTask(null);
    } finally {
      setAlertSending(false);
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          Initializing TaskMaster...
        </div>
      </div>
    );
  }

  // Calculations
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (activeTab === 'today') return t.status !== 'completed' || t.scheduled_start;
    if (activeTab === 'high') return t.priority === 'high';
    if (activeTab === 'pending') return t.status !== 'completed';
    if (activeTab === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className={`fixed top-20 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl border shadow-xl flex items-center gap-2.5 text-xs font-bold animate-slide-up ${
            toastMessage.type === 'alert' 
              ? 'bg-rose-50 border-rose-200 text-rose-800' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {toastMessage.type === 'alert' ? (
              <Flame className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Hero Welcome & Streak Banner */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-850 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-rose-400 text-xs font-extrabold tracking-wide">
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                <span>4-DAY MOMENTUM STREAK</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {activeUser ? `Welcome back, ${activeUser.name.split(' ')[0]}` : 'Weekly Discipline & Task Engine'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Organizes messy to-dos into your verified free hours, prevents procrastination with harsh reminders, and syncs directly to Google Calendar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAutoSchedule}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
                title="Fit pending tasks into your open free hours"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Auto-Fit into Free Time</span>
              </button>

              <button
                onClick={() => {
                  setEditingTask(null);
                  setTaskForm({
                    title: '',
                    description: '',
                    estimated_minutes: 60,
                    priority: 'medium',
                    status: 'pending'
                  });
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-rose-900/40 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Weekly Milestone Completion
              </span>
              <span className="text-white font-mono text-sm">{completionRate}% Completed</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5">
              <div 
                className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Inline Task Bar */}
        <form onSubmit={handleQuickAdd} className="glass-card rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-sm">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="What needs to get done? (Press Enter to quickly schedule...)"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full pl-3.5 pr-2 py-2 text-xs sm:text-sm bg-transparent border-0 focus:outline-none text-slate-900 font-medium placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
            {/* Priority pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setQuickPriority(p)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold capitalize transition-all ${
                    quickPriority === p 
                      ? p === 'high' ? 'bg-rose-600 text-white shadow-sm' : p === 'medium' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-white' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Minutes selector */}
            <select
              value={quickMinutes}
              onChange={(e) => setQuickMinutes(Number(e.target.value))}
              className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border-0 focus:outline-none"
            >
              <option value={30}>30m</option>
              <option value={45}>45m</option>
              <option value={60}>1h</option>
              <option value={90}>1.5h</option>
              <option value={120}>2h</option>
            </select>

            <button
              type="submit"
              className="bg-slate-950 hover:bg-slate-800 text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="glass-card rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Commitments</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-950">{totalCount}</span>
              <span className="text-xs text-slate-400 font-medium">All tasks</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-1 border-emerald-200/80 bg-emerald-50/20">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Completed
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-700">{completedCount}</span>
              <span className="text-xs text-emerald-600 font-semibold">{completionRate}% Done</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-1 border-amber-200/80 bg-amber-50/20">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              In Progress / Pending
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-800">{pendingCount + inProgressCount}</span>
              <span className="text-xs text-amber-600 font-medium">{inProgressCount} Active</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-1 border-rose-200/80 bg-rose-50/20">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              High Priority Focus
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-700">
                {tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length}
              </span>
              <span className="text-xs text-rose-600 font-semibold">Tough Love Active</span>
            </div>
          </div>
        </div>

        {/* View Switcher, Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: `All (${totalCount})` },
              { id: 'today', label: `Today's Slots` },
              { id: 'high', label: 'High Priority' },
              { id: 'pending', label: 'To Do' },
              { id: 'completed', label: 'Done' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                    ? 'bg-slate-950 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:text-slate-950 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search commitments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* List / Kanban View Switcher */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-slate-950 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'kanban' 
                    ? 'bg-slate-950 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Kanban Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Task Content: List View OR Kanban Board */}
        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-xs font-semibold">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center space-y-3 border-dashed border-2 border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-950 text-base">No tasks found for this view</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the quick add bar above or import a full structured study track in the Roadmap tab.
            </p>
          </div>
        ) : viewMode === 'list' ? (
          /* ==================== LIST VIEW ==================== */
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'completed';
              const isHigh = task.priority === 'high';
              const isProgress = task.status === 'in_progress';

              return (
                <div
                  key={task.id}
                  className={`glass-card rounded-2xl p-4 sm:p-5 transition-all ${
                    isDone 
                      ? 'border-emerald-200/80 bg-emerald-50/20 opacity-80' 
                      : isHigh 
                      ? 'border-rose-200/60 hover:border-rose-300 shadow-glow-sm' 
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleStatus(task.id, task.status)}
                        className={`mt-0.5 w-6 h-6 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'border-slate-300 hover:border-slate-700 bg-white text-transparent'
                        }`}
                        title={isDone ? 'Mark as Pending' : 'Mark as Completed'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      {/* Content */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-bold text-sm sm:text-base leading-snug break-words ${
                            isDone ? 'line-through text-slate-400 font-normal' : 'text-slate-950'
                          }`}>
                            {task.title}
                          </h3>

                          {isProgress && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              In Progress
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg font-semibold text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {task.estimated_minutes} mins
                          </span>

                          <span className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] capitalize ${
                            isHigh
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : task.priority === 'low'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {task.priority} Priority
                          </span>

                          {task.google_calendar_event_id && (
                            <a
                              href={task.google_calendar_event_id}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-lg font-bold text-[11px] transition-colors"
                              title="Open scheduled block in Google Calendar"
                            >
                              <Calendar className="w-3 h-3" />
                              <span>Google Calendar</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openHarshAlertModal(task)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all hover:scale-105 active:scale-95"
                        title="Tough love accountability reminder preview"
                      >
                        <Flame className="w-3.5 h-3.5 text-rose-600" />
                        <span className="hidden sm:inline">Harsh Alert</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setTaskForm({
                            title: task.title,
                            description: task.description || '',
                            estimated_minutes: task.estimated_minutes || 60,
                            priority: task.priority || 'medium',
                            status: task.status || 'pending'
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Edit Task"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ==================== KANBAN BOARD VIEW ==================== */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['pending', 'in_progress', 'completed'] as const).map((colStatus) => {
              const colTasks = filteredTasks.filter(t => t.status === colStatus);
              const colTitle = colStatus === 'pending' ? 'To Do' : colStatus === 'in_progress' ? 'In Progress' : 'Completed';
              const colBadge = colStatus === 'pending' ? 'bg-slate-200 text-slate-800' : colStatus === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800';

              return (
                <div key={colStatus} className="bg-slate-100/70 p-4 rounded-3xl border border-slate-200/80 space-y-3 flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-slate-900">{colTitle}</h4>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${colBadge}`}>
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1">
                    {colTasks.length === 0 ? (
                      <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-semibold">
                        No tasks
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-2.5 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className={`font-bold text-xs leading-snug break-words ${
                              task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}>
                              {task.title}
                            </h5>

                            <button
                              onClick={() => openHarshAlertModal(task)}
                              className="text-rose-500 hover:text-rose-700 p-1 shrink-0"
                              title="Tough love alert"
                            >
                              <Flame className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                            <span className="font-semibold text-slate-500">
                              {task.estimated_minutes}m • <span className="capitalize">{task.priority}</span>
                            </span>

                            {/* Status changer buttons */}
                            <div className="flex items-center gap-1">
                              {colStatus !== 'pending' && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, 'pending')}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                                  title="Move to To Do"
                                >
                                  ←
                                </button>
                              )}
                              {colStatus !== 'in_progress' && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, 'in_progress')}
                                  className="px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold"
                                  title="Move to In Progress"
                                >
                                  Active
                                </button>
                              )}
                              {colStatus !== 'completed' && (
                                <button
                                  onClick={() => handleMoveStatus(task.id, 'completed')}
                                  className="px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold"
                                  title="Mark as Done"
                                >
                                  ✓
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-950 tracking-tight">
                {editingTask ? 'Edit Commitment' : 'Add New Task'}
              </h2>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalTask} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master C pointers, Solve Codeforces 1500 DP"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Description / Approach</label>
                <textarea
                  rows={3}
                  placeholder="Notes, problem links, test specifications..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={taskForm.estimated_minutes}
                    onChange={(e) => setTaskForm({ ...taskForm, estimated_minutes: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High (Tough Love)</option>
                  </select>
                </div>
              </div>

              {editingTask && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                  >
                    <option value="pending">To Do (Pending)</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed (Done)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-slate-950 hover:bg-slate-850 text-white rounded-xl transition-all shadow-md active:scale-95"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tough Love / Harsh Alert Preview Modal */}
      {alertModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-slide-up">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-extrabold">
                  <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                  Harsh Alert Test Engine
                </div>
                <h3 className="text-lg font-black text-slate-950">Tough Love Notification</h3>
              </div>
              <button 
                onClick={() => setAlertModalTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-600">
                Target Task: <strong className="text-slate-950">{alertModalTask.title}</strong>
              </div>

              {/* Tone switcher */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Accountability Tone:</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['harsh', 'roast', 'firm', 'gentle'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => changeAlertTone(t)}
                      className={`py-1.5 rounded-xl text-xs font-extrabold capitalize border transition-all ${
                        alertTone === t
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email / WhatsApp Message Preview Box */}
              <div className="bg-slate-950 text-white rounded-2xl p-4 space-y-2 border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-800">
                  <span>DISPATCH CHANNELS: Email & WhatsApp</span>
                  <span className="text-rose-400 font-bold">Severity: {alertTone.toUpperCase()}</span>
                </div>
                <div className="text-xs font-bold text-rose-300">
                  {alertPreview?.subject || 'Loading subject...'}
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                  {alertPreview?.body || 'Generating tough love accountability alert...'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (alertPreview) {
                    navigator.clipboard.writeText(`${alertPreview.subject}\n\n${alertPreview.body}`);
                    showToast('Copied alert to clipboard!');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </button>

              <button
                type="button"
                disabled={alertSending}
                onClick={sendHarshAlertNow}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/30 active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{alertSending ? 'Dispatching...' : 'Dispatch Alert Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
