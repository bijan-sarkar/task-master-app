'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  CheckSquare, 
  Calendar, 
  Compass, 
  User, 
  LogOut, 
  Flame, 
  Sparkles, 
  Mail, 
  Phone, 
  X, 
  ShieldAlert, 
  ChevronRight, 
  Zap,
  GraduationCap,
  BookOpen,
  Calculator
} from 'lucide-react';
import { loginOrCreateUser, getActiveUser, UserProfile } from '@/lib/api';

export default function Navbar({ onOpenAuth }: { onOpenAuth?: () => void } = {}) {
  const pathname = usePathname();
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Auth Form State
  const [name, setName] = useState('Bijon Sarkar');
  const [email, setEmail] = useState('bijan.cse@diu.edu.bd');
  const [phone, setPhone] = useState('');
  const [tone, setTone] = useState('harsh');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
    const handleStorageUpdate = () => loadUser();
    const handleOpenAuth = () => setIsAuthOpen(true);

    window.addEventListener('storage_user_updated', handleStorageUpdate);
    window.addEventListener('open_auth_modal', handleOpenAuth);
    return () => {
      window.removeEventListener('storage_user_updated', handleStorageUpdate);
      window.removeEventListener('open_auth_modal', handleOpenAuth);
    };
  }, []);

  function loadUser() {
    const u = getActiveUser();
    setActiveUser(u);
    if (u) {
      setName(u.name || '');
      setEmail(u.email || '');
      setPhone(u.phone_number || '');
      setTone(u.accountability_tone || 'harsh');
    }
  }

  function handleLogout() {
    localStorage.removeItem('taskmaster_active_user');
    setActiveUser(null);
    window.dispatchEvent(new Event('storage_user_updated'));
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    setLoading(true);
    try {
      const user = await loginOrCreateUser({
        name,
        email,
        phone_number: phone || undefined,
        accountability_tone: tone
      });
      setActiveUser(user);
      window.dispatchEvent(new Event('storage_user_updated'));
      setIsAuthOpen(false);
    } catch (err) {
      console.warn('Login handled locally:', err);
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { name: 'Semester Hub', href: '/', icon: GraduationCap, badge: 'Courses & Prep' },
    { name: 'Question Bank', href: '/past-questions', icon: BookOpen, badge: 'Past Exams' },
    { name: 'DIU CGPA Calc', href: '/cgpa-calculator', icon: Calculator, badge: '4.0 Scale' },
    { name: 'Study Schedule', href: '/availability', icon: Calendar, badge: 'Free Time' },
    { name: 'Career Roadmap', href: '/roadmap', icon: Compass, badge: 'GSoC & AI' },
  ];

  const toneConfig: Record<string, { label: string; color: string; desc: string }> = {
    harsh: { label: 'Harsh Mode', color: 'bg-rose-100 text-rose-700 border-rose-200', desc: 'Direct, unapologetic reality checks when you procrastinate.' },
    roast: { label: 'Roast Mode', color: 'bg-orange-100 text-orange-700 border-orange-200', desc: 'Sarcastic anti-slacking roasts designed to hurt your ego.' },
    firm: { label: 'Firm Mode', color: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'Strict, no-nonsense progress demands without fluff.' },
    gentle: { label: 'Gentle Mode', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Encouraging nudges and positive reinforcement.' },
  };

  const currentTone = toneConfig[activeUser?.accountability_tone || 'harsh'] || toneConfig.harsh;

  return (
    <>
      {/* Sticky Frosted Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-emerald-900/10 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-800 via-teal-800 to-slate-900 flex items-center justify-center text-white font-black text-sm shadow-md ring-1 ring-emerald-400/30 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-950 tracking-tight text-lg">DIU SemTracker</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-700 text-emerald-50 tracking-wide uppercase">
                    DIU Edition
                  </span>
                </div>
                <span className="hidden sm:block text-[11px] text-emerald-800/80 font-medium -mt-0.5">
                  Daffodil International University Exam & Semester Mastery
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-emerald-900 shadow-sm ring-1 ring-emerald-600/20'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>


          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* Tone Pill */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-transform hover:scale-105 ${currentTone.color}`}
              title="Click to change accountability severity tone"
            >
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>{currentTone.label}</span>
            </button>

            {/* User Profile / Login */}
            {activeUser ? (
              <div className="flex items-center gap-2 bg-slate-100/90 border border-slate-200 rounded-2xl p-1.5 pl-3">
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="text-left hidden lg:block hover:opacity-80 transition-opacity"
                >
                  <div className="text-xs font-bold text-slate-900 leading-tight line-clamp-1">{activeUser.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono leading-none line-clamp-1">{activeUser.email}</div>
                </button>
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  title="Switch user or log out"
                  className="p-1.5 hover:bg-slate-200/80 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account Setup</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Floating Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex justify-around items-center shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl text-[11px] font-bold transition-all ${
                isActive ? 'bg-white/10 text-white ring-1 ring-white/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : ''}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User Auth & Settings Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-slide-up">
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold">
                  <Flame className="w-3 h-3 text-rose-600" />
                  Accountability Profile
                </div>
                <h2 className="text-xl font-black text-slate-950 tracking-tight">Active User & Alert Settings</h2>
                <p className="text-xs text-slate-500">
                  Save your personal roadmap, daily schedule, and choose your tough-love alert tone.
                </p>
              </div>
              <button 
                onClick={() => setIsAuthOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bijon Sarkar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address (for Harsh Reminder Alerts) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. you@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  WhatsApp Number (optional)
                </label>
                <input
                  type="tel"
                  placeholder="+8801XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                  Accountability Personality Tone
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {Object.entries(toneConfig).map(([key, cfg]) => {
                    const isSelected = tone === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTone(key)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-slate-950 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs capitalize">{key}</div>
                        <div className={`text-[10px] line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {key === 'harsh' ? 'Tough Love' : key === 'roast' ? 'Aggressive' : key === 'firm' ? 'Direct' : 'Supportive'}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 pt-1 italic">
                  "{toneConfig[tone]?.desc}"
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 mt-3"
              >
                {loading ? 'Saving Profile...' : 'Save & Enter TaskMaster'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
