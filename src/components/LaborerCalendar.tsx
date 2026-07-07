import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Check, 
  X, 
  Info,
  CalendarCheck,
  CalendarDays
} from "lucide-react";
import { Booking } from "../types";

interface LaborerCalendarProps {
  bookings: Booking[];
  language: "en" | "ta";
  userName: string;
}

export function LaborerCalendar({ bookings, language, userName }: LaborerCalendarProps) {
  // Filter bookings to only include labor bookings for this laborer (assuming name match or all labor bookings in demo)
  const laborBookings = useMemo(() => {
    return bookings.filter(b => b.type === "labor" && b.status !== "cancelled");
  }, [bookings]);

  // Persistent blocked dates for vacation/off-duty state
  const storageKey = `oorsevai_blocked_dates_${userName.replace(/\s+/g, "_")}`;
  const [blockedDates, setBlockedDates] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const saveBlockedDates = (dates: string[]) => {
    setBlockedDates(dates);
    try {
      localStorage.setItem(storageKey, JSON.stringify(dates));
    } catch (e) {
      console.error("Failed to save blocked dates:", e);
    }
  };

  // State for current displayed month and year
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // State for selected date details view
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Translation helpers
  const t = {
    en: {
      calendar_title: "My Work & Shift Calendar",
      subtitle: "Track your bookings, free days, and toggle off-duty dates",
      prev_month: "Prev Month",
      next_month: "Next Month",
      shifts: "Shifts",
      free_days: "Free Days",
      off_days: "Off Days",
      active_shift: "Active Shift Assigned",
      free_available: "Free & Available",
      blocked_off: "Off Duty (Unavailable)",
      toggle_instruction: "💡 Click on an empty date to toggle between Free Day and Off Duty.",
      employer: "Employer",
      location: "Location",
      wage: "Wage",
      status: "Status",
      duration: "Duration",
      close_details: "Close Details",
      no_shifts_this_month: "No shifts scheduled in this month",
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      months: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ]
    },
    ta: {
      calendar_title: "எனது பணி மற்றும் ஷிப்ட் காலண்டர்",
      subtitle: "உங்கள் முன்பதிவுகள், விடுமுறை நாட்களைக் கண்காணித்து நிர்வகிக்கவும்",
      prev_month: "முந்தைய மாதம்",
      next_month: "அடுத்த மாதம்",
      shifts: "ஷிப்டுகள்",
      free_days: "பணி இல்லா நாட்கள்",
      off_days: "விடுமுறை",
      active_shift: "பணி ஒதுக்கப்பட்டுள்ளது",
      free_available: "வேலைக்கு தயார்",
      blocked_off: "விடுப்பில் உள்ளார் (கிடைக்கவில்லை)",
      toggle_instruction: "💡 தேதியைத் தட்டி வேலைக்கானavailability ஐ மாற்றவும் (பணிக்குத் தயார் 🟢 / விடுப்பு ⚪).",
      employer: "முதலாளி",
      location: "இடம்",
      wage: "சம்பளம்",
      status: "நிலை",
      duration: "கால அளவு",
      close_details: "விவரங்களை மூடு",
      no_shifts_this_month: "இந்த மாதத்தில் ஷிப்டுகள் எதுவும் இல்லை",
      days: ["ஞா", "தி", "செ", "பு", "வி", "வெ", "ச"],
      months: [
        "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
        "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"
      ]
    }
  }[language];

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDateStr(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDateStr(null);
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      bookingsOnDay: Booking[];
      isBlocked: boolean;
    }> = [];

    // Fill previous month grey days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = prevMonthTotalDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`;
      
      const dayBookings = laborBookings.filter(b => dateStr >= b.startDate && dateStr <= b.endDate);
      const isBlocked = blockedDates.includes(dateStr);

      days.push({
        dateStr,
        dayNum: dNum,
        isCurrentMonth: false,
        bookingsOnDay: dayBookings,
        isBlocked
      });
    }

    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      
      const dayBookings = laborBookings.filter(b => dateStr >= b.startDate && dateStr <= b.endDate);
      const isBlocked = blockedDates.includes(dateStr);

      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: true,
        bookingsOnDay: dayBookings,
        isBlocked
      });
    }

    // Fill next month grey days to make full grid of 42 cells (6 rows)
    const totalCells = 42;
    const nextDaysCount = totalCells - days.length;
    for (let i = 1; i <= nextDaysCount; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      
      const dayBookings = laborBookings.filter(b => dateStr >= b.startDate && dateStr <= b.endDate);
      const isBlocked = blockedDates.includes(dateStr);

      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        bookingsOnDay: dayBookings,
        isBlocked
      });
    }

    return days;
  }, [currentYear, currentMonth, laborBookings, blockedDates]);

  // Selected date booking list
  const selectedDateBookings = useMemo(() => {
    if (!selectedDateStr) return [];
    return laborBookings.filter(b => selectedDateStr >= b.startDate && selectedDateStr <= b.endDate);
  }, [selectedDateStr, laborBookings]);

  // Handle day click
  const handleDayClick = (day: typeof calendarDays[0]) => {
    setSelectedDateStr(day.dateStr);

    // If day is from different month, navigate to that month
    const parts = day.dateStr.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    if (m !== currentMonth || y !== currentYear) {
      setCurrentDate(new Date(y, m, 1));
    }
  };

  // Toggle availability on empty date (no assigned shift)
  const toggleDateAvailability = (dateStr: string) => {
    // If there is an active booking, you cannot make it unavailable
    const hasBooking = laborBookings.some(b => dateStr >= b.startDate && dateStr <= b.endDate);
    if (hasBooking) return;

    if (blockedDates.includes(dateStr)) {
      saveBlockedDates(blockedDates.filter(d => d !== dateStr));
    } else {
      saveBlockedDates([...blockedDates, dateStr]);
    }
  };

  // Stats computation for the current month
  const currentMonthStats = useMemo(() => {
    const activeMonthDays = calendarDays.filter(d => d.isCurrentMonth);
    let shiftDaysCount = 0;
    let blockedDaysCount = 0;
    let freeDaysCount = 0;

    activeMonthDays.forEach(d => {
      if (d.bookingsOnDay.length > 0) {
        shiftDaysCount++;
      } else if (d.isBlocked) {
        blockedDaysCount++;
      } else {
        freeDaysCount++;
      }
    });

    return {
      shifts: shiftDaysCount,
      blocked: blockedDaysCount,
      free: freeDaysCount
    };
  }, [calendarDays]);

  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  return (
    <div id="laborer-calendar-container" className="bg-white rounded-3xl border border-[#E8E6E1] p-4 shadow-xs space-y-4">
      {/* Calendar Header */}
      <div className="flex justify-between items-center pb-2 border-b border-[#E8E6E1]">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-[#3E5C31]" />
          <div>
            <h3 className="font-black text-xs text-[#2D2D2A] uppercase tracking-wider">{t.calendar_title}</h3>
            <p className="text-[9px] text-[#8A867E] leading-tight">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex justify-between items-center bg-[#FAF7F2] p-2 rounded-2xl border border-[#E8E6E1]">
        <button 
          onClick={handlePrevMonth}
          className="p-1.5 rounded-xl hover:bg-white text-[#3E5C31] transition-all cursor-pointer"
          title={t.prev_month}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-extrabold text-xs text-[#2D2D2A]">
          {t.months[currentMonth]} {currentYear}
        </span>
        <button 
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl hover:bg-white text-[#3E5C31] transition-all cursor-pointer"
          title={t.next_month}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Statistics dashboard Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#3E5C31]/5 border border-[#3E5C31]/20 p-2 rounded-2xl">
          <span className="block text-lg font-black text-[#3E5C31]">{currentMonthStats.shifts}</span>
          <span className="text-[8px] font-bold uppercase tracking-wide text-[#8A867E]">{t.shifts}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200/50 p-2 rounded-2xl">
          <span className="block text-lg font-black text-emerald-700">{currentMonthStats.free}</span>
          <span className="text-[8px] font-bold uppercase tracking-wide text-[#8A867E]">{t.free_days}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-2 rounded-2xl">
          <span className="block text-lg font-black text-slate-500">{currentMonthStats.blocked}</span>
          <span className="text-[8px] font-bold uppercase tracking-wide text-[#8A867E]">{t.off_days}</span>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-[#8A867E] border-b border-dashed border-[#E8E6E1] pb-1.5">
        {t.days.map((day, idx) => (
          <span key={idx} className={idx === 0 || idx === 6 ? "text-amber-700/80" : ""}>
            {day}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const isToday = day.dateStr === todayStr;
          const isSelected = day.dateStr === selectedDateStr;
          const hasShifts = day.bookingsOnDay.length > 0;
          const isBlocked = day.isBlocked;

          // Determine day class names
          let dayClasses = "aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-between p-1 cursor-pointer transition-all relative border ";
          
          if (!day.isCurrentMonth) {
            dayClasses += "text-slate-300 dark:text-slate-700 border-transparent bg-transparent opacity-40 ";
          } else {
            dayClasses += "border-[#E8E6E1]/50 ";
          }

          if (isToday) {
            dayClasses += "ring-2 ring-amber-500 ring-offset-1 ";
          }

          if (isSelected) {
            dayClasses += "ring-2 ring-[#3E5C31] ring-offset-1 ";
          }

          // Visual coding for different states
          let stateColorClass = "bg-white text-[#2D2D2A] hover:bg-[#FAF7F2]";
          if (hasShifts) {
            stateColorClass = "bg-[#3E5C31] text-white hover:bg-[#3E5C31]/90 shadow-xs";
          } else if (isBlocked) {
            stateColorClass = "bg-slate-100 text-slate-400 line-through hover:bg-slate-200/80";
          } else if (day.isCurrentMonth) {
            stateColorClass = "bg-emerald-50/60 text-emerald-950 hover:bg-emerald-100/80";
          }

          return (
            <div
              key={index}
              onClick={() => handleDayClick(day)}
              className={`${dayClasses} ${stateColorClass}`}
            >
              {/* Day Number */}
              <span className="text-[11px] font-black">{day.dayNum}</span>

              {/* Day State Indicator dot */}
              <div className="flex space-x-0.5 justify-center mt-1">
                {hasShifts && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
                {!hasShifts && !isBlocked && day.isCurrentMonth && (
                  <span className="w-1.2 h-1.2 rounded-full bg-emerald-500" />
                )}
                {!hasShifts && isBlocked && day.isCurrentMonth && (
                  <span className="w-1.2 h-1.2 rounded-full bg-slate-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toggle availability Helper Info / Action */}
      <div className="text-[10px] text-[#8A867E] bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#E8E6E1] leading-relaxed flex items-start gap-1.5">
        <span className="text-xs">💡</span>
        <p>{t.toggle_instruction}</p>
      </div>

      {/* Expanded view for selected date */}
      <AnimatePresence mode="wait">
        {selectedDateStr && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-[#FAF7F2] border border-[#E8E6E1] rounded-2xl p-3 space-y-3.5 relative"
          >
            {/* Header / Date */}
            <div className="flex justify-between items-center pb-1.5 border-b border-[#E8E6E1]">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black text-[#2D2D2A]">
                  {selectedDateStr.split("-").reverse().join("/")}
                </span>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                  selectedDateBookings.length > 0 
                    ? "bg-[#3E5C31] text-white" 
                    : blockedDates.includes(selectedDateStr) 
                      ? "bg-slate-200 text-slate-600" 
                      : "bg-emerald-100 text-emerald-800"
                }`}>
                  {selectedDateBookings.length > 0 
                    ? t.active_shift 
                    : blockedDates.includes(selectedDateStr) 
                      ? t.blocked_off 
                      : t.free_available
                  }
                </span>
              </div>
              <button 
                onClick={() => setSelectedDateStr(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-[10px] uppercase hover:underline"
              >
                {t.close_details}
              </button>
            </div>

            {/* If no assigned bookings, provide block/unblock action */}
            {selectedDateBookings.length === 0 ? (
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-extrabold text-[#2D2D2A]">
                    {blockedDates.includes(selectedDateStr) ? t.blocked_off : t.free_available}
                  </p>
                  <p className="text-[9px] text-[#8A867E]">
                    {blockedDates.includes(selectedDateStr) 
                      ? "You are set to unavailable for work on this date." 
                      : "You are listed as open to take local bookings."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleDateAvailability(selectedDateStr)}
                  className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    blockedDates.includes(selectedDateStr)
                      ? "bg-[#3E5C31] hover:bg-[#3E5C31]/95 text-white border-[#3E5C31]"
                      : "bg-white hover:bg-slate-50 text-slate-600 border-[#E8E6E1]"
                  }`}
                >
                  {blockedDates.includes(selectedDateStr) ? "Make Available 🟢" : "Mark Off-Duty ⚪"}
                </button>
              </div>
            ) : (
              // Shift details
              <div className="space-y-3">
                {selectedDateBookings.map(b => (
                  <div key={b.id} className="bg-white p-3 rounded-xl border border-[#E8E6E1] space-y-2 text-xs shadow-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400">Shift ID: #{b.id}</span>
                        <h4 className="font-black text-xs text-[#2D2D2A]">{b.itemName}</h4>
                      </div>
                      <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black uppercase px-2 py-0.5 rounded">
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-[10px] text-[#8A867E] bg-[#FAF7F2] p-2 rounded-lg border border-[#E8E6E1]/60">
                      <p className="flex items-center gap-1">
                        <User className="h-3 w-3 text-[#3E5C31]" />
                        <strong>{t.employer}:</strong> {b.customerName}
                      </p>
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#3E5C31]" />
                        <strong>{t.location}:</strong> {b.location}
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[#3E5C31]" />
                        <strong>{t.duration}:</strong> {b.durationDays} {b.durationDays === 1 ? "Day" : "Days"} ({b.startDate})
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-[#E8E6E1]/50 text-xs">
                      <span className="font-black text-[#3E5C31] text-[11px]">{t.wage}: ₹{b.totalAmount}</span>
                      <span className="text-[9px] bg-[#3E5C31]/10 text-[#3E5C31] font-black uppercase px-2 py-0.5 rounded">
                        {b.paymentStatus === "paid" ? "💰 Paid" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
