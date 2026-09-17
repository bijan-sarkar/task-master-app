'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Flame, 
  Award, 
  Check, 
  Layers, 
  ChevronRight, 
  HelpCircle, 
  Bookmark, 
  TrendingUp, 
  Filter, 
  Compass, 
  FileText,
  Star,
  Zap,
  Info
} from 'lucide-react';
import { 
  fetchUserSemesters, 
  createSemester, 
  enrollCourse, 
  deleteCourse, 
  updateTopicStatus, 
  createTopicStudyTaskLocally, 
  getActiveUser,
  UserSemesterRecord,
  DIUCourseItem,
  DIUTopicItem
} from '@/lib/api';
import { DIU_SEMESTER_PRESETS, DIU_COURSE_CATALOG } from '@/lib/diuData';

export default function DIUSemesterDashboard() {
  const [mounted, setMounted] = useState(false);
  const [semesters, setSemesters] = useState<UserSemesterRecord[]>([]);
  const [activeSemId, setActiveSemId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState<any>(null);

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isNewSemModalOpen, setIsNewSemModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Semester Form
  const [newSemTitle, setNewSemTitle] = useState('Semester 3 (Level 2 Term 1)');
  const [newSemTerm, setNewSemTerm] = useState('Spring 2025');
  const [newSemDept, setNewSemDept] = useState('CSE');

  // Enrollment Form
  const [enrollType, setEnrollType] = useState<'preset' | 'catalog' | 'custom'>('preset');
  const [selectedPresetSem, setSelectedPresetSem] = useState<number>(3);
  const [selectedCatalogCourse, setSelectedCatalogCourse] = useState<string>('CSE221');
  const [customCourseCode, setCustomCourseCode] = useState('');
  const [customCourseName, setCustomCourseName] = useState('');
  const [customCredits, setCustomCredits] = useState('3.0');

  useEffect(() => {
    setMounted(true);
    const u = getActiveUser();
    setActiveUser(u);
    loadSemesters();

    const handleUpdate = () => loadSemesters();
    window.addEventListener('diu_semesters_updated', handleUpdate);
    return () => window.removeEventListener('diu_semesters_updated', handleUpdate);
  }, []);

  async function loadSemesters() {
    setLoading(true);
    const list = await fetchUserSemesters();
    setSemesters(list);
    if (list.length > 0) {
      const active = list.find(s => s.is_active === 1) || list[0];
      setActiveSemId(active.id);
    }
    setLoading(false);
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  const currentSemester = semesters.find(s => s.id === activeSemId) || semesters[0];
  const courses: DIUCourseItem[] = currentSemester?.courses || [];

  // Calculate overall metrics
  const totalCourses = courses.length;
  const totalCredits = courses.reduce((sum, c) => sum + parseFloat(c.credits || '3.0'), 0);

  let totalMidTopics = 0;
  let masteredMidTopics = 0;
  let totalFinalTopics = 0;
  let masteredFinalTopics = 0;
  const pendingCriticalTopics: { course: DIUCourseItem; topic: DIUTopicItem }[] = [];

  courses.forEach(c => {
    (c.midterm_topics || []).forEach(t => {
      totalMidTopics++;
      if (t.status === 'mastered') masteredMidTopics++;
      else if (t.priority_stars >= 5) pendingCriticalTopics.push({ course: c, topic: t });
    });
    (c.final_topics || []).forEach(t => {
      totalFinalTopics++;
      if (t.status === 'mastered') masteredFinalTopics++;
      else if (t.priority_stars >= 5) pendingCriticalTopics.push({ course: c, topic: t });
    });
  });

  const midReadinessPct = totalMidTopics > 0 ? Math.round((masteredMidTopics / totalMidTopics) * 100) : 0;
  const finalReadinessPct = totalFinalTopics > 0 ? Math.round((masteredFinalTopics / totalFinalTopics) * 100) : 0;

  async function handleCreateSemester(e: React.FormEvent) {
    e.preventDefault();
    if (!newSemTitle.trim()) return;
    const sem = await createSemester(newSemTitle, newSemTerm, newSemDept);
    setActiveSemId(sem.id);
    setIsNewSemModalOpen(false);
    showToast(`Created & switched to ${sem.title}!`);
  }

  async function handleEnrollSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentSemester) return;

    if (enrollType === 'preset') {
      const preset = (DIU_SEMESTER_PRESETS[currentSemester.department || 'CSE'] || []).find(p => p.semester_number === selectedPresetSem);
      if (preset) {
        for (const item of preset.recommended_courses) {
          await enrollCourse(currentSemester.id, item.code, item.name);
        }
        showToast(`Enrolled all ${preset.recommended_courses.length} courses for ${preset.title}!`);
      }
    } else if (enrollType === 'catalog') {
      const cat = DIU_COURSE_CATALOG[selectedCatalogCourse];
      if (cat) {
        await enrollCourse(currentSemester.id, cat.code, cat.name);
        showToast(`Enrolled ${cat.code} - ${cat.name}!`);
      }
    } else {
      if (!customCourseCode.trim()) return;
      await enrollCourse(currentSemester.id, customCourseCode.toUpperCase().trim(), customCourseName.trim() || undefined);
      showToast(`Added ${customCourseCode.toUpperCase()}!`);
    }

    setIsEnrollModalOpen(false);
    loadSemesters();
  }

  async function handleDeleteCourse(courseId: string, courseCode: string) {
    if (!confirm(`Are you sure you want to remove ${courseCode} from this semester?`)) return;
    await deleteCourse(courseId, currentSemester.id);
    showToast(`Removed ${courseCode}`);
    loadSemesters();
  }

  async function handleQuickToggleMastery(topicId: string, currentStatus: string, courseCode: string) {
    const nextStatus = currentStatus === 'mastered' ? 'pending' : 'mastered';
    await updateTopicStatus(topicId, nextStatus, currentSemester?.id, courseCode);
    showToast(nextStatus === 'mastered' ? 'Topic marked as Mastered (100%)!' : 'Topic reset to pending');
    loadSemesters();
  }

  function handleScheduleStudy(topic: DIUTopicItem, courseCode: string) {
    createTopicStudyTaskLocally(topic, courseCode);
    showToast(`Scheduled 90m revision session for "${topic.name}" in your planner!`);
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        
        {/* Top University & Student Identity Header */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                Daffodil International University (DIU)
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {activeUser?.name || 'DIU Student'}&apos;s Academic Prep Portal
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Track semester courses, master previous years&apos; DIU exam questions, view topic priority ratings, and cover essential prerequisites for Midterm & Final exams.
              </p>

              {/* Semester Selector & Info Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {semesters.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSemId(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      s.id === currentSemester?.id
                        ? 'bg-emerald-500 text-white shadow-md ring-2 ring-white/20'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
                <button
                  onClick={() => setIsNewSemModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/15 text-white hover:bg-white/25 border border-white/10 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Semester</span>
                </button>
              </div>
            </div>

            {/* Quick Summary Pill Widget */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[260px]">
              <div>
                <span className="text-[11px] uppercase font-bold text-emerald-300 block">Enrolled Courses</span>
                <span className="text-2xl font-extrabold text-white">{totalCourses} Courses</span>
                <span className="text-[10px] text-slate-300 block">{totalCredits.toFixed(1)} Total Credits</span>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-teal-300 block">Current Term</span>
                <span className="text-lg font-extrabold text-white">{currentSemester?.term || 'Spring 2025'}</span>
                <span className="text-[10px] text-slate-300 block">Dept: {currentSemester?.department || 'CSE'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* DIU Exam Timelines & Readiness Gauge Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Midterm Readiness Card */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200/90 shadow-sm bg-white hover:border-emerald-500/40 transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                    DIU Midterm Exam Scope (Weeks 1 - 7)
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900">Midterm Preparation Readiness</h2>
                <p className="text-xs text-slate-500">
                  Weightage: 25 Marks | Covers foundation modules, memory management, and primary algorithms
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600">{midReadinessPct}%</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Mastery</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${midReadinessPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>{masteredMidTopics} of {totalMidTopics} Midterm Topics Mastered</span>
                <span>{totalMidTopics - masteredMidTopics} Topics Pending</span>
              </div>
            </div>
          </div>

          {/* Final Exam Readiness Card */}
          <div className="glass-card rounded-2xl p-5 border border-slate-200/90 shadow-sm bg-white hover:border-blue-500/40 transition-all">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                    DIU Final Exam Scope (Weeks 8 - 14)
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900">Final Exam Preparation Readiness</h2>
                <p className="text-xs text-slate-500">
                  Weightage: 40 Marks | Advanced data structures, trees, graphs, dynamic programming, system design
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-blue-600">{finalReadinessPct}%</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Mastery</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${finalReadinessPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>{masteredFinalTopics} of {totalFinalTopics} Final Topics Mastered</span>
                <span>{totalFinalTopics - masteredFinalTopics} Topics Pending</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions & Enrolled Courses Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700" />
              Enrolled Courses for {currentSemester?.title || 'This Semester'}
            </h2>
            <p className="text-xs text-slate-500">
              Select any course to view its Midterm & Final topic breakdown, question types, and prerequisite survival guides.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/past-questions"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300/80 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>DIU Question Bank</span>
            </Link>
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Courses</span>
            </button>
          </div>
        </div>

        {/* Enrolled Courses Grid */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900">No Courses Enrolled Yet</h3>
              <p className="text-xs text-slate-500">
                Enroll in standard DIU semester course packages or add your enrolled courses to access topic recommendations and previous years&apos; questions.
              </p>
            </div>
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-md hover:bg-emerald-800 transition-colors"
            >
              + 1-Click Enroll DIU Semester Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => {
              const midTopics = course.midterm_topics || [];
              const finalTopics = course.final_topics || [];
              const midDone = midTopics.filter(t => t.status === 'mastered').length;
              const finalDone = finalTopics.filter(t => t.status === 'mastered').length;
              const midPct = midTopics.length > 0 ? Math.round((midDone / midTopics.length) * 100) : 0;
              const finalPct = finalTopics.length > 0 ? Math.round((finalDone / finalTopics.length) * 100) : 0;
              const criticalCount = [...midTopics, ...finalTopics].filter(t => t.priority_stars >= 5).length;

              return (
                <div 
                  key={course.id || course.code}
                  className="glass-card rounded-2xl p-5 border border-slate-200 bg-white flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                            {course.code}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {course.credits} Credits
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-emerald-800 transition-colors">
                          {course.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDeleteCourse(course.id, course.code)}
                        className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {course.description || 'DIU Syllabus core modules, past exam questions, and preparation guides.'}
                    </p>

                    {/* Progress Bars */}
                    <div className="space-y-2.5 pt-2">
                      {/* Midterm Readiness */}
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span className="flex items-center gap-1 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Midterm Prep
                          </span>
                          <span>{midPct}% ({midDone}/{midTopics.length})</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${midPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Final Readiness */}
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span className="flex items-center gap-1 text-blue-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Final Prep
                          </span>
                          <span>{finalPct}% ({finalDone}/{finalTopics.length})</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${finalPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {criticalCount} Critical Topics
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        <FileText className="w-3 h-3 text-slate-500" />
                        {course.past_questions?.length || 0} Past Questions
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/course/${course.code}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-sm transition-all text-center"
                    >
                      <span>Exam Prep & Topics</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Critical & Guaranteed Exam Topics Across Courses */}
        {pendingCriticalTopics.length > 0 && (
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                    High Priority
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    DIU Guaranteed / Critical Topics Pending Review
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  These topics have appeared repeatedly in past DIU exams and carry 10–15 marks each.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {pendingCriticalTopics.length} Critical Topics Remaining
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {pendingCriticalTopics.slice(0, 6).map(({ course, topic }) => (
                <div 
                  key={topic.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between hover:bg-white hover:border-emerald-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                          {course.code}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          topic.exam_term === 'midterm' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {topic.exam_term.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-0.5">
                        <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        {topic.marks_weightage}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {topic.name}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {topic.description}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {topic.expected_question_types.map(type => (
                        <span key={type} className="text-[9px] font-bold px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-600">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4 mt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => handleScheduleStudy(topic, course.code)}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>Schedule 90m Study</span>
                    </button>

                    <button
                      onClick={() => handleQuickToggleMastery(topic.id, topic.status, course.code)}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark Mastered</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ==================== MODAL: ENROLL COURSES ==================== */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Course Selection</span>
                <h3 className="text-xl font-black text-slate-900">Enroll Courses in {currentSemester?.title}</h3>
                <p className="text-xs text-slate-500">Choose a 1-click DIU semester package or enroll individual courses.</p>
              </div>
              <button 
                onClick={() => setIsEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setEnrollType('preset')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  enrollType === 'preset' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                1-Click Semester Bundle
              </button>
              <button
                type="button"
                onClick={() => setEnrollType('catalog')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  enrollType === 'catalog' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                DIU Course Catalog
              </button>
              <button
                type="button"
                onClick={() => setEnrollType('custom')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  enrollType === 'custom' ? 'bg-white text-emerald-800 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                Custom Course
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              {enrollType === 'preset' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">
                    Choose DIU Recommended Semester Bundle (CSE/SWE)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(DIU_SEMESTER_PRESETS[currentSemester?.department || 'CSE'] || []).map(p => (
                      <button
                        key={p.semester_number}
                        type="button"
                        onClick={() => setSelectedPresetSem(p.semester_number)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedPresetSem === p.semester_number
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <span className="text-xs font-extrabold block">{p.title}</span>
                        <span className="text-[10px] text-slate-500 block">{p.level_term}</span>
                        <span className="text-[10px] text-emerald-700 block font-semibold mt-1">
                          {p.recommended_courses.length} Core Courses
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {enrollType === 'catalog' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Select Course from Catalog</label>
                  <select
                    value={selectedCatalogCourse}
                    onChange={(e) => setSelectedCatalogCourse(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    {Object.values(DIU_COURSE_CATALOG).map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.credits} Credits)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Includes all past question banks, topic priorities, and prerequisites guide.
                  </p>
                </div>
              )}

              {enrollType === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block">Course Code (e.g. CSE323)</label>
                    <input
                      type="text"
                      placeholder="CSE323"
                      value={customCourseCode}
                      onChange={(e) => setCustomCourseCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block">Course Title</label>
                    <input
                      type="text"
                      placeholder="Web Engineering"
                      value={customCourseName}
                      onChange={(e) => setCustomCourseName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-md"
                >
                  Enroll Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CREATE SEMESTER ==================== */}
      {isNewSemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Academic Structure</span>
                <h3 className="text-xl font-black text-slate-900">Add New Semester</h3>
                <p className="text-xs text-slate-500">Configure semester details for your DIU student profile.</p>
              </div>
              <button 
                onClick={() => setIsNewSemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSemester} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block">Semester Name</label>
                <input
                  type="text"
                  value={newSemTitle}
                  onChange={(e) => setNewSemTitle(e.target.value)}
                  placeholder="e.g. Semester 4 (Level 2 Term 2)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block">Academic Term</label>
                  <input
                    type="text"
                    value={newSemTerm}
                    onChange={(e) => setNewSemTerm(e.target.value)}
                    placeholder="Spring 2025"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block">Department</label>
                  <select
                    value={newSemDept}
                    onChange={(e) => setNewSemDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  >
                    <option value="CSE">CSE</option>
                    <option value="SWE">SWE</option>
                    <option value="CIS">CIS</option>
                    <option value="EEE">EEE</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-md"
                >
                  Save Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
