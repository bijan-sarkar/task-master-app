'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Flame, 
  Star, 
  FileText, 
  HelpCircle, 
  Check, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Layers, 
  Info, 
  Award,
  Zap,
  Bookmark
} from 'lucide-react';
import { 
  getLocalSemesters, 
  updateTopicStatus, 
  createTopicStudyTaskLocally,
  DIUCourseItem,
  DIUTopicItem,
  DIUPastQuestionItem
} from '@/lib/api';
import { DIU_COURSE_CATALOG } from '@/lib/diuData';

export default function CourseDetailPage() {
  const params = useParams();
  const courseCode = (params?.code as string || 'CSE221').toUpperCase();

  const [mounted, setMounted] = useState(false);
  const [course, setCourse] = useState<DIUCourseItem | null>(null);
  const [activeTab, setActiveTab] = useState<'midterm' | 'final' | 'prerequisites' | 'questions'>('midterm');
  const [expandedTopicQuestions, setExpandedTopicQuestions] = useState<Record<string, boolean>>({});
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    loadCourseData();

    const handleUpdate = () => loadCourseData();
    window.addEventListener('diu_semesters_updated', handleUpdate);
    return () => window.removeEventListener('diu_semesters_updated', handleUpdate);
  }, [courseCode]);

  function loadCourseData() {
    const sems = getLocalSemesters();
    let found: DIUCourseItem | null = null;

    for (const sem of sems) {
      const match = (sem.courses || []).find(c => c.code.toUpperCase() === courseCode);
      if (match) {
        found = match;
        break;
      }
    }

    // Fallback to static catalog if not enrolled
    if (!found && DIU_COURSE_CATALOG[courseCode]) {
      found = DIU_COURSE_CATALOG[courseCode];
    }

    setCourse(found || DIU_COURSE_CATALOG.CSE221);
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function handleToggleMastery(topic: DIUTopicItem) {
    const nextStatus = topic.status === 'mastered' ? 'pending' : 'mastered';
    await updateTopicStatus(topic.id, nextStatus, undefined, courseCode);
    showToast(nextStatus === 'mastered' ? 'Topic marked as Mastered! 🎉' : 'Topic reset to pending.');
    loadCourseData();
  }

  function handleScheduleSession(topic: DIUTopicItem) {
    createTopicStudyTaskLocally(topic, courseCode);
    showToast(`Added 90m revision task for "${topic.name}" to your schedule!`);
  }

  function toggleTopicQuestions(topicName: string) {
    setExpandedTopicQuestions(prev => ({
      ...prev,
      [topicName]: !prev[topicName]
    }));
  }

  function toggleSolution(questionId: string) {
    setExpandedSolutions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  }

  if (!mounted || !course) return null;

  const midTopics = course.midterm_topics || [];
  const finalTopics = course.final_topics || [];
  const midMastered = midTopics.filter(t => t.status === 'mastered').length;
  const finalMastered = finalTopics.filter(t => t.status === 'mastered').length;
  const midPct = midTopics.length > 0 ? Math.round((midMastered / midTopics.length) * 100) : 0;
  const finalPct = finalTopics.length > 0 ? Math.round((finalMastered / finalTopics.length) * 100) : 0;

  const allCourseQuestions = course.past_questions || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-7">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="flex items-center gap-1 hover:text-emerald-700 font-bold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Semester Hub</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{course.code} Exam Prep</span>
        </div>

        {/* Hero Course Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-sm">
                  {course.code}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold border border-white/10">
                  {course.credits} Credits • {course.department || 'CSE'} Department
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {course.name}
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {course.description || 'DIU syllabus breakdown with previous years questions, topic priority ratings, and foundation guide.'}
              </p>
            </div>

            {/* Quick Readiness Dial */}
            <div className="grid grid-cols-2 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[280px]">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">Midterm Prep</span>
                <span className="text-2xl font-black text-white">{midPct}%</span>
                <span className="text-[10px] text-slate-300 block">{midMastered}/{midTopics.length} Topics Mastered</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-300 block">Final Prep</span>
                <span className="text-2xl font-black text-white">{finalPct}%</span>
                <span className="text-[10px] text-slate-300 block">{finalMastered}/{finalTopics.length} Topics Mastered</span>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('midterm')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'midterm'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Midterm Topics ({midTopics.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('final')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'final'
                ? 'bg-blue-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Final Exam Topics ({finalTopics.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('prerequisites')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'prerequisites'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Basic Things to Cover (Survival Guide)</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'questions'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Past Exam Questions ({allCourseQuestions.length})</span>
          </button>
        </div>

        {/* ==================== TAB 1: MIDTERM TOPICS ==================== */}
        {activeTab === 'midterm' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-sm">DIU Midterm Exam Structure (25 Marks)</span>
                <p className="text-emerald-800/90 leading-relaxed mt-0.5">
                  Covers Weeks 1 through 7. Below are the topics prioritized by their occurrence frequency in past DIU question papers. Mark topics as mastered as you prepare.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {midTopics.map((topic, index) => {
                const topicQuestions = allCourseQuestions.filter(q => q.topic_name === topic.name && q.exam_term === 'midterm');
                const isExpanded = expandedTopicQuestions[topic.name];

                return (
                  <div 
                    key={topic.id}
                    className="glass-card rounded-2xl p-5 border border-slate-200 bg-white hover:border-emerald-300 transition-all space-y-4 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Topic #{index + 1}
                          </span>

                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: topic.priority_stars }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>

                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            topic.priority_stars >= 5 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {topic.priority_label}
                          </span>

                          <span className="text-xs font-bold text-slate-500">
                            • {topic.repeat_frequency}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                          {topic.name}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {topic.description}
                        </p>
                      </div>

                      {/* Marks & Status Action */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 min-w-[140px]">
                        <div className="text-right">
                          <span className="text-xs font-bold text-rose-600 flex items-center gap-1 justify-end">
                            <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                            {topic.marks_weightage}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block">Expected Marks</span>
                        </div>

                        <button
                          onClick={() => handleToggleMastery(topic)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            topic.status === 'mastered'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{topic.status === 'mastered' ? 'Mastered ✓' : 'Mark Done'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Question Types Expected */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">
                        Question Types Expected:
                      </span>
                      {topic.expected_question_types.map((type) => (
                        <span 
                          key={type}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200/80"
                        >
                          {type}
                        </span>
                      ))}

                      <div className="ml-auto flex items-center gap-3">
                        <button
                          onClick={() => handleScheduleSession(topic)}
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>Schedule 90m Study</span>
                        </button>

                        {topicQuestions.length > 0 && (
                          <button
                            onClick={() => toggleTopicQuestions(topic.name)}
                            className="text-[11px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg"
                          >
                            <FileText className="w-3 h-3 text-emerald-700" />
                            <span>{topicQuestions.length} Past Questions</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Accordion: Past Questions for this topic */}
                    {isExpanded && topicQuestions.length > 0 && (
                      <div className="pt-3 border-t border-dashed border-slate-200 space-y-3 animate-fade-in">
                        <span className="text-xs font-bold text-slate-700 block">
                          Recent DIU Exam Questions on this Topic:
                        </span>
                        {topicQuestions.map((q) => (
                          <div key={q.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-800">{q.exam_session} • {q.marks} Marks</span>
                              <span className="px-2 py-0.5 rounded bg-white font-semibold text-[10px] text-slate-600 border border-slate-200 uppercase">
                                {q.question_type}
                              </span>
                            </div>
                            <p className="font-medium text-slate-900 whitespace-pre-line">{q.question_text}</p>
                            
                            {/* Solution Hints Toggle */}
                            {q.solution_hints && (
                              <div>
                                <button
                                  onClick={() => toggleSolution(q.id)}
                                  className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                                >
                                  <span>{expandedSolutions[q.id] ? 'Hide Solution Hints' : 'View Model Solution & Hints'}</span>
                                </button>
                                {expandedSolutions[q.id] && (
                                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 whitespace-pre-line">
                                    {q.solution_hints}
                                  </div>
                                )}
                              </div>
                            )}
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

        {/* ==================== TAB 2: FINAL TOPICS ==================== */}
        {activeTab === 'final' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-950 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-sm">DIU Final Exam Structure (40 Marks)</span>
                <p className="text-blue-800/90 leading-relaxed mt-0.5">
                  Covers Weeks 8 through 14 plus core foundational topics from midterm. Prioritized by exam frequency and marks weightage.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {finalTopics.map((topic, index) => {
                const topicQuestions = allCourseQuestions.filter(q => q.topic_name === topic.name && q.exam_term === 'final');
                const isExpanded = expandedTopicQuestions[topic.name];

                return (
                  <div 
                    key={topic.id}
                    className="glass-card rounded-2xl p-5 border border-slate-200 bg-white hover:border-blue-300 transition-all space-y-4 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            Final Topic #{index + 1}
                          </span>

                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: topic.priority_stars }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>

                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            topic.priority_stars >= 5 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {topic.priority_label}
                          </span>

                          <span className="text-xs font-bold text-slate-500">
                            • {topic.repeat_frequency}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                          {topic.name}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {topic.description}
                        </p>
                      </div>

                      {/* Marks & Status Action */}
                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 min-w-[140px]">
                        <div className="text-right">
                          <span className="text-xs font-bold text-rose-600 flex items-center gap-1 justify-end">
                            <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                            {topic.marks_weightage}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block">Expected Marks</span>
                        </div>

                        <button
                          onClick={() => handleToggleMastery(topic)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            topic.status === 'mastered'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-800'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{topic.status === 'mastered' ? 'Mastered ✓' : 'Mark Done'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Question Types Expected */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">
                        Question Types Expected:
                      </span>
                      {topic.expected_question_types.map((type) => (
                        <span 
                          key={type}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200/80"
                        >
                          {type}
                        </span>
                      ))}

                      <div className="ml-auto flex items-center gap-3">
                        <button
                          onClick={() => handleScheduleSession(topic)}
                          className="text-[11px] font-bold text-blue-800 hover:text-blue-950 flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>Schedule 90m Study</span>
                        </button>

                        {topicQuestions.length > 0 && (
                          <button
                            onClick={() => toggleTopicQuestions(topic.name)}
                            className="text-[11px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg"
                          >
                            <FileText className="w-3 h-3 text-blue-700" />
                            <span>{topicQuestions.length} Past Questions</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Accordion: Past Questions for this topic */}
                    {isExpanded && topicQuestions.length > 0 && (
                      <div className="pt-3 border-t border-dashed border-slate-200 space-y-3 animate-fade-in">
                        <span className="text-xs font-bold text-slate-700 block">
                          Recent DIU Final Exam Questions on this Topic:
                        </span>
                        {topicQuestions.map((q) => (
                          <div key={q.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-blue-800">{q.exam_session} • {q.marks} Marks</span>
                              <span className="px-2 py-0.5 rounded bg-white font-semibold text-[10px] text-slate-600 border border-slate-200 uppercase">
                                {q.question_type}
                              </span>
                            </div>
                            <p className="font-medium text-slate-900 whitespace-pre-line">{q.question_text}</p>
                            
                            {q.solution_hints && (
                              <div>
                                <button
                                  onClick={() => toggleSolution(q.id)}
                                  className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                                >
                                  <span>{expandedSolutions[q.id] ? 'Hide Solution Hints' : 'View Model Solution & Hints'}</span>
                                </button>
                                {expandedSolutions[q.id] && (
                                  <div className="mt-2 p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-[11px] text-blue-950 whitespace-pre-line">
                                    {q.solution_hints}
                                  </div>
                                )}
                              </div>
                            )}
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

        {/* ==================== TAB 3: PREREQUISITES & BASICS GUIDE ==================== */}
        {activeTab === 'prerequisites' && (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-purple-950">
                    {course.prerequisites_guide?.title || `${course.code} Survival & A+ Blueprint`}
                  </h2>
                  <p className="text-xs text-purple-800">
                    What foundational concepts you need to cover to perform well and secure an A+ at Daffodil International University.
                  </p>
                </div>
              </div>

              {/* Foundational Concepts */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-700" />
                  Foundational Prerequisites Needed
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(course.prerequisites_guide?.foundational_concepts || []).map((fc, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-purple-950">{fc.concept}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                          {fc.importance}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{fc.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* DIU A+ Strategy */}
              <div className="space-y-2 pt-3 border-t border-purple-200/80">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  DIU Teacher Grading Insights & A+ Strategy
                </h3>
                <ul className="space-y-2">
                  {(course.prerequisites_guide?.diu_a_plus_strategy || []).map((tip, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-purple-100">
                      <span className="font-extrabold text-purple-700">#{i + 1}</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Pitfalls */}
              <div className="space-y-2 pt-3 border-t border-purple-200/80">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Common Student Pitfalls (Where Marks are Lost)
                </h3>
                <ul className="space-y-1.5">
                  {(course.prerequisites_guide?.common_pitfalls || []).map((pitfall, i) => (
                    <li key={i} className="text-xs text-rose-900 flex items-start gap-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                      <span className="font-bold text-rose-600">✕</span>
                      <span>{pitfall}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Resources */}
              <div className="space-y-2 pt-3 border-t border-purple-200/80">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  Recommended Resources & Video Series
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(course.prerequisites_guide?.recommended_resources || []).map((res, i) => (
                    <span key={i} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-900 shadow-sm flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: ALL PAST QUESTIONS ==================== */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {course.code} Previous Years&apos; Question Papers
                </h3>
                <p className="text-xs text-slate-500">
                  Real Midterm and Final exam questions asked at Daffodil International University.
                </p>
              </div>
              <Link
                href={`/past-questions?course=${course.code}`}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shadow-sm"
              >
                Open Full Question Bank
              </Link>
            </div>

            <div className="space-y-3">
              {allCourseQuestions.map((q) => (
                <div key={q.id} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase ${
                        q.exam_term === 'midterm' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {q.exam_term}
                      </span>
                      <span className="text-xs font-bold text-slate-600">{q.exam_session}</span>
                      <span className="text-[11px] font-medium text-slate-400">• Topic: {q.topic_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-rose-600">{q.marks} Marks</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
                        {q.question_type}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-900 whitespace-pre-line leading-relaxed">
                    {q.question_text}
                  </p>

                  {q.solution_hints && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => toggleSolution(q.id)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                      >
                        <span>{expandedSolutions[q.id] ? 'Hide Solution Guidance' : 'View Model Solution & Key Points'}</span>
                        {expandedSolutions[q.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {expandedSolutions[q.id] && (
                        <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 whitespace-pre-line leading-relaxed">
                          {q.solution_hints}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
