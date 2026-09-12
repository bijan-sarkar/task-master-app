'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { 
  Compass, 
  Sparkles, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  Clock,
  BookOpen,
  Code2,
  Cloud,
  Cpu,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Download,
  Save,
  Sliders,
  Check,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { 
  getStoredRoadmaps, 
  saveCustomRoadmap, 
  deleteCustomRoadmap, 
  importRoadmapTasksToDashboard, 
  generateCustomRoadmap,
  CustomRoadmap, 
  RoadmapPhase, 
  RoadmapWeek, 
  RoadmapTask,
  getActiveUserId 
} from '@/lib/api';

const STARTER_PRESETS = [
  {
    title: "Google Summer of Code (GSoC) 2025/2026",
    months: 5,
    tag: "Open Source",
    description: "5-month path from Git/Linux setup to bug hunting, good first issues, mentor networking, proposal drafting, and summer kickoff.",
    notes: "Month 1: Git branching, Linux CLI, build systems (Make/CMake), target org scouting\nMonth 2: Bug fixing, Good First Issues, first PR submission, community feedback\nMonth 3: Ideas list analysis, mentor communication, proof of concept prototype\nMonth 4: Proposal drafting, architecture diagrams, weekly timeline, mentor review\nMonth 5: Final portal submission, continued PRs, community bonding, summer kickoff"
  },
  {
    title: "Competitive Programming in C/C++",
    months: 3,
    tag: "Algorithms",
    description: "3-month problem-solving sprint targeting Codeforces Division 2 & 3 rating mastery (1500+).",
    notes: "Month 1: C/C++ pointers, memory, bit manipulation, time complexity analysis\nMonth 2: Binary search, two pointers, prefix sums, recursion, greedy algorithms\nMonth 3: Dynamic programming (1D/2D), trees, graph BFS/DFS, contest speed simulation"
  },
  {
    title: "Cloud & DevOps Infrastructure",
    months: 4,
    tag: "DevOps",
    description: "4-month roadmap for mastering Linux system administration, Docker containers, CI/CD pipelines, and AWS.",
    notes: "Month 1: Linux system administration, shell scripting, networking fundamentals\nMonth 2: Docker containers, multi-stage builds, Docker Compose, orchestration\nMonth 3: GitHub Actions CI/CD pipelines, automated testing, container registries\nMonth 4: AWS infrastructure (EC2, S3, IAM, ECS), Terraform basics, monitoring"
  },
  {
    title: "Autonomous AI & Full-Stack SaaS",
    months: 3,
    tag: "AI & Fullstack",
    description: "3-month roadmap for building production AI agents, Next.js web applications, and FastAPI services.",
    notes: "Month 1: Next.js App Router, Tailwind CSS, TypeScript, Supabase PostgreSQL database\nMonth 2: FastAPI backend, Python agent workflows, LLM structured outputs, function calling\nMonth 3: Stripe payment integration, background workers, multi-tenant deployment, launch"
  }
];

