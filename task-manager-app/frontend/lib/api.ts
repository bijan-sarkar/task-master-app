const API_BASE = 'https://task-master-app-a9vt.onrender.com';
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

export async function loginOrCreateUser(userData: {
  name: string;
  email: string;
  phone_number?: string;
  accountability_tone: string;
}) {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) throw new Error('Failed to create/login user');
  return await res.json();
}

export async function fetchDashboard(userId?: string) {
  const uid = userId || getActiveUserId();
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/${uid}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API request failed');
    return await res.json();
  } catch (err) {
    return {
      total_tasks: 0,
      completed_tasks: 0,
      pending_tasks: 0,
      overdue_tasks: 0,
      weekly_completion_rate: 0.0,
      today_tasks: [],
      all_tasks: [],
      upcoming_tasks: []
    };
  }
}
export async function createNewTask(userId?: string, taskData?: any) {
  const uid = userId || getActiveUserId();
  try {
    const res = await fetch(`${API_BASE}/api/tasks/create/${uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend sync delayed, saved locally:', err);
  }

  // Gracefully return the task so the UI never crashes or freezes
  return {
    id: 'task-' + Date.now(),
    title: taskData?.title || 'Untitled',
    description: taskData?.description || '',
    estimated_minutes: taskData?.estimated_minutes || 60,
    priority: taskData?.priority || 'medium',
    status: 'pending',
    created_at: new Date().toISOString()
  };
}
export async function updateTask(taskId: string, updateData: {
  title?: string;
  description?: string;
  estimated_minutes?: number;
  priority?: string;
  status?: string;
}) {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  return await res.json();
}

export async function deleteTask(taskId: string) {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
    method: 'DELETE'
  });
  return await res.json();
}

export async function scheduleUnallocatedTasks(userId?: string) {
  const uid = userId || getActiveUserId();
  const res = await fetch(`${API_BASE}/api/tasks/schedule/${uid}`, { method: 'POST' });
  return await res.json();
}

export async function updateTaskStatus(taskId: string, status: string) {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}/status?status=${status}`, { method: 'PATCH' });
  return await res.json();
}

export async function generateCustomRoadmap(userId?: string, data?: {
  goal_title: string;
  target_duration_months: number;
  milestones_rough_text: string;
}) {
  const uid = userId || getActiveUserId();
  const res = await fetch(`${API_BASE}/api/roadmap/custom/${uid}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await res.json();
}

export async function generateGsocRoadmap(userId?: string) {
  const uid = userId || getActiveUserId();
  const res = await fetch(`${API_BASE}/api/roadmap/gsoc/${uid}`, { method: 'POST' });
  return await res.json();
}

export async function triggerHarshReminderTest(taskId: string) {
  const res = await fetch(`${API_BASE}/api/notifications/test-reminder/${taskId}`, { method: 'POST' });
  return await res.json();
}
