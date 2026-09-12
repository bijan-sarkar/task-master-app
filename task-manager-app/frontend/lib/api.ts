const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://task-master-app-a9vt.onrender.com';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone_number?: string;
  timezone?: string;
  accountability_tone: string;
}

export interface AvailabilitySlot {
  id?: string;
  day_of_week: number; // 0 = Monday, 6 = Sunday
  start_time: string;  // e.g. "19:00"
  end_time: string;    // e.g. "22:00"
  capacity_minutes: number;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  estimated_minutes: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  scheduled_start?: string;
  scheduled_end?: string;
  google_calendar_event_id?: string;
  roadmap_id?: string;
  created_at?: string;
}

export function getActiveUserId(): string {
  if (typeof window === 'undefined') return 'demo-user';
  try {
    const userStr = localStorage.getItem('taskmaster_active_user');
    if (userStr) {
      const u = JSON.parse(userStr);
      return u.id || 'demo-user';
    }
  } catch (e) {}
  return 'demo-user';
}

export function getActiveUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = localStorage.getItem('taskmaster_active_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

export async function loginOrCreateUser(userData: UserProfile): Promise<UserProfile> {
  try {
    const res = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (res.ok) {
      const u = await res.json();
      localStorage.setItem('taskmaster_active_user', JSON.stringify(u));
      return u;
    }
  } catch (err) {
    console.warn('Backend login unavailable, persisting user locally:', err);
  }

  const fallbackUser: UserProfile = {
    ...userData,
    id: userData.id || 'user-' + Date.now()
  };
  localStorage.setItem('taskmaster_active_user', JSON.stringify(fallbackUser));
  return fallbackUser;
}

export async function fetchDashboard(userId?: string) {
  const uid = userId || getActiveUserId();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${API_BASE}/api/dashboard/${uid}`, { 
      cache: 'no-store',
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    if (res.ok) return await res.json();
  } catch (err) {
    // Graceful offline fallback
  }

  // Fallback to local storage
  const localTasks = getLocalTasks();
  const completed = localTasks.filter(t => t.status === 'completed').length;
  const total = localTasks.length;
  return {
    total_tasks: total,
    completed_tasks: completed,
    pending_tasks: total - completed,
    overdue_tasks: 0,
    weekly_completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    today_tasks: localTasks,
    all_tasks: localTasks,
    upcoming_tasks: []
  };
}

export function getLocalTasks(): TaskItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('taskmaster_local_tasks');
    if (stored) return JSON.parse(stored);
  } catch (e) {}

  // Pre-seed with inspiring initial productivity tasks if none exist
  const defaultTasks: TaskItem[] = [
    {
      id: 'task-init-1',
      title: 'Setup GitHub SSH keys and Fork target open-source repository',
      description: 'Clone repo locally, build from source using Make/CMake, and configure branch upstream.',
      estimated_minutes: 45,
      priority: 'high',
      status: 'completed',
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'task-init-2',
      title: 'Review 3 "Good First Issues" on Linux kernel / C tools',
      description: 'Identify unassigned bug tickets, reproduce test failure, and draft proposed fix.',
      estimated_minutes: 90,
      priority: 'high',
      status: 'pending',
      created_at: new Date().toISOString()
    },
    {
      id: 'task-init-3',
      title: 'Practice 3 Dynamic Programming problems on Codeforces',
      description: 'Focus on 1D/2D memoization and knapsack variations (Rating 1400-1600).',
      estimated_minutes: 120,
      priority: 'medium',
      status: 'in_progress',
      created_at: new Date().toISOString()
    },
    {
      id: 'task-init-4',
      title: 'Configure Weekly Free-Time schedule blocks',
      description: 'Align upcoming tasks to evening free hours in the Availability tab.',
      estimated_minutes: 30,
      priority: 'low',
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];
  saveLocalTasks(defaultTasks);
  return defaultTasks;
}

export function saveLocalTasks(tasks: TaskItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('taskmaster_local_tasks', JSON.stringify(tasks));
  } catch (e) {}
}

export async function createNewTask(userId?: string, taskData?: Partial<TaskItem>): Promise<TaskItem> {
  const uid = userId || getActiveUserId();
  const newTask: TaskItem = {
    id: 'task-' + Date.now(),
    title: taskData?.title || 'Untitled Task',
    description: taskData?.description || '',
    estimated_minutes: taskData?.estimated_minutes || 60,
    priority: taskData?.priority || 'medium',
    status: taskData?.status || 'pending',
    created_at: new Date().toISOString()
  };

  try {
    const res = await fetch(`${API_BASE}/api/tasks/create/${uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (res.ok) {
      const serverTask = await res.json();
      return serverTask;
    }
  } catch (err) {
    console.warn('Backend sync queued, returning local task item:', err);
  }

  return newTask;
}

export async function updateTask(taskId: string, updateData: Partial<TaskItem>) {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { id: taskId, ...updateData };
}

export async function deleteTask(taskId: string) {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
      method: 'DELETE'
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { status: 'deleted', task_id: taskId };
}

export async function updateTaskStatus(taskId: string, status: string) {
  try {
    const res = await fetch(`${API_BASE}/api/tasks/${taskId}/status?status=${status}`, { 
      method: 'PATCH' 
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return { status: 'updated', task_id: taskId, new_status: status };
}

export async function scheduleUnallocatedTasks(userId?: string) {
  const uid = userId || getActiveUserId();
  try {
    const res = await fetch(`${API_BASE}/api/tasks/schedule/${uid}`, { method: 'POST' });
    if (res.ok) return await res.json();
  } catch (err) {}
  
  // Local schedule simulation: assign slots to pending tasks
  const tasks = getLocalTasks();
  let count = 0;
  const now = new Date();
  const updated = tasks.map(t => {
    if (t.status === 'pending' && !t.scheduled_start) {
      count++;
      const start = new Date(now.getTime() + count * 86400000);
      start.setHours(19, 0, 0, 0);
      const end = new Date(start.getTime() + (t.estimated_minutes || 60) * 60000);
      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(t.title)}&details=${encodeURIComponent(t.description || 'TaskMaster scheduled commitment')}&dates=${start.toISOString().replace(/-|:|\.\d\d\d/g, '')}/${end.toISOString().replace(/-|:|\.\d\d\d/g, '')}`;
      return {
        ...t,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        google_calendar_event_id: calendarUrl
      };
    }
    return t;
  });
  saveLocalTasks(updated);
  return { status: 'success', scheduled_count: count, allocations: [] };
}

// Availability Slot APIs
export async function fetchAvailability(userId?: string): Promise<AvailabilitySlot[]> {
  const uid = userId || getActiveUserId();
  try {
    const res = await fetch(`${API_BASE}/api/availability/${uid}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem('taskmaster_availability', JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('taskmaster_availability');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
  }

  // Default initial schedule: Evening study blocks
  return [
    { day_of_week: 0, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
    { day_of_week: 1, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
    { day_of_week: 2, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
    { day_of_week: 3, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
    { day_of_week: 4, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
    { day_of_week: 5, start_time: '14:00', end_time: '18:00', capacity_minutes: 240 },
    { day_of_week: 6, start_time: '14:00', end_time: '18:00', capacity_minutes: 240 },
  ];
}

export async function saveAvailability(userId: string | undefined, slots: AvailabilitySlot[]): Promise<boolean> {
  const uid = userId || getActiveUserId();
  if (typeof window !== 'undefined') {
    localStorage.setItem('taskmaster_availability', JSON.stringify(slots));
  }
  try {
    const res = await fetch(`${API_BASE}/api/availability/${uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slots)
    });
    return res.ok;
  } catch (e) {
    return true; // Successfully saved locally
  }
}

// Roadmap APIs
export async function generateCustomRoadmap(userId?: string, data?: {
  goal_title: string;
  target_duration_months: number;
  milestones_rough_text: string;
}) {
  const uid = userId || getActiveUserId();
  try {
    const res = await fetch(`${API_BASE}/api/roadmap/custom/${uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  // Local fallback curriculum generator
  const months = data?.target_duration_months || 3;
  const goal = data?.goal_title || 'Master Goal';
  const phases = [];
  for (let m = 1; m <= months; m++) {
    phases.push({
      month: m,
      theme: m === 1 ? 'Foundations & Architecture' : m === months ? 'Refinement & Capstone Delivery' : `Core Execution Phase ${m}`,
      goal: `Master all fundamental concepts and complete designated sprint objectives for Month ${m}.`,
      weeks: [
        {
          week: (m - 1) * 4 + 1,
          focus: 'Deep Dive & Exploration',
          tasks: [
            { title: `Study documentation and architecture patterns for ${goal}`, minutes: 90, priority: 'high' },
            { title: 'Implement working proof-of-concept module', minutes: 120, priority: 'medium' }
          ]
        },
        {
          week: (m - 1) * 4 + 2,
          focus: 'Implementation & Problem Solving',
          tasks: [
            { title: 'Solve 10 targeted milestone challenges', minutes: 120, priority: 'high' },
            { title: 'Draft code review & refactoring notes', minutes: 60, priority: 'low' }
          ]
        },
        {
          week: (m - 1) * 4 + 3,
          focus: 'Testing & Integration',
          tasks: [
            { title: 'Write unit tests and benchmark execution', minutes: 90, priority: 'medium' }
          ]
        },
        {
          week: (m - 1) * 4 + 4,
          focus: 'Review & Milestone Retrospective',
          tasks: [
            { title: `Complete Month ${m} progress assessment report`, minutes: 60, priority: 'medium' }
          ]
        }
      ]
    });
  }

  return {
    status: 'success',
    roadmap_id: 'local-rm-' + Date.now(),
    curriculum: {
      title: goal,
      duration_months: months,
      phases
    },
    total_tasks_generated: phases.length * 6
  };
}

export async function triggerHarshReminderTest(taskId: string, tone: string = 'harsh') {
  try {
    const res = await fetch(`${API_BASE}/api/notifications/test-reminder/${taskId}`, { 
      method: 'POST' 
    });
    if (res.ok) return await res.json();
  } catch (e) {}

  // Realistic preview generation
  const quotes = {
    roast: {
      subject: "🚨 [ROAST] Are you proud of this procrastination?",
      body: "Another day, another excuses checklist. You planned to finish this task 45 minutes ago. Close TikTok, shut down YouTube, and put 30 focused minutes into this. Your future self is judging you right now."
    },
    harsh: {
      subject: "🔥 [ACCOUNTABILITY ALERT] Action Required Immediately",
      body: "Your deadline is slipping away. Consistent execution separates the talkers from the builders. Step up, eliminate distractions, and complete this task now."
    },
    firm: {
      subject: "⚠️ [DEADLINE APPROACHING] Pending Task Reminder",
      body: "You have a scheduled commitment that has not been marked done yet. Check off this block now to keep your weekly streak intact."
    },
    gentle: {
      subject: "🌱 [FRIENDLY NUDGE] Time for your focus session",
      body: "Hey! Just checking in to see if you need a quick break before knocking this task out. You've got this!"
    }
  };

  const selected = (quotes as any)[tone] || quotes.harsh;
  return {
    status: 'dispatched',
    task: 'Accountability Focus Block',
    preview: selected
  };
}

// ==================== ROADMAP CUSTOMIZATION & MANAGEMENT ====================
export interface RoadmapTask {
  id?: string;
  title: string;
  minutes: number;
  priority: 'low' | 'medium' | 'high';
}

export interface RoadmapWeek {
  week: number;
  focus: string;
  tasks: RoadmapTask[];
}

export interface RoadmapPhase {
  month: number;
  theme: string;
  goal: string;
  weeks: RoadmapWeek[];
}

export interface CustomRoadmap {
  id: string;
  title: string;
  duration_months: number;
  tag?: string;
  description?: string;
  phases: RoadmapPhase[];
  created_at?: string;
  updated_at?: string;
}

export function getStoredRoadmaps(): CustomRoadmap[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('taskmaster_saved_roadmaps');
    if (stored) return JSON.parse(stored);
  } catch (e) {}

  // Initial pre-loaded roadmap: GSoC 2025/2026 Master Plan
  const defaultRoadmap: CustomRoadmap = {
    id: 'rm-gsoc-default',
    title: 'Google Summer of Code (GSoC) 2025/2026 Master Plan',
    duration_months: 5,
    tag: 'Open Source',
    description: 'Comprehensive 5-month journey from developer tooling setup to first pull request, mentor bonding, proposal drafting, and summer kickoff.',
    phases: [
      {
        month: 1,
        theme: 'Git & Linux Developer Tooling',
        goal: 'Master version control workflows, build systems, and find target organizations.',
        weeks: [
          {
            week: 1,
            focus: 'Git Fork-and-Branch & SSH Keys',
            tasks: [
              { title: 'Setup GitHub SSH keys and GPG commit signing', minutes: 45, priority: 'high' },
              { title: 'Practice interactive rebase, squashing, and cherry-picking', minutes: 60, priority: 'medium' }
            ]
          },
          {
            week: 2,
            focus: 'Build Systems & Environment Setup',
            tasks: [
              { title: 'Compile target repository from source using Make/CMake', minutes: 90, priority: 'high' },
              { title: 'Run and debug test suite locally', minutes: 60, priority: 'medium' }
            ]
          }
        ]
      },
      {
        month: 2,
        theme: 'Good First Issues & First Pull Request',
        goal: 'Submit bug fixes and establish communication with project maintainers.',
        weeks: [
          {
            week: 5,
            focus: 'Issue Scouting & Bug Reproduction',
            tasks: [
              { title: 'Reproduce test failure in issue tracker and isolate cause', minutes: 90, priority: 'high' },
              { title: 'Draft minimal reproduction script or unit test', minutes: 60, priority: 'medium' }
            ]
          },
          {
            week: 6,
            focus: 'First PR Submission & Community Review',
            tasks: [
              { title: 'Submit clean pull request adhering to CONTRIBUTING.md', minutes: 120, priority: 'high' },
              { title: 'Address maintainer feedback in public code review', minutes: 60, priority: 'high' }
            ]
          }
        ]
      },
      {
        month: 3,
        theme: 'Organization Deep Dive & Ideas Analysis',
        goal: 'Pick proposal project and develop proof-of-concept prototype.',
        weeks: [
          {
            week: 9,
            focus: 'Idea Scouting & Mentor Engagement',
            tasks: [
              { title: 'Review official ideas list and select 2 target projects', minutes: 60, priority: 'medium' },
              { title: 'Introduce self on mailing list/Discord with prior PR link', minutes: 45, priority: 'high' }
            ]
          },
          {
            week: 10,
            focus: 'Proof of Concept (PoC) Prototype',
            tasks: [
              { title: 'Build and benchmark minimal proof of concept', minutes: 180, priority: 'high' }
            ]
          }
        ]
      }
    ],
    created_at: new Date().toISOString()
  };

  saveCustomRoadmap(defaultRoadmap);
  return [defaultRoadmap];
}

export function saveCustomRoadmap(roadmap: CustomRoadmap) {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredRoadmaps();
    const existingIdx = list.findIndex(r => r.id === roadmap.id);
    let updated: CustomRoadmap[];
    if (existingIdx >= 0) {
      updated = [...list];
      updated[existingIdx] = { ...roadmap, updated_at: new Date().toISOString() };
    } else {
      updated = [{ ...roadmap, updated_at: new Date().toISOString() }, ...list];
    }
    localStorage.setItem('taskmaster_saved_roadmaps', JSON.stringify(updated));
  } catch (e) {}
}

export function deleteCustomRoadmap(roadmapId: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredRoadmaps().filter(r => r.id !== roadmapId);
    localStorage.setItem('taskmaster_saved_roadmaps', JSON.stringify(list));
  } catch (e) {}
}

export function importRoadmapTasksToDashboard(roadmap: CustomRoadmap, phaseIndex?: number): number {
  const existing = getLocalTasks();
  const newTasks: TaskItem[] = [];

  const phasesToImport = phaseIndex !== undefined ? [roadmap.phases[phaseIndex]] : roadmap.phases;

  for (const phase of phasesToImport) {
    if (!phase) continue;
    for (const week of phase.weeks || []) {
      for (const t of week.tasks || []) {
        newTasks.push({
          id: 'task-rm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          roadmap_id: roadmap.id,
          title: `[M${phase.month}-W${week.week}] ${t.title}`,
          description: `Roadmap: ${roadmap.title} | Phase: ${phase.theme} | Focus: ${week.focus}`,
          estimated_minutes: t.minutes || 60,
          priority: t.priority || 'medium',
          status: 'pending',
          created_at: new Date().toISOString()
        });
      }
    }
  }

  const combined = [...newTasks, ...existing];
  saveLocalTasks(combined);
  return newTasks.length;
}
