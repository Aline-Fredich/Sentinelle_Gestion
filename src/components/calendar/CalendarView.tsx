'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { useSentinel } from '@/lib/store';
import { Task } from '@/types/sentinel';
import { getTodayDateString, isDateOverdue } from '@/lib/dateUtils';

interface CalendarViewProps {
  onOpenTaskModal: (task?: Task) => void;
}

export function CalendarView({ onOpenTaskModal }: CalendarViewProps) {
  const { filteredTasks } = useSentinel();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // Octobre (0-indexé : 9 = octobre)

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

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

  // Calcul du premier jour et du nombre de jours dans le mois
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  // Ajustement lundi = 0
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const todayStr = getTodayDateString();

  return (
    <div className="space-y-4">
      {/* En-tête de navigation calendrier */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0066FF] dark:text-cyan-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <p className="text-xs text-slate-500">
              Visualisation chronologique des échéances et livrables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition"
          >
            Aujourd’hui
          </button>
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Noms des jours */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
          {daysOfWeek.map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Jours du mois */}
        <div className="grid grid-cols-7 auto-rows-[120px] divide-x divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
          {/* Cases vides pour le début */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-slate-50/30 dark:bg-slate-900/20 p-2" />
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
                  isToday ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    isToday ? 'bg-[#0066FF] text-white shadow-sm' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-xs font-bold text-slate-400">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Tâches du jour */}
                <div className="space-y-1 overflow-y-auto max-h-[80px] my-1">
                  {dayTasks.map(t => {
                    const isDone = t.status === 'done';
                    const isLate = isDateOverdue(t.dueDate, t.status);

                    return (
                      <div
                        key={t.id}
                        onClick={() => onOpenTaskModal(t)}
                        className={`px-1.5 py-1 rounded text-xs font-medium truncate cursor-pointer transition ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isLate
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300'
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
