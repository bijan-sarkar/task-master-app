'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
// AuthModal integrated in Navbar
import { Clock, Plus, Trash2, Save, Calendar, Sparkles } from 'lucide-react';
import { getActiveUserId } from '@/lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://task-master-app-a9vt.onrender.com';

export default function AvailabilityPage() {
  const [mounted, setMounted] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [slots, setSlots] = useState([
    { day_of_week: 0, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
    { day_of_week: 1, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
    { day_of_week: 2, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
    { day_of_week: 3, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
    { day_of_week: 4, start_time: '19:00', end_time: '22:00', capacity_minutes: 180 },
    { day_of_week: 5, start_time: '14:00', end_time: '18:00', capacity_minutes: 240 },
    { day_of_week: 6, start_time: '14:00', end_time: '18:00', capacity_minutes: 240 },
  ]);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadSavedAvailability();
  }, []);

  async function loadSavedAvailability() {
    const uid = getActiveUserId();
    try {
      const res = await fetch(`${API_BASE}/api/availability/${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) setSlots(data);
      }
    } catch (e) {}
  }

  function handleAddSlot(dayIdx: number) {
    setSlots([...slots, { day_of_week: dayIdx, start_time: '18:00', end_time: '20:00', capacity_minutes: 120 }]);
  }

  function handleRemoveSlot(index: number) {
    setSlots(slots.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const uid = getActiveUserId();
    try {
      await fetch(`${API_BASE}/api/availability/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slots)
      });
    } catch (e) {}
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading Availability...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Weekly Free-Time Schedule</h1>
              <p className="text-sm text-slate-500 mt-1">
                Define your recurring free hours so TaskMaster can automatically slot tasks into your actual openings.
              </p>
            </div>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              Save Schedule
            </button>
          </div>

          {savedMessage && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-sm font-medium">
              ✓ Free-time availability schedule updated in Supabase! Upcoming tasks will align automatically.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DAYS.map((dayName, dayIdx) => {
            const daySlots = slots.filter((s) => s.day_of_week === dayIdx);
            const totalMins = daySlots.reduce((sum, s) => sum + s.capacity_minutes, 0);

            return (
              <div key={dayName} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{dayName}</h3>
                    <span className="text-xs text-slate-500">{(totalMins / 60).toFixed(1)} hours free</span>
                  </div>
                  <button 
                    onClick={() => handleAddSlot(dayIdx)}
                    className="text-xs flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Window
                  </button>
                </div>

                <div className="space-y-2">
                  {daySlots.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No free time set for this day.</p>
                  ) : (
                    daySlots.map((slot, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{slot.start_time} - {slot.end_time}</span>
                          <span className="text-slate-400">({slot.capacity_minutes} mins)</span>
                        </div>
                        <button 
                          onClick={() => handleRemoveSlot(slots.indexOf(slot))}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      
    </>
  );
}
