'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Sparkles, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  CheckCircle2, 
  ArrowLeft, 
  Flame, 
  Tag, 
  HelpCircle,
  Clock,
  Layers
} from 'lucide-react';
import { 
  queryPastQuestions, 
  addPastQuestion, 
  DIUPastQuestionItem 
} from '@/lib/api';
import { DIU_COURSE_CATALOG } from '@/lib/diuData';

export default function PastQuestionsBankPage() {
  const [mounted, setMounted] = useState(false);
  const [questions, setQuestions] = useState<DIUPastQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedTerm, setSelectedTerm] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSession, setSelectedSession] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Expand states
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [practicedMap, setPracticedMap] = useState<Record<string, boolean>>({});

  // Add Question Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [newCourse, setNewCourse] = useState('CSE221');
  const [newTerm, setNewTerm] = useState<'midterm' | 'final'>('midterm');
  const [newSession, setNewSession] = useState('Fall 2024');
  const [newType, setNewType] = useState<'code' | 'dry_run' | 'theory' | 'difference' | 'math' | 'diagram'>('code');
  const [newMarks, setNewMarks] = useState(10);
  const [newTopic, setNewTopic] = useState('');
  const [newText, setNewText] = useState('');
  const [newHints, setNewHints] = useState('');

  useEffect(() => {
    setMounted(true);
    loadQuestions();

    const handleUpdate = () => loadQuestions();
    window.addEventListener('diu_questions_updated', handleUpdate);
    return () => window.removeEventListener('diu_questions_updated', handleUpdate);
  }, [selectedCourse, selectedTerm, selectedType, selectedSession]);

  async function loadQuestions() {
    setLoading(true);
    const data = await queryPastQuestions(
      selectedCourse,
      selectedTerm,
      selectedType,
      selectedSession
    );
    setQuestions(data);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  function toggleSolution(id: string) {
    setExpandedSolutions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  function togglePracticed(id: string) {
    setPracticedMap(prev => {
      const next = !prev[id];
      showToast(next ? 'Marked as practiced! Great job.' : 'Marked as unpracticed.');
      return { ...prev, [id]: next };
    });
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;

    await addPastQuestion({
      course_code: newCourse,
      exam_term: newTerm,
      exam_session: newSession,
      question_type: newType,
      marks: newMarks,
      topic_name: newTopic.trim() || 'General Practice',
      question_text: newText.trim(),
      solution_hints: newHints.trim() || ''
    });

    setIsAddModalOpen(false);
    showToast('Question contributed successfully to the DIU Question Bank!');
    setNewText('');
    setNewHints('');
    setNewTopic('');
    loadQuestions();
  }

  // Filter questions by search query
  const filteredQuestions = questions.filter(q => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      q.question_text.toLowerCase().includes(query) ||
      q.course_code.toLowerCase().includes(query) ||
      (q.topic_name && q.topic_name.toLowerCase().includes(query)) ||
      q.exam_session.toLowerCase().includes(query)
    );
  });

  const availableCourses = ['ALL', ...Object.keys(DIU_COURSE_CATALOG)];
  const availableTerms = ['ALL', 'Midterm', 'Final'];
  const availableTypes = ['ALL', 'Code', 'Dry_Run', 'Theory', 'Difference', 'Math', 'Diagram'];
  const availableSessions = ['ALL', 'Fall 2024', 'Spring 2024', 'Fall 2023', 'Summer 2023', 'Spring 2023', 'Fall 2022'];

  if (!mounted) return null;

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
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="flex items-center gap-1 hover:text-emerald-700 font-bold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Semester Hub</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">DIU Past Questions Bank</span>
        </div>

        {/* Hero Header */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                Previous Years Question Bank
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Daffodil International University Exam Archive
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Browse, search, and practice official previous semester exam questions categorized by question types (Code, Dry Run, Theory, Math, Diagrams) and difficulty.
              </p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Contribute Question</span>
            </button>
          </div>
        </section>

        {/* Filters Bar */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search past questions by keyword, topic, or question text (e.g., 'reverse linked list', 'AVL rotations', '0/1 knapsack')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Course Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Course Code</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                {availableCourses.map(c => (
                  <option key={c} value={c}>{c === 'ALL' ? 'All Courses' : c}</option>
                ))}
              </select>
            </div>

            {/* Exam Term Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Exam Term</label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                {availableTerms.map(t => (
                  <option key={t} value={t}>{t === 'ALL' ? 'All Terms (Mid & Final)' : t}</option>
                ))}
              </select>
            </div>

            {/* Question Type Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Question Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                {availableTypes.map(t => (
                  <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Academic Session */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Session / Year</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
              >
                {availableSessions.map(s => (
                  <option key={s} value={s}>{s === 'ALL' ? 'All Recent Semesters' : s}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Questions List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Showing {filteredQuestions.length} exam questions</span>
            <span>DIU Standard Exam Pattern</span>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Questions Matched Filters</h3>
              <p className="text-xs text-slate-500">
                Try clearing your search query or selecting &quot;All Courses&quot; to see more past papers.
              </p>
              <button
                onClick={() => {
                  setSelectedCourse('ALL');
                  setSelectedTerm('ALL');
                  setSelectedType('ALL');
                  setSelectedSession('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q) => {
                const isPracticed = practicedMap[q.id];
                const isExpanded = expandedSolutions[q.id];

                return (
                  <div 
                    key={q.id}
                    className={`p-6 rounded-2xl border transition-all space-y-3 shadow-sm ${
                      isPracticed 
                        ? 'bg-emerald-50/40 border-emerald-300/80' 
                        : 'bg-white border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-700 text-white font-black text-xs">
                          {q.course_code}
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          q.exam_term === 'midterm' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {q.exam_term}
                        </span>

                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-600 border border-slate-200 uppercase">
                          {q.question_type.replace('_', ' ')}
                        </span>

                        <span className="text-xs font-bold text-slate-500">
                          DIU {q.exam_session}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-rose-600 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          {q.marks} Marks
                        </span>

                        <button
                          onClick={() => togglePracticed(q.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            isPracticed 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>{isPracticed ? 'Practiced' : 'Mark Done'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Topic Link */}
                    {q.topic_name && (
                      <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>Topic: {q.topic_name}</span>
                      </div>
                    )}

                    {/* Question Content */}
                    <div className="text-sm font-medium text-slate-900 whitespace-pre-line leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      {q.question_text}
                    </div>

                    {/* Model Solution & Grading Pointers */}
                    {q.solution_hints && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => toggleSolution(q.id)}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide Model Solution & Answer Key' : 'View Model Solution & Grading Pointers'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 whitespace-pre-line leading-relaxed space-y-1 animate-fade-in">
                            <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wider">
                              DIU Faculty Grading Rubrics & Solution Hints:
                            </span>
                            <p>{q.solution_hints}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* ==================== MODAL: CONTRIBUTE PAST QUESTION ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Exam Archive</span>
                <h3 className="text-xl font-black text-slate-900">Contribute DIU Past Question</h3>
                <p className="text-xs text-slate-500">Help fellow students by adding questions from recent midterm or final exams.</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Course Code</label>
                  <select
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    {Object.keys(DIU_COURSE_CATALOG).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Exam Term</label>
                  <select
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="midterm">Midterm Exam</option>
                    <option value="final">Final Exam</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Session / Year</label>
                  <input
                    type="text"
                    value={newSession}
                    onChange={(e) => setNewSession(e.target.value)}
                    placeholder="Fall 2024"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Question Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                  >
                    <option value="code">Code Writing</option>
                    <option value="dry_run">Dry Run / Trace</option>
                    <option value="theory">Theory</option>
                    <option value="difference">Difference</option>
                    <option value="math">Math / Complexity</option>
                    <option value="diagram">Diagram / ERD</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Marks</label>
                  <input
                    type="number"
                    value={newMarks}
                    onChange={(e) => setNewMarks(parseInt(e.target.value) || 5)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    min={1}
                    max={40}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Topic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Singly Linked List Deletion or AVL Tree Rotation"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Question Text</label>
                <textarea
                  rows={4}
                  placeholder="Paste the full question text from the question paper..."
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Model Solution Hints / Key Pointers (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Key steps, formulas, or grading rubrics..."
                  value={newHints}
                  onChange={(e) => setNewHints(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-md"
                >
                  Submit Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
