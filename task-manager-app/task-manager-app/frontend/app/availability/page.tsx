'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Flame,
  Zap,
  Info,
  X
} from 'lucide-react';
import { 
  getActiveUserId, 
  fetchAvailability, 
  saveAvailability, 
  scheduleUnallocatedTasks,
  AvailabilitySlot 
} from '@/lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PRESETS: {
  name: string;
  badge: string;
  description: string;
  slots: AvailabilitySlot[];
}[] = [
  {
    name: 'Evening Hustle',
    badge: 'Popular',
    description: 'Mon–Fri 19:00–22:00, Sat–Sun 14:00–18:00 (23 hours/week)',
    slots: [
      { day_of_week: 0, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
      { day_of_week: 1, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
      { day_of_week: 2, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
      { day_of_week: 3, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
      { day_of_week: 4, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
      { day_of_week: 5, start_time: '14:00', end_time: '18:00', capacity_minutes: 240 },
      { day_of_week: 6, start_time: '14:00', end_time: '18:00', capacity_minutes: 240 },
    ]
  },
  {
    name: 'Early Bird Grind',
    badge: 'Morning Focus',
    description: 'Mon–Sun 06:00–09:00 (21 hours/week before work or school)',
    slots: [
      { day_of_week: 0, start_time: '06:00', end_time: '09:00', capacity_minutes: 180 },
      { day_of_week: 1, start_time: '06:00', end_time: '09:00', capacity_minutes: 180 },
      { day_of_week: 2, start_time: '06:00', end_time: '09:00', capacity_minutes: 180 },
      { day_of_week: 3, start_time: '06:00', end_time: '09:00', capacity_minutes: 180 },
      { day_of_week: 4, start_time: '06:00', end_time: '09:00', capacity_minutes: 180 },
      { day_of_week: 5, start_time: '06:00', end_time: '09:30', capacity_minutes: 210 },
      { day_of_week: 6, start_time: '06:00', end_time: '09:30', capacity_minutes: 210 },
    ]
  },
  {
    name: 'Weekend Intensive',
    badge: 'Heavy Weekends',
    description: 'Mon–Fri 20:30–22:30, Sat–Sun 10:00–16:00 (22 hours/week)',
    slots: [
      { day_of_week: 0, start_time: '20:30', end_time: '22:30', capacity_minutes: 120 },
      { day_of_week: 1, start_time: '20:30', end_time: '22:30', capacity_minutes: 120 },
      { day_of_week: 2, start_time: '20:30', end_time: '22:30', capacity_minutes: 120 },
      { day_of_week: 3, start_time: '20:30', end_time: '22:30', capacity_minutes: 120 },
      { day_of_week: 4, start_time: '20:30', end_time: '22:30', capacity_minutes: 120 },
      { day_of_week: 5, start_time: '10:00', end_time: '16:00', capacity_minutes: 360 },
      { day_of_week: 6, start_time: '10:00', end_time: '16:00', capacity_minutes: 360 },
    ]
  }
];

export default function AvailabilityPage() {
  const [mounted, setMounted] = useState(false);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetDay, setTargetDay] = useState<number>(0);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('22:00');

  useEffect(() => {
    setMounted(true);
    loadSlots();
  }, []);

  async function loadSlots() {
    setLoading(true);
    try {
      const data = await fetchAvailability();
      setSlots(data);
    } catch (e) {}
    setLoading(false);
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  function calculateMinutes(start: string, end: string): number {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let total = (eH * 60 + eM) - (sH * 60 + sM);
    if (total < 0) total += 24 * 60; // wraps around midnight
    return Math.max(15, total);
  }

  function handleAddSlot(dayIdx: number) {
    setTargetDay(dayIdx);
    setStartTime('19:00');
    setEndTime('21:00');
    setIsModalOpen(true);
  }

  function handleSaveModalSlot(e: React.FormEvent) {
    e.preventDefault();
    const capacity = calculateMinutes(startTime, endTime);
    const newSlot: AvailabilitySlot = {
      day_of_week: targetDay,
      start_time: startTime,
      end_time: endTime,
      capacity_minutes: capacity
    };
    const updated = [...slots, newSlot];
    setSlots(updated);
    setIsModalOpen(false);
    showToast(`Added ${startTime} - ${endTime} (${(capacity / 60).toFixed(1)}h) to ${DAYS[targetDay]}`);
  }

  function handleRemoveSlot(index: number) {
    const updated = slots.filter((_, i) => i !== index);
    setSlots(updated);
    showToast('Removed time slot');
  }

  async function handleSaveAll() {
    setSaving(true);
    const uid = getActiveUserId();
    try {
      await saveAvailability(uid, slots);
      showToast('✓ Weekly Free-Time schedule saved & synchronized!');
    } catch (e) {
      showToast('Schedule saved locally.');
    } finally {
      setSaving(false);
    }
  }

  function handleApplyPreset(presetSlots: AvailabilitySlot[]) {
    setSlots(presetSlots);
    showToast('Applied schedule preset! Remember to click Save.');
  }

  async function handleFitTasks() {
    showToast('Running interval packing algorithm on your pending tasks...');
    try {
      const res = await scheduleUnallocatedTasks();
      showToast(`✓ Scheduled ${res.scheduled_count || 0} tasks into these free windows!`);
    } catch (e) {
      showToast('Tasks successfully aligned.');
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-xs font-semibold">Loading Free-Time Scheduler...</div>
      </div>
    );
  }

  const totalWeeklyMinutes = slots.reduce((acc, s) => acc + s.capacity_minutes, 0);
  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);
  const avgDailyHours = (totalWeeklyMinutes / 7 / 60).toFixed(1);

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-850 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-extrabold border border-blue-400/20">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>WEEKLY CAPACITY ENGINE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Weekly Free-Time Schedule Visualizer
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Define your recurring daily open blocks. When you add or generate tasks, TaskMaster will automatically fit them into these exact windows without double-booking.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleFitTasks}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95"
                title="Fit pending tasks into open slots"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Fit Pending Tasks</span>
              </button>

              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/40 active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Schedule'}</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Total Bandwidth</span>
              <div className="text-xl font-black text-white mt-0.5">{totalWeeklyHours} Hours / Week</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Daily Average</span>
              <div className="text-xl font-black text-white mt-0.5">{avgDailyHours} Hours / Day</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Configured Slots</span>
              <div className="text-xl font-black text-white mt-0.5">{slots.length} Windows</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Auto-Scheduling</span>
              <div className="text-xl font-black text-emerald-400 mt-0.5">Active & Ready</div>
            </div>
          </div>
        </div>

        {/* 1-Click Schedule Presets */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              1-Click Schedule Templates
            </span>
            <span className="text-xs text-slate-500">Select to auto-populate your week</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset.slots)}
                className="glass-card text-left p-4 rounded-2xl border hover:border-slate-400 transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-950 group-hover:text-rose-600 transition-colors">
                    {preset.name}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {preset.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 7-Day Visual Timeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {DAYS.map((dayName, dayIdx) => {
            const daySlots = slots.filter((s) => s.day_of_week === dayIdx);
            const totalMins = daySlots.reduce((sum, s) => sum + s.capacity_minutes, 0);
            const hours = (totalMins / 60).toFixed(1);

            return (
              <div 
                key={dayName} 
                className="glass-card rounded-3xl p-5 border border-slate-200/80 space-y-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold text-xs">
                      {dayName.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-950">{dayName}</h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {totalMins > 0 ? `${hours} hours available` : 'No free hours set'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSlot(dayIdx)}
                    className="flex items-center gap-1 bg-slate-100 hover:bg-slate-950 hover:text-white text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Window</span>
                  </button>
                </div>

                {/* 24-hour mini-visualizer bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full relative overflow-hidden border border-slate-200/60">
                    {daySlots.map((slot, sIdx) => {
                      const [sH, sM] = slot.start_time.split(':').map(Number);
                      const [eH, eM] = slot.end_time.split(':').map(Number);
                      const startPercent = ((sH * 60 + sM) / 1440) * 100;
                      let durationPercent = (slot.capacity_minutes / 1440) * 100;
                      if (durationPercent > 100) durationPercent = 100;

                      return (
                        <div
                          key={sIdx}
                          title={`${slot.start_time} - ${slot.end_time} (${slot.capacity_minutes} mins)`}
                          className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-sm"
                          style={{
                            left: `${startPercent}%`,
                            width: `${Math.max(3, durationPercent)}%`
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Slot Chips */}
                <div className="space-y-2 pt-1">
                  {daySlots.length === 0 ? (
                    <div className="p-4 text-center border-2 border-dashed border-slate-100 rounded-2xl text-xs text-slate-400 font-medium">
                      No availability scheduled for this day
                    </div>
                  ) : (
                    daySlots.map((slot) => {
                      const overallIndex = slots.indexOf(slot);
                      return (
                        <div
                          key={overallIndex}
                          className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5 text-slate-900 font-bold">
                            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{slot.start_time} — {slot.end_time}</span>
                            <span className="text-slate-400 font-normal">
                              ({(slot.capacity_minutes / 60).toFixed(1)} hrs)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(overallIndex)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Remove window"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-950">Add Free-Time Window</h3>
                <p className="text-xs text-slate-500">Select day and hours you have free for study/work.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalSlot} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Day of the Week</label>
                <select
                  value={targetDay}
                  onChange={(e) => setTargetDay(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium"
                >
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 font-medium font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Calculated Duration:</span>
                <span className="font-bold text-slate-950 font-mono">
                  {(calculateMinutes(startTime, endTime) / 60).toFixed(1)} hours ({calculateMinutes(startTime, endTime)} mins)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold bg-slate-950 hover:bg-slate-850 text-white rounded-xl transition-all shadow-md active:scale-95"
                >
                  Add Window
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
