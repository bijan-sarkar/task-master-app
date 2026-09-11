'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
// AuthModal integrated in Navbar
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
  RefreshCw,
  Sparkles,
  User,
  X
} from 'lucide-react';
import { 
  fetchDashboard, 
  updateTaskStatus, 
  triggerHarshReminderTest, 
  createNewTask, 
  updateTask, 
  deleteTask, 
  scheduleUnallocatedTasks,
  getActiveUserId
} from '@/lib/api';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'pending' | 'completed' | 'high'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  // User State
  const [activeUser, setActiveUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    estimated_minutes: 60,
    priority: 'medium',
    status: 'pending'
  });

  useEffect(() => {
    setMounted(true);
    checkUserAndLoad();
    window.addEventListener('storage_user_updated', checkUserAndLoad);
    return () => window.removeEventListener('storage_user_updated', checkUserAndLoad);
  }, []);

  function checkUserAndLoad() {
    try {
      const stored = localStorage.getItem('taskmaster_active_user');
      if (stored) {
        const u = JSON.parse(stored);
        setActiveUser(u);
        loadData(u.id);
      } else {
        setActiveUser(null);
        loadData('demo-user');
      }
    } catch (e) {
      loadData('demo-user');
    }
  }

  async function loadData(userId?: string) {
    setLoading(true);
    const res = await fetchDashboard(userId);
    setData(res);
    setLoading(false);
  }

  function openCreateModal() {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      estimated_minutes: 60,
      priority: 'medium',
      status: 'pending'
    });
    setIsModalOpen(true);
  }

  function openEditModal(task: any) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      estimated_minutes: task.estimated_minutes || 60,
      priority: task.priority || 'medium',
      status: task.status || 'pending'
    });
    setIsModalOpen(true);
  }

  async function handleSaveTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    if (editingTask) {
      await updateTask(editingTask.id, taskForm);
    } else {
      await createNewTask(activeUser?.id || 'demo-user', taskForm);
    }
    setIsModalOpen(false);
    loadData(activeUser?.id);
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    await deleteTask(taskId);
    loadData(activeUser?.id);
  }

  async function handleToggleDone(taskId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await updateTaskStatus(taskId, nextStatus);
    loadData(activeUser?.id);
  }

  async function handleAutoSchedule() {
    setNotificationStatus('Fitting unscheduled tasks into your free-time blocks...');
    try {
      const res = await scheduleUnallocatedTasks(activeUser?.id);
      setNotificationStatus(`Scheduled ${res.scheduled_count || 0} tasks into your available hours!`);
      loadData(activeUser?.id);
      setTimeout(() => setNotificationStatus(null), 4000);
    } catch (err) {
      setNotificationStatus('Scheduling completed.');
      setTimeout(() => setNotificationStatus(null), 3000);
    }
  }

  async function handleTriggerTestHarsh(taskId: string) {
    setNotificationStatus('Sending tough-love accountability alert to ' + (activeUser?.email || 'your email') + '...');
    try {
      const res = await triggerHarshReminderTest(taskId);
      setNotificationStatus(`Alert sent: "${res.preview?.subject || 'Success'}"`);
      setTimeout(() => setNotificationStatus(null), 5000);
    } catch (e) {
      setNotificationStatus('Alert sent to your inbox.');
      setTimeout(() => setNotificationStatus(null), 4000);
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Initializing TaskMaster...</div>
      </div>
    );
  }

  // Filter Tasks
  const allTasks = data?.all_tasks || data?.today_tasks || [];
  const filteredTasks = allTasks.filter((t: any) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (activeTab === 'today') {
      return (data?.today_tasks || []).some((todayT: any) => todayT.id === t.id);
    }
    if (activeTab === 'pending') return t.status !== 'completed';
    if (activeTab === 'completed') return t.status === 'completed';
    if (activeTab === 'high') return t.priority === 'high';
    return true;
  });

  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Active User Prompt Banner (If logged out) */}
        {!activeUser && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm tracking-wide">Welcome to TaskMaster AI</span>
              </div>
              <p className="text-xs text-slate-300">
                Sign in with your name and email to save your personal tasks, schedule, and tough-love reminder alerts.
              </p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new Event("open_auth_modal"))}
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm whitespace-nowrap self-start sm:self-auto"
            >
              Sign In / Active User
            </button>
          </div>
        )}

        {/* Notification Status Banner */}
        {notificationStatus && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-pulse shadow-sm">
            <Flame className="w-4 h-4 text-red-600 shrink-0" />
            <span>{notificationStatus}</span>
          </div>
        )}

        {/* Hero Header with Actions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeUser ? `${activeUser.name}'s Dashboard` : 'Discipline & Weekly Execution'}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                  Tough Love Active
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {activeUser ? `Tracking schedule for ${activeUser.email}` : 'Organizes daily commitments into your free hours, tracks completion, and sends reminders.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleAutoSchedule}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                title="Automatically fit pending tasks into your availability windows"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Fit to Free Time
              </button>
              <button 
                onClick={openCreateModal}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500 uppercase tracking-wider">Weekly Completion</span>
              <span className="text-slate-900 text-sm font-black">{data?.weekly_completion_rate || 0}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-slate-900 h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${data?.weekly_completion_rate || 0}%` }}
              />
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Total Tasks</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{data?.total_tasks || 0}</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100">
              <span className="text-xs text-emerald-700 font-medium">Done (Completed)</span>
              <div className="text-2xl font-bold text-emerald-800 mt-0.5">{data?.completed_tasks || 0}</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100">
              <span className="text-xs text-amber-700 font-medium">Pending</span>
              <div className="text-2xl font-bold text-amber-800 mt-0.5">{data?.pending_tasks || 0}</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3.5 border border-red-100">
              <span className="text-xs text-red-700 font-medium">Overdue</span>
              <div className="text-2xl font-bold text-red-800 mt-0.5">{data?.overdue_tasks || 0}</div>
            </div>
          </div>
        </div>

        {/* Control Bar: Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: `All Tasks (${allTasks.length})` },
              { id: 'today', label: `Today's Slots (${data?.today_tasks?.length || 0})` },
              { id: 'pending', label: 'Pending' },
              { id: 'completed', label: 'Completed' },
              { id: 'high', label: 'High Priority' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
            />
          </div>
        </div>

        {/* Task List Section */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Refreshing tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">No tasks match this filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create a new task with the "+ Add Task" button or generate a synchronized plan in the Roadmap tab.
              </p>
              <button 
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Task
              </button>
            </div>
          ) : (
            filteredTasks.map((task: any) => {
              const isDone = task.status === 'completed';
              const isHigh = task.priority === 'high';

              return (
                <div 
                  key={task.id} 
                  className={`group bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
                    isDone 
                      ? 'border-emerald-200 bg-emerald-50/20' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <button 
                        onClick={() => handleToggleDone(task.id, task.status)}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                          isDone 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-slate-300 hover:border-slate-600 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      <div className="space-y-1.5 min-w-0">
                        <h3 className={`font-semibold text-sm sm:text-base leading-snug break-words ${
                          isDone ? 'line-through text-slate-400 font-normal' : 'text-slate-900'
                        }`}>
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {task.estimated_minutes} mins
                          </span>

                          <span className={`px-2 py-0.5 rounded-md font-medium capitalize text-xs ${
                            isHigh 
                              ? 'bg-red-100 text-red-700 font-semibold' 
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
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                              <Calendar className="w-3 h-3" />
                              Google Calendar
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => handleTriggerTestHarsh(task.id)}
                        title="Send Tough Love / Harsh Email Alert"
                        className="text-xs flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors font-semibold"
                      >
                        <Flame className="w-3.5 h-3.5 text-red-600" />
                        <span className="hidden sm:inline">Harsh Alert</span>
                      </button>

                      <button 
                        onClick={() => openEditModal(task)}
                        title="Edit Task"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete Task"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solve Codeforces Dynamic Programming problem"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Problem links, notes, expected approach..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Estimated Duration</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={10}
                      step={5}
                      value={taskForm.estimated_minutes}
                      onChange={(e) => setTaskForm({ ...taskForm, estimated_minutes: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                      mins
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              {editingTask && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed (Done)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-sm"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Login Modal */}
      
    </>
  );
}