export default function RoadmapStudioPage() {
  const [mounted, setMounted] = useState(false);
  const [roadmaps, setRoadmaps] = useState<CustomRoadmap[]>([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string>('');
  const [viewTab, setViewTab] = useState<'editor' | 'timeline'>('editor');
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({ 1: true });

  // Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'custom' | 'ai' | 'preset'>('ai');
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(3);
  const [newTag, setNewTag] = useState('Custom Track');
  const [newNotes, setNewNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Quick Inline Task Creator (for a specific week)
  const [addingTaskFor, setAddingTaskFor] = useState<{ monthIdx: number; weekIdx: number } | null>(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [inlineTaskMinutes, setInlineTaskMinutes] = useState(60);
  const [inlineTaskPriority, setInlineTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Edit Phase Modal
  const [editingPhase, setEditingPhase] = useState<{ monthIdx: number; theme: string; goal: string } | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    loadRoadmaps();
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  function loadRoadmaps() {
    const list = getStoredRoadmaps();
    setRoadmaps(list);
    if (list.length > 0) {
      setActiveRoadmapId(list[0].id);
    }
  }

  const currentRoadmap = roadmaps.find(r => r.id === activeRoadmapId) || roadmaps[0];

  function toggleMonth(m: number) {
    setExpandedMonths(prev => ({ ...prev, [m]: !prev[m] }));
  }

  // Save current roadmap state
  function handlePersistRoadmap(updated: CustomRoadmap) {
    const nextList = roadmaps.map(r => r.id === updated.id ? updated : r);
    setRoadmaps(nextList);
    saveCustomRoadmap(updated);
  }

  // Delete roadmap
  function handleDeleteCurrentRoadmap() {
    if (roadmaps.length <= 1) {
      alert('You must have at least one roadmap.');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${currentRoadmap?.title}"?`)) return;

    deleteCustomRoadmap(currentRoadmap.id);
    const remaining = roadmaps.filter(r => r.id !== currentRoadmap.id);
    setRoadmaps(remaining);
    setActiveRoadmapId(remaining[0].id);
    showToast('Roadmap removed.');
  }

  // Duplicate roadmap
  function handleDuplicateRoadmap() {
    if (!currentRoadmap) return;
    const dup: CustomRoadmap = {
      ...currentRoadmap,
      id: 'rm-' + Date.now(),
      title: `${currentRoadmap.title} (Copy)`,
      created_at: new Date().toISOString()
    };
    const nextList = [dup, ...roadmaps];
    setRoadmaps(nextList);
    saveCustomRoadmap(dup);
    setActiveRoadmapId(dup.id);
    showToast('Duplicated roadmap into your studio!');
  }

  // Add a new Month Phase
  function handleAddPhase() {
    if (!currentRoadmap) return;
    const nextMonthNum = currentRoadmap.phases.length + 1;
    const newPhase: RoadmapPhase = {
      month: nextMonthNum,
      theme: `Phase ${nextMonthNum}: Advanced Execution`,
      goal: `Deep dive into advanced topics and milestone targets for Month ${nextMonthNum}.`,
      weeks: [
        {
          week: (nextMonthNum - 1) * 4 + 1,
          focus: 'Sprint Kickoff & Implementation',
          tasks: [
            { title: 'Define sprint architecture & requirements', minutes: 60, priority: 'high' }
          ]
        },
        {
          week: (nextMonthNum - 1) * 4 + 2,
          focus: 'Core Building & Problem Solving',
          tasks: [
            { title: 'Implement key milestone module', minutes: 90, priority: 'medium' }
          ]
        }
      ]
    };

    const updated: CustomRoadmap = {
      ...currentRoadmap,
      duration_months: Math.max(currentRoadmap.duration_months, nextMonthNum),
      phases: [...currentRoadmap.phases, newPhase]
    };
    handlePersistRoadmap(updated);
    setExpandedMonths(prev => ({ ...prev, [nextMonthNum]: true }));
    showToast(`Added Month ${nextMonthNum} phase!`);
  }

  // Add a new Week to a Month Phase
  function handleAddWeekToPhase(monthIdx: number) {
    if (!currentRoadmap) return;
    const phase = currentRoadmap.phases[monthIdx];
    const newWeekNum = phase.weeks.length > 0 
      ? Math.max(...phase.weeks.map(w => w.week)) + 1 
      : (phase.month - 1) * 4 + 1;

    const newWeek: RoadmapWeek = {
      week: newWeekNum,
      focus: 'Focus Sprint & Delivery',
      tasks: [
        { title: 'Sprint practice problem / milestone task', minutes: 60, priority: 'medium' }
      ]
    };

    const updatedPhases = [...currentRoadmap.phases];
    updatedPhases[monthIdx] = {
      ...phase,
      weeks: [...phase.weeks, newWeek]
    };

    handlePersistRoadmap({ ...currentRoadmap, phases: updatedPhases });
    showToast(`Added Week ${newWeekNum} to Month ${phase.month}!`);
  }

  // Inline Add Task to Week
  function handleConfirmAddTask() {
    if (!addingTaskFor || !inlineTaskTitle.trim() || !currentRoadmap) return;
    const { monthIdx, weekIdx } = addingTaskFor;

    const newTask: RoadmapTask = {
      title: inlineTaskTitle.trim(),
      minutes: inlineTaskMinutes,
      priority: inlineTaskPriority
    };

    const updatedPhases = [...currentRoadmap.phases];
    const targetWeek = updatedPhases[monthIdx].weeks[weekIdx];
    updatedPhases[monthIdx].weeks[weekIdx] = {
      ...targetWeek,
      tasks: [...targetWeek.tasks, newTask]
    };

    handlePersistRoadmap({ ...currentRoadmap, phases: updatedPhases });
    setInlineTaskTitle('');
    setAddingTaskFor(null);
    showToast(`Added task "${newTask.title}"!`);
  }

  // Delete Task
  function handleDeleteTask(monthIdx: number, weekIdx: number, taskIdx: number) {
    if (!currentRoadmap) return;
    const updatedPhases = [...currentRoadmap.phases];
    const targetWeek = updatedPhases[monthIdx].weeks[weekIdx];
    updatedPhases[monthIdx].weeks[weekIdx] = {
      ...targetWeek,
      tasks: targetWeek.tasks.filter((_, i) => i !== taskIdx)
    };
    handlePersistRoadmap({ ...currentRoadmap, phases: updatedPhases });
  }

  // Save Phase Details Edit
  function handleSavePhaseDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPhase || !currentRoadmap) return;
    const updatedPhases = [...currentRoadmap.phases];
    updatedPhases[editingPhase.monthIdx] = {
      ...updatedPhases[editingPhase.monthIdx],
      theme: editingPhase.theme,
      goal: editingPhase.goal
    };
    handlePersistRoadmap({ ...currentRoadmap, phases: updatedPhases });
    setEditingPhase(null);
    showToast('Phase details updated.');
  }

  // Import Roadmap or Phase to User's Active Schedule
  function handleImport(phaseIndex?: number) {
    if (!currentRoadmap) return;
    const count = importRoadmapTasksToDashboard(currentRoadmap, phaseIndex);
    const scope = phaseIndex !== undefined ? `Month ${currentRoadmap.phases[phaseIndex].month}` : 'all roadmap';
    showToast(`✓ Successfully imported ${count} tasks from ${scope} into your Dashboard!`);
  }

  // Create Roadmap handler (Custom, AI Decomposition, or Preset)
  async function handleCreateRoadmapSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsGenerating(true);
    try {
      let createdPhases: RoadmapPhase[] = [];

      if (createMode === 'ai') {
        const res = await generateCustomRoadmap(getActiveUserId(), {
          goal_title: newTitle,
          target_duration_months: Number(newDuration),
          milestones_rough_text: newNotes || `Foundational, core practice, and capstone delivery for ${newTitle}`
        });
        createdPhases = res?.curriculum?.phases || [];
      }

      if (createdPhases.length === 0) {
        // Fallback or custom starter
        for (let m = 1; m <= newDuration; m++) {
          createdPhases.push({
            month: m,
            theme: m === 1 ? 'Foundations & Architecture' : m === newDuration ? 'Polishing & Capstone' : `Execution Phase ${m}`,
            goal: `Primary objective and deliverables for Month ${m}.`,
            weeks: [
              {
                week: (m - 1) * 4 + 1,
                focus: 'Sprint 1 Focus',
                tasks: [
                  { title: `Read reference documentation for ${newTitle}`, minutes: 60, priority: 'high' },
                  { title: 'Setup development workspace & tools', minutes: 45, priority: 'medium' }
                ]
              },
              {
                week: (m - 1) * 4 + 2,
                focus: 'Sprint 2 Implementation',
                tasks: [
                  { title: 'Build core feature prototype', minutes: 90, priority: 'high' }
                ]
              }
            ]
          });
        }
      }

      const newRoadmap: CustomRoadmap = {
        id: 'rm-' + Date.now(),
        title: newTitle.trim(),
        duration_months: Number(newDuration),
        tag: newTag.trim() || 'Custom Track',
        phases: createdPhases,
        created_at: new Date().toISOString()
      };

      const updatedList = [newRoadmap, ...roadmaps];
      setRoadmaps(updatedList);
      saveCustomRoadmap(newRoadmap);
      setActiveRoadmapId(newRoadmap.id);
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewNotes('');
      showToast(`Created custom roadmap: "${newRoadmap.title}"!`);
    } catch (e) {
      showToast('Created roadmap.');
    } finally {
      setIsGenerating(false);
    }
  }

  // Export to Markdown
  function exportMarkdown() {
    if (!currentRoadmap) return;
    let md = `# ${currentRoadmap.title}\n\n`;
    md += `**Target Duration:** ${currentRoadmap.duration_months} Months\n`;
    md += `**Track:** ${currentRoadmap.tag || 'General'}\n\n`;

    for (const phase of currentRoadmap.phases) {
      md += `## Month ${phase.month}: ${phase.theme}\n`;
      md += `*Goal: ${phase.goal}*\n\n`;
      for (const w of phase.weeks) {
        md += `### Week ${w.week}: ${w.focus}\n`;
        for (const t of w.tasks) {
          md += `- [ ] ${t.title} (${t.minutes} mins, ${t.priority} priority)\n`;
        }
        md += `\n`;
      }
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentRoadmap.title.toLowerCase().replace(/\s+/g, '-')}-roadmap.md`;
    a.click();
    showToast('Downloaded Markdown checklist!');
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-xs font-semibold">Loading Roadmap Customizer Studio...</div>
      </div>
    );
  }

  // Calculate total tasks and total study hours
  const totalTasks = currentRoadmap?.phases?.reduce((acc, p) => 
    acc + p.weeks.reduce((wAcc, w) => wAcc + w.tasks.length, 0), 0) || 0;
  const totalEstimatedMinutes = currentRoadmap?.phases?.reduce((acc, p) => 
    acc + p.weeks.reduce((wAcc, w) => wAcc + w.tasks.reduce((tAcc, t) => tAcc + (t.minutes || 60), 0), 0), 0) || 0;
  const totalHours = (totalEstimatedMinutes / 60).toFixed(0);

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl bg-slate-950 text-white border border-slate-700 shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Studio Hero & Roadmap Selector */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-850 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-extrabold border border-violet-400/20">
                  <Sliders className="w-3.5 h-3.5 text-violet-400" />
                  <span>ROADMAP CUSTOMIZATION STUDIO</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Create, Customize & Organize Your Roadmaps
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Design bespoke multi-month master plans. Add custom phases, sprint weeks, and concrete tasks, then fit them straight into your weekly schedule with 1 click.
                </p>
              </div>

              <button
                onClick={() => {
                  setNewTitle('');
                  setNewDuration(3);
                  setNewNotes('');
                  setIsCreateModalOpen(true);
                }}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-rose-900/40 active:scale-95 self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Roadmap</span>
              </button>
            </div>

            {/* Active Roadmap Switcher Bar */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <span className="text-xs text-slate-400 font-bold shrink-0">Active Track:</span>
                {roadmaps.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRoadmapId(r.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      r.id === activeRoadmapId
                        ? 'bg-white text-slate-950 shadow-md ring-1 ring-white/30'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {r.title}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDuplicateRoadmap}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                  title="Duplicate Roadmap"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Duplicate</span>
                </button>

                <button
                  onClick={exportMarkdown}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                  title="Download Markdown checklist"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  onClick={handleDeleteCurrentRoadmap}
                  className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-white/10 rounded-xl transition-colors"
                  title="Delete Roadmap"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Roadmap Overview Ribbon & Actions */}
        {currentRoadmap && (
          <div className="glass-card rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-950">{currentRoadmap.title}</h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                  {currentRoadmap.tag || 'Custom Track'}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {currentRoadmap.phases.length} Phases • {totalTasks} Tasks • ~{totalHours} Total Hours
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentRoadmap.description || 'Customized roadmap breakdown for deliberate, focused practice.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => handleImport()}
                className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95"
                title="Import all tasks from this roadmap into Dashboard"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Import All to Dashboard</span>
              </button>

              <button
                onClick={handleAddPhase}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 text-rose-600" />
                <span>Add Month Phase</span>
              </button>
            </div>
          </div>
        )}

        {/* Interactive Month-by-Month Phases & Weeks Customizer */}
        {currentRoadmap && (
          <div className="space-y-4">
            {currentRoadmap.phases.map((phase, pIdx) => {
              const isExpanded = !!expandedMonths[phase.month];

              return (
                <div
                  key={phase.month}
                  className="glass-card rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm transition-all"
                >
                  {/* Phase Header */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                    <button
                      type="button"
                      onClick={() => toggleMonth(phase.month)}
                      className="text-left flex-1 flex items-start sm:items-center gap-3"
                    >
                      <span className="text-xs font-black uppercase px-3 py-1 rounded-xl bg-slate-950 text-white shrink-0">
                        Month {phase.month}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-950">{phase.theme}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{phase.goal}</p>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {/* Edit Phase details */}
                      <button
                        type="button"
                        onClick={() => setEditingPhase({ monthIdx: pIdx, theme: phase.theme, goal: phase.goal })}
                        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Edit Phase Title & Goal"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Import Phase */}
                      <button
                        type="button"
                        onClick={() => handleImport(pIdx)}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                        title="Import only this month's tasks to schedule"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Import Phase</span>
                      </button>

                      {/* Add Week */}
                      <button
                        type="button"
                        onClick={() => handleAddWeekToPhase(pIdx)}
                        className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                        title="Add week sprint to this month"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Week</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleMonth(phase.month)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Phase Body: Weeks and Tasks */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/40">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {phase.weeks.map((week, wIdx) => {
                          const isAddingTask = addingTaskFor?.monthIdx === pIdx && addingTaskFor?.weekIdx === wIdx;

                          return (
                            <div
                              key={week.week}
                              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <div>
                                  <span className="text-xs font-black text-slate-950">Week {week.week}</span>
                                  <div className="text-xs text-slate-600 font-medium line-clamp-1">{week.focus}</div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingTaskFor({ monthIdx: pIdx, weekIdx: wIdx });
                                    setInlineTaskTitle('');
                                    setInlineTaskMinutes(60);
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Task</span>
                                </button>
                              </div>

                              {/* Task List */}
                              <div className="space-y-2">
                                {week.tasks.map((task, tIdx) => (
                                  <div
                                    key={tIdx}
                                    className="group/t bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl p-2.5 flex items-start justify-between gap-2.5 transition-colors text-xs"
                                  >
                                    <div className="space-y-1 flex-1 min-w-0">
                                      <p className="font-semibold text-slate-900 leading-snug break-words">
                                        {task.title}
                                      </p>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                        <span className="inline-flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-slate-400" />
                                          {task.minutes}m
                                        </span>
                                        <span className={`capitalize font-bold px-1.5 py-0.2 rounded ${
                                          task.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                                        }`}>
                                          {task.priority}
                                        </span>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTask(pIdx, wIdx, tIdx)}
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg opacity-0 group-hover/t:opacity-100 transition-opacity"
                                      title="Remove task"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}

                                {week.tasks.length === 0 && (
                                  <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                                    No tasks in this week yet
                                  </div>
                                )}
                              </div>

                              {/* Inline Task Form */}
                              {isAddingTask && (
                                <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-300 space-y-2.5 animate-slide-up">
                                  <input
                                    type="text"
                                    autoFocus
                                    placeholder="Task title (e.g. Implement Dijkstra with priority queue)..."
                                    value={inlineTaskTitle}
                                    onChange={(e) => setInlineTaskTitle(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-950 font-medium text-slate-900"
                                  />

                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <select
                                        value={inlineTaskMinutes}
                                        onChange={(e) => setInlineTaskMinutes(Number(e.target.value))}
                                        className="bg-white border border-slate-200 text-slate-800 text-[11px] font-bold px-2 py-1 rounded-lg"
                                      >
                                        <option value={30}>30m</option>
                                        <option value={45}>45m</option>
                                        <option value={60}>1h</option>
                                        <option value={90}>1.5h</option>
                                        <option value={120}>2h</option>
                                        <option value={180}>3h</option>
                                      </select>

                                      <select
                                        value={inlineTaskPriority}
                                        onChange={(e) => setInlineTaskPriority(e.target.value as any)}
                                        className="bg-white border border-slate-200 text-slate-800 text-[11px] font-bold px-2 py-1 rounded-lg"
                                      >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                      </select>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setAddingTaskFor(null)}
                                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleConfirmAddTask}
                                        className="px-3 py-1 text-[11px] font-bold bg-slate-950 text-white rounded-lg shadow-sm"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Big Add Month Phase Banner */}
            <button
              type="button"
              onClick={handleAddPhase}
              className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-3xl text-slate-600 hover:text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-all bg-white/50 hover:bg-white"
            >
              <Plus className="w-4 h-4 text-rose-600" />
              <span>Extend Roadmap: Add Month {currentRoadmap.phases.length + 1} Phase</span>
            </button>
          </div>
        )}
      </div>

      {/* Create New Roadmap Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-slide-up">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-extrabold">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  Roadmap Creator
                </div>
                <h3 className="text-xl font-black text-slate-950">New Goal Roadmap</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Creation Method Pills */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCreateMode('ai')}
                className={`py-1.5 rounded-xl transition-all ${createMode === 'ai' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                AI Decompose
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('preset')}
                className={`py-1.5 rounded-xl transition-all ${createMode === 'preset' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                From Presets
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('custom')}
                className={`py-1.5 rounded-xl transition-all ${createMode === 'custom' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Blank Scratch
              </button>
            </div>

            {/* Presets picker if preset mode */}
            {createMode === 'preset' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Choose a Starter Preset:</label>
                <div className="grid grid-cols-1 gap-2">
                  {STARTER_PRESETS.map((p) => (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => {
                        setNewTitle(p.title);
                        setNewDuration(p.months);
                        setNewTag(p.tag);
                        setNewNotes(p.notes);
                      }}
                      className={`text-left p-3 rounded-xl border text-xs transition-all ${
                        newTitle === p.title ? 'border-slate-950 bg-slate-50 ring-1 ring-slate-950' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-slate-950">{p.title} ({p.months} Months)</div>
                      <div className="text-slate-500 text-[11px] line-clamp-1">{p.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateRoadmapSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Roadmap Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Rust, Crack GSoC 2026, Learn Kubernetes"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Duration (Months)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newDuration}
                    onChange={(e) => setNewDuration(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Category Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Open Source, AI, Coding"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                  />
                </div>
              </div>

              {createMode === 'ai' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Rough Notes & Topics (For decomposition engine)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Month 1: Pointers and fundamentals&#10;Month 2: Core projects and tests&#10;Month 3: Deployment and capstone"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-4 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-2.5 text-xs font-bold bg-slate-950 hover:bg-slate-850 text-white rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Roadmap...</span>
                    </>
                  ) : (
                    <span>Create & Open in Studio</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Phase Details Modal */}
      {editingPhase && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-950">
                Edit Month {currentRoadmap?.phases[editingPhase.monthIdx]?.month} Phase
              </h3>
              <button 
                type="button"
                onClick={() => setEditingPhase(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhaseDetails} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Phase Theme Title</label>
                <input
                  type="text"
                  required
                  value={editingPhase.theme}
                  onChange={(e) => setEditingPhase({ ...editingPhase, theme: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Monthly High-Level Goal</label>
                <textarea
                  rows={3}
                  required
                  value={editingPhase.goal}
                  onChange={(e) => setEditingPhase({ ...editingPhase, goal: e.target.value })}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPhase(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-slate-950 text-white rounded-xl shadow-sm"
                >
                  Save Phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
