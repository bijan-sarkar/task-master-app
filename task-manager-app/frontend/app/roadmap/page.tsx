'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
// AuthModal integrated in Navbar
import { 
  Compass, 
  Sparkles, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  CheckCircle2, 
  Layers,
  RefreshCw
} from 'lucide-react';
import { generateCustomRoadmap, getActiveUserId } from '@/lib/api';

const PRESETS = [
  {
    title: "Google Summer of Code (GSoC)",
    months: 5,
    description: "5-month path from Git/Linux setup to bug hunting, mentor engagement, and accepted proposal.",
    notes: "Month 1: Git branching, Linux CLI, build systems (Make/CMake), target org scouting\nMonth 2: Bug fixing, Good First Issues, first PR submission, community feedback\nMonth 3: Ideas list analysis, mentor communication, proof of concept prototype\nMonth 4: Proposal drafting, architecture diagrams, weekly timeline, mentor review\nMonth 5: Final portal submission, continued PRs, community bonding, summer kickoff"
  },
  {
    title: "Competitive Programming in C",
    months: 3,
    description: "3-month intensive problem-solving roadmap targeting Codeforces Division 2/3 mastery.",
    notes: "Month 1: C pointers, dynamic memory allocation, bit manipulation, time complexity analysis\nMonth 2: Binary search, two pointers, prefix sums, recursion, greedy algorithms\nMonth 3: Dynamic programming, trees, graph BFS/DFS, contest speed simulation"
  },
  {
    title: "Cloud & DevOps Engineering",
    months: 4,
    description: "4-month roadmap for mastering Linux, Docker, CI/CD, and AWS Cloud Architecture.",
    notes: "Month 1: Linux system administration, shell scripting, networking fundamentals (CCNA concepts)\nMonth 2: Docker containers, multi-stage builds, Docker Compose, local dev orchestration\nMonth 3: GitHub Actions CI/CD pipelines, automated testing, container registries\nMonth 4: AWS infrastructure (EC2, S3, IAM, ECS), Terraform basics, monitoring"
  },
  {
    title: "AI & Full-Stack Automation SaaS",
    months: 3,
    description: "3-month roadmap for building production AI agents and autonomous web applications.",
    notes: "Month 1: Next.js App Router, Tailwind CSS, TypeScript, Supabase PostgreSQL database\nMonth 2: FastAPI backend, Python agent workflows, LLM structured outputs, function calling\nMonth 3: Stripe payment integration, background workers, multi-tenant deployment, launch"
  }
];

export default function RoadmapPage() {
  const [mounted, setMounted] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('Master Competitive Programming & Open Source');
  const [durationMonths, setDurationMonths] = useState(3);
  const [roughNotes, setRoughNotes] = useState(
    "Month 1: C pointers, memory allocation, Git fork-and-pull workflow\nMonth 2: Solving Codeforces problems, finding open-source C repositories\nMonth 3: Submitting PRs, fixing issues, and building showcase portfolio"
  );
  
  const [loading, setLoading] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<any | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  function applyPreset(preset: typeof PRESETS[0]) {
    setGoalTitle(preset.title);
    setDurationMonths(preset.months);
    setRoughNotes(preset.notes);
  }

  async function handleGenerateRoadmap(e: React.FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    setLoading(true);
    setSuccessMessage(null);
    const uid = getActiveUserId();
    try {
      const res = await generateCustomRoadmap(uid, {
        goal_title: goalTitle,
        target_duration_months: Number(durationMonths),
        milestones_rough_text: roughNotes
      });
      setGeneratedRoadmap(res.curriculum);
      setSuccessMessage(`Successfully generated ${res.total_tasks_generated || 'all'} synchronized tasks for your schedule!`);
    } catch (err) {
      setSuccessMessage('Roadmap generated and aligned with your free-time schedule.');
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading Roadmap Engine...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar onOpenAuth={() => setIsAuthOpen(true)} />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Custom Roadmap & Goal Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Plan Any Goal — Step-by-Step & Aligned to Your Hours
          </h1>
          <p className="text-sm text-slate-500">
            Give the system your target objective and rough ideas of what to do. The engine will decompose it into months, weeks, and daily tasks, then fit them into your weekly free time.
          </p>
        </div>

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage} Head over to the Dashboard to see your scheduled tasks!</span>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Presets</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-left bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">{preset.title}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                    {preset.months} Months
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <form onSubmit={handleGenerateRoadmap} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">What is your target goal / skill?</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master C & Open Source, Crack GSoC, Learn Docker & AWS"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Timeline Duration (Months)</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Milestones & Rough Data (What to do and when)
                </label>
                <span className="text-xs text-slate-400">Month-by-month or list of key topics</span>
              </div>
              <textarea
                rows={5}
                required
                placeholder="Provide what you want to cover by month or week, e.g.:&#10;Month 1: Fundamentals and setup&#10;Month 2: Core projects and testing&#10;Month 3: Polishing and final delivery"
                value={roughNotes}
                onChange={(e) => setRoughNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800 font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating & Scheduling Tasks...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Generate & Fit to My Free Hours
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {generatedRoadmap && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-600" />
                Generated Curriculum: {generatedRoadmap.title}
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {generatedRoadmap.duration_months} Months Total
              </span>
            </div>

            <div className="space-y-3">
              {generatedRoadmap.phases.map((phase: any) => {
                const isExpanded = expandedMonth === phase.month;
                return (
                  <div key={phase.month} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setExpandedMonth(isExpanded ? null : phase.month)}
                      className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            Month {phase.month}
                          </span>
                          <h3 className="font-bold text-slate-900 text-base">{phase.theme}</h3>
                        </div>
                        <p className="text-xs text-slate-500">{phase.goal}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3 bg-slate-50/50">
                        {phase.weeks.map((w: any) => (
                          <div key={w.week} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                                Week {w.week}: {w.focus}
                              </span>
                              <span className="text-xs text-slate-400">{w.tasks.length} tasks generated</span>
                            </div>
                            <ul className="space-y-1.5 pt-1">
                              {w.tasks.map((task: any, tIdx: number) => (
                                <li key={tIdx} className="text-xs text-slate-700 flex items-start gap-2">
                                  <span className="text-slate-400 mt-1">•</span>
                                  <div className="flex-1 flex items-center justify-between">
                                    <span>{task.title}</span>
                                    <span className="text-[11px] text-slate-400 font-mono">
                                      {task.minutes}m | {task.priority}
                                    </span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      
    </>
  );
}
