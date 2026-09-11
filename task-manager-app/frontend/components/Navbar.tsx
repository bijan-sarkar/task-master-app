'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Calendar, Compass, User, LogOut, ShieldAlert, Sparkles, Mail, Phone, X } from 'lucide-react';
import { loginOrCreateUser } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [activeUser, setActiveUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Auth Form State
  const [name, setName] = useState('Bijon Sarkar');
  const [email, setEmail] = useState('bjspes2021@gmail.com');
  const [phone, setPhone] = useState('');
  const [tone, setTone] = useState('harsh');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
    window.addEventListener('storage_user_updated', loadUser);
    window.addEventListener('open_auth_modal', () => setIsAuthOpen(true));
    return () => {
      window.removeEventListener('storage_user_updated', loadUser);
      window.removeEventListener('open_auth_modal', () => setIsAuthOpen(true));
    };
  }, []);

  function loadUser() {
    try {
      const stored = localStorage.getItem('taskmaster_active_user');
      if (stored) {
        setActiveUser(JSON.parse(stored));
      } else {
        setActiveUser(null);
      }
    } catch (e) {}
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
      localStorage.setItem('taskmaster_active_user', JSON.stringify(user));
      window.dispatchEvent(new Event('storage_user_updated'));
      setIsAuthOpen(false);
    } catch (err) {
      const fallbackUser = {
        id: 'u-' + Date.now(),
        name,
        email,
        phone_number: phone,
        accountability_tone: tone
      };
      localStorage.setItem('taskmaster_active_user', JSON.stringify(fallbackUser));
      window.dispatchEvent(new Event('storage_user_updated'));
      setIsAuthOpen(false);
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    { name: 'Dashboard', href: '/', icon: CheckSquare },
    { name: 'Free Time', href: '/availability', icon: Calendar },
    { name: 'Roadmap', href: '/roadmap', icon: Compass },
  ];

  return (
    <>
      {/* Desktop Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-base shadow-sm">
                TM
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight text-lg">TaskMaster</span>
                <span className="hidden sm:inline text-[10px] uppercase tracking-wider ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                  {activeUser?.accountability_tone || 'Harsh'} Mode
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile / Login Button */}
          <div className="flex items-center gap-2">
            {activeUser ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pl-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 line-clamp-1">{activeUser.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{activeUser.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out / Switch User"
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-6 py-2 flex justify-around items-center shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-semibold transition-colors ${
                isActive ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Built-in Auth Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Account & Profile
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active User Sign-In</h2>
                <p className="text-xs text-slate-500">
                  Save your personal tasks, schedule, and roadmap into your Supabase database.
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
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bijon Sarkar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Address (for reminder alerts) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. you@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  WhatsApp Phone (optional)
                </label>
                <input
                  type="text"
                  placeholder="+8801XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                  Accountability Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-800 bg-white"
                >
                  <option value="harsh">Harsh (Tough Love — Recommended)</option>
                  <option value="roast">Roast (Aggressive Anti-Procrastination)</option>
                  <option value="firm">Firm (Direct & Objective)</option>
                  <option value="gentle">Gentle (Polite encouragement)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors shadow-md disabled:opacity-50 mt-2"
              >
                {loading ? 'Signing In...' : 'Save & Enter TaskMaster'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
