'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  Calculator, 
  ArrowLeft, 
  Award, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Target, 
  BookOpen, 
  HelpCircle,
  Percent,
  Flame
} from 'lucide-react';
import { getLocalSemesters, DIUCourseItem } from '@/lib/api';

const DIU_GRADING_SCALE = [
  { min: 80, grade: 'A+', gpa: 4.00, remark: 'Outstanding' },
  { min: 75, grade: 'A', gpa: 3.75, remark: 'Excellent' },
  { min: 70, grade: 'A-', gpa: 3.50, remark: 'Very Good' },
  { min: 65, grade: 'B+', gpa: 3.25, remark: 'Good' },
  { min: 60, grade: 'B', gpa: 3.00, remark: 'Satisfactory' },
  { min: 55, grade: 'B-', gpa: 2.75, remark: 'Above Average' },
  { min: 50, grade: 'C+', gpa: 2.50, remark: 'Average' },
  { min: 45, grade: 'C', gpa: 2.25, remark: 'Below Average' },
  { min: 40, grade: 'D', gpa: 2.00, remark: 'Pass' },
  { min: 0, grade: 'F', gpa: 0.00, remark: 'Fail' }
];

export default function CGPACalculatorPage() {
  const [mounted, setMounted] = useState(false);
  const [calcTab, setCalcTab] = useState<'single' | 'semester'>('single');

  // Single Course Mark Simulator (DIU 100 Marks Breakdown)
  const [attendance, setAttendance] = useState<number>(7);
  const [quizzes, setQuizzes] = useState<number>(14);
  const [assignment, setAssignment] = useState<number>(5);
  const [presentation, setPresentation] = useState<number>(8);
  const [midterm, setMidterm] = useState<number>(23);
  const [finalExam, setFinalExam] = useState<number>(35);

  // Target Goal Seeker
  const [targetGrade, setTargetGrade] = useState<'A+' | 'A' | 'A-'>('A+');

  // Semester CGPA Simulator
  const [semesterCourses, setSemesterCourses] = useState<{ name: string; credit: number; gpa: number }[]>([
    { name: 'Data Structures (CSE221)', credit: 3.0, gpa: 4.00 },
    { name: 'OOP (Java) (CSE213)', credit: 3.0, gpa: 3.75 },
    { name: 'Algorithms (CSE222)', credit: 3.0, gpa: 4.00 },
    { name: 'Math / Statistics', credit: 3.0, gpa: 3.50 }
  ]);
  const [prevCompletedCredits, setPrevCompletedCredits] = useState<number>(45);
  const [prevCGPA, setPrevCGPA] = useState<number>(3.65);

  useEffect(() => {
    setMounted(true);
    const sems = getLocalSemesters();
    if (sems.length > 0 && sems[0].courses?.length > 0) {
      const coursesFromSem = sems[0].courses.map(c => ({
        name: `${c.name} (${c.code})`,
        credit: parseFloat(c.credits || '3.0') || 3.0,
        gpa: 4.00
      }));
      setSemesterCourses(coursesFromSem);
    }
  }, []);

  // Compute Single Course Mark
  const continuousTotal = Math.min(7, Math.max(0, attendance)) +
    Math.min(15, Math.max(0, quizzes)) +
    Math.min(5, Math.max(0, assignment)) +
    Math.min(8, Math.max(0, presentation));

  const totalMarks = continuousTotal + Math.min(25, Math.max(0, midterm)) + Math.min(40, Math.max(0, finalExam));
  const currentBeforeFinal = continuousTotal + Math.min(25, Math.max(0, midterm)); // out of 60

  const matchingGrade = DIU_GRADING_SCALE.find(g => totalMarks >= g.min) || DIU_GRADING_SCALE[DIU_GRADING_SCALE.length - 1];

  // Target Goal Seeker calculation
  const targetThreshold = targetGrade === 'A+' ? 80 : targetGrade === 'A' ? 75 : 70;
  const neededInFinal = Math.max(0, targetThreshold - currentBeforeFinal);
  const isTargetAchievable = neededInFinal <= 40;

  // Compute Semester SGPA & CGPA
  const currentSemCredits = semesterCourses.reduce((sum, c) => sum + c.credit, 0);
  const currentSemPoints = semesterCourses.reduce((sum, c) => sum + (c.credit * c.gpa), 0);
  const computedSGPA = currentSemCredits > 0 ? (currentSemPoints / currentSemCredits) : 0.00;

  const totalAllCredits = prevCompletedCredits + currentSemCredits;
  const totalAllPoints = (prevCompletedCredits * prevCGPA) + currentSemPoints;
  const computedCumulativeCGPA = totalAllCredits > 0 ? (totalAllPoints / totalAllCredits) : 0.00;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-7">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="flex items-center gap-1 hover:text-emerald-700 font-bold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Semester Hub</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">DIU CGPA & Marks Predictor</span>
        </div>

        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
                <Calculator className="w-4 h-4" />
                Daffodil International University (DIU) 4.0 Scale
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                DIU Marks Predictor & CGPA Simulator
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Simulate marks with official DIU distribution: Attendance (7), Quizzes (15), Assignment (5), Presentation (8), Midterm (25), and Final (40). Plan your target Final exam score to guarantee an A+.
              </p>
            </div>

            {/* Quick SGPA Display */}
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-center min-w-[200px]">
              <span className="text-[11px] uppercase font-bold text-emerald-300 block">Predicted SGPA</span>
              <span className="text-3xl font-black text-white">{computedSGPA.toFixed(2)}</span>
              <span className="text-xs text-slate-300 block mt-0.5">Scale: 4.00</span>
            </div>
          </div>
        </section>

        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setCalcTab('single')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              calcTab === 'single'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Single Course Mark & Final Goal Seeker</span>
          </button>
          <button
            onClick={() => setCalcTab('semester')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
              calcTab === 'semester'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Full Semester SGPA & CGPA Planner</span>
          </button>
        </div>

        {/* ==================== TAB 1: SINGLE COURSE MARK & GOAL SEEKER ==================== */}
        {calcTab === 'single' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Input Form (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  DIU Official 100 Marks Distribution
                </h3>
                <p className="text-xs text-slate-500">
                  Adjust marks for each component to see your final letter grade and grade point.
                </p>
              </div>

              {/* Continuous Assessment Breakdown */}
              <div className="space-y-4">
                <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block border-b border-emerald-100 pb-1">
                  1. Continuous Assessment (Max 35 Marks)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Attendance</span>
                      <span className="text-emerald-700">{attendance} / 7 Marks</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={7}
                      value={attendance}
                      onChange={(e) => setAttendance(parseInt(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400">7 = 90%+, 6 = 80-89%, 5 = 70-79%</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Quizzes / Class Tests (Best 2-3)</span>
                      <span className="text-emerald-700">{quizzes} / 15 Marks</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={15}
                      value={quizzes}
                      onChange={(e) => setQuizzes(parseInt(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400">Average of best class tests</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Assignment / Case Study</span>
                      <span className="text-emerald-700">{assignment} / 5 Marks</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5}
                      value={assignment}
                      onChange={(e) => setAssignment(parseInt(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Presentation / Viva</span>
                      <span className="text-emerald-700">{presentation} / 8 Marks</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      value={presentation}
                      onChange={(e) => setPresentation(parseInt(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Exams Breakdown */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider block border-b border-blue-100 pb-1">
                  2. Midterm & Final Exams (Max 65 Marks)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Midterm Exam</span>
                      <span className="text-emerald-800 font-extrabold">{midterm} / 25 Marks</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={25}
                      value={midterm}
                      onChange={(e) => setMidterm(parseInt(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <span className="text-[10px] text-slate-500 block">Weeks 1 to 7 written exam</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>Final Exam</span>
                      <span className="text-blue-800 font-extrabold">{finalExam} / 40 Marks</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={finalExam}
                      onChange={(e) => setFinalExam(parseInt(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <span className="text-[10px] text-slate-500 block">Weeks 8 to 14 + cumulative exam</span>
                  </div>
                </div>
              </div>

              {/* Goal Seeker Calculator */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold">Target Final Exam Goal Seeker</h4>
                </div>
                <p className="text-xs text-slate-300">
                  You currently have <strong className="text-white">{currentBeforeFinal} / 60 marks</strong> (Continuous + Midterm).
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="text-xs text-slate-400">Target Grade:</span>
                  {(['A+', 'A', 'A-'] as const).map(tg => (
                    <button
                      key={tg}
                      onClick={() => setTargetGrade(tg)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        targetGrade === tg
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-white/15 text-white hover:bg-white/25'
                      }`}
                    >
                      {tg} ({tg === 'A+' ? '80+' : tg === 'A' ? '75+' : '70+'})
                    </button>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200">
                  {isTargetAchievable ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>
                        To secure an <strong className="text-emerald-300 font-extrabold">{targetGrade}</strong> in this course, you need at least <strong className="text-white text-sm font-black">{neededInFinal} out of 40</strong> in the Final Exam!
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-rose-300">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        An {targetGrade} requires {targetThreshold} marks, but even with 40/40 in the Final, your maximum total would be {currentBeforeFinal + 40}. Target {currentBeforeFinal + 40 >= 75 ? 'A (75+)' : 'A- (70+)'} instead!
                      </span>
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Live Result Card (1 Col) */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center space-y-4">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                  Course Prediction Result
                </span>

                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex flex-col items-center justify-center mx-auto shadow-lg ring-4 ring-emerald-100">
                  <span className="text-3xl font-black">{matchingGrade.grade}</span>
                  <span className="text-[11px] font-bold opacity-90">{matchingGrade.gpa.toFixed(2)} / 4.00</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-900">{matchingGrade.remark}</h4>
                  <span className="text-2xl font-black text-emerald-700 block">
                    {totalMarks} / 100 Marks
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600 text-left">
                  <div className="flex justify-between">
                    <span>Continuous Assessment:</span>
                    <strong className="text-slate-900">{continuousTotal} / 35</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Midterm Exam:</span>
                    <strong className="text-slate-900">{midterm} / 25</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Final Exam:</span>
                    <strong className="text-slate-900">{finalExam} / 40</strong>
                  </div>
                </div>
              </div>

              {/* DIU Official Grading Scale Table */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
                <span className="text-xs font-black uppercase text-slate-700 block">
                  DIU Official Grading System
                </span>
                <div className="divide-y divide-slate-100 text-xs">
                  {DIU_GRADING_SCALE.map((item) => (
                    <div 
                      key={item.grade}
                      className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${
                        matchingGrade.grade === item.grade ? 'bg-emerald-100/70 font-bold text-emerald-950' : 'text-slate-600'
                      }`}
                    >
                      <span>{item.min}% and above</span>
                      <span>{item.grade}</span>
                      <span>{item.gpa.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 2: SEMESTER SGPA & CGPA SIMULATOR ==================== */}
        {calcTab === 'semester' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Current Semester Courses (SGPA)</h3>
                  <p className="text-xs text-slate-500">Assign expected GPA to each enrolled course to project your semester result.</p>
                </div>
                <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl">
                  {currentSemCredits.toFixed(1)} Total Credits
                </span>
              </div>

              <div className="space-y-3">
                {semesterCourses.map((c, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">{c.name}</span>
                      <span className="text-[11px] text-slate-500">{c.credit} Credits</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={c.gpa}
                        onChange={(e) => {
                          const newGPA = parseFloat(e.target.value);
                          setSemesterCourses(prev => {
                            const updated = [...prev];
                            updated[idx].gpa = newGPA;
                            return updated;
                          });
                        }}
                        className="p-2 rounded-xl border border-slate-300 text-xs font-extrabold bg-white"
                      >
                        {DIU_GRADING_SCALE.map(g => (
                          <option key={g.grade} value={g.gpa}>
                            {g.grade} ({g.gpa.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cumulative CGPA Carry-Forward */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-700">Previous Semesters Carry-Over (Cumulative)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Total Previous Completed Credits</label>
                    <input
                      type="number"
                      value={prevCompletedCredits}
                      onChange={(e) => setPrevCompletedCredits(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Previous Cumulative CGPA</label>
                    <input
                      type="number"
                      step={0.01}
                      max={4.0}
                      min={0.0}
                      value={prevCGPA}
                      onChange={(e) => setPrevCGPA(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Column */}
            <div className="space-y-5">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center space-y-4">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block">
                  Projected Results
                </span>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 block">Current Semester SGPA</span>
                  <span className="text-3xl font-black text-emerald-950">{computedSGPA.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-700 block">Based on {currentSemCredits} credits</span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1">
                  <span className="text-[11px] font-bold text-blue-800 block">New Cumulative CGPA</span>
                  <span className="text-3xl font-black text-blue-950">{computedCumulativeCGPA.toFixed(2)}</span>
                  <span className="text-[10px] text-blue-700 block">Total {totalAllCredits} credits completed</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
