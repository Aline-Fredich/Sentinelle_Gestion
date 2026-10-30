'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Task } from '@/types/sentinel';
import { getTodayDateString, isDateOverdue } from '@/lib/dateUtils';

interface CalendarViewProps {
  onOpenTaskModal: (task?: Task) => void;
}

export function CalendarView({ onOpenTaskModal }: CalendarViewProps) {
  const { filteredTasks } = useSentinel();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // Octobre (9 = octobre)

  const monthNames = [
    'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
    'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'
  ];

  const daysOfWeek = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const todayStr = getTodayDateString();

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* En-tête de navigation calendrier */}
      <div className="panel flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] border border-red bg-red/10 flex items-center justify-center text-red">
            <CalendarIcon className="w-5 h-5 text-red" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red shadow-[var(--glow-sm)]" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                {monthNames[currentMonth]} {currentYear}
              </h2>
            </div>
            <p className="text-xs text-white/45 mt-0.5">
              Visualisation chronologique des échéances et livrables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="btn btn-secondary btn-sm"
          >
            AUJOURD’HUI
          </button>
          <div className="flex items-center border border-[#242424] rounded-[6px] overflow-hidden bg-black">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-white/70 hover:text-white hover:bg-[#0D0D0D] transition"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4 text-red" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-white/70 hover:text-white hover:bg-[#0D0D0D] transition"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-4 h-4 text-red" />
            </button>
          </div>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="panel p-0 overflow-hidden border-[#242424]">
        {/* Noms des jours - En-tête rouge plein */}
        <div className="grid grid-cols-7 border-b border-[#242424] bg-red text-center py-2.5 text-micro font-bold uppercase tracking-wider text-white">
          {daysOfWeek.map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Jours du mois */}
        <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-[#242424] text-xs bg-black">
          {/* Cases vides pour le début */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-[#050505] p-2" />
          ))}

          {/* Jours réels */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const monthStr = String(currentMonth + 1).padStart(2, '0');
            const dayStr = String(dayNum).padStart(2, '0');
            const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
            const isToday = dateStr === todayStr;

            const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr);

            return (
              <div
                key={`day-${dayNum}`}
                className={`p-2 flex flex-col justify-between transition ${
                  isToday ? 'bg-red/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-[4px] text-xs font-mono font-bold ${
                    isToday ? 'bg-red text-white shadow-[var(--glow-sm)]' : 'text-white'
                  }`}>
                    {dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="badge font-mono text-[9px] py-0 px-1">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Tâches du jour */}
                <div className="space-y-1 overflow-y-auto max-h-[80px] my-1 pr-0.5">
                  {dayTasks.map(t => {
                    const isDone = t.status === 'done';
                    const isLate = isDateOverdue(t.dueDate, t.status);

                    return (
                      <div
                        key={t.id}
                        onClick={() => onOpenTaskModal(t)}
                        className={`px-1.5 py-0.5 rounded-[3px] text-micro font-bold uppercase tracking-wide truncate cursor-pointer transition border ${
                          isDone
                            ? 'bg-black border-white text-white'
                            : isLate
                            ? 'bg-red/20 border-red text-red'
                            : 'bg-[#0D0D0D] border-[#242424] text-white hover:border-red'
                        }`}
                        title={t.title}
                      >
                        {t.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
