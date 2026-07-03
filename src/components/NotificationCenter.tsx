import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Trash2, Bell, Clock, Truck, ShieldAlert, X, Eye } from "lucide-react";
import { AppNotification } from "../types";

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onClose: () => void;
  onNotificationClick: (bookingId: string) => void;
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onClose,
  onNotificationClick
}: NotificationCenterProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute top-16 right-4 left-4 md:right-auto md:left-auto md:w-80 bg-white rounded-2xl border border-[#E8E6E1] shadow-xl z-50 overflow-hidden flex flex-col max-h-[460px]"
    >
      {/* Header */}
      <div className="bg-[#3E5C31] text-white px-4 py-3.5 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <Bell className="h-4 w-4" />
          <h3 className="font-black text-xs uppercase tracking-wider">Alert Center</h3>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/15 rounded-full transition-colors text-white/90"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Quick Actions Bar */}
      {notifications.length > 0 && (
        <div className="bg-slate-50 border-b border-[#E8E6E1] px-3 py-2 flex justify-between items-center text-[10px] text-[#8A867E] shrink-0">
          <button
            onClick={onMarkAllAsRead}
            className="hover:text-[#3E5C31] font-bold flex items-center space-x-1 cursor-pointer"
          >
            <Check className="h-3 w-3" />
            <span>Mark all read</span>
          </button>
          <button
            onClick={onClearAll}
            className="hover:text-rose-600 font-bold flex items-center space-x-1 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[350px]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <div className="w-10 h-10 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto">
              <Bell className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-500">No Notifications Yet</p>
            <p className="text-[10px] text-slate-400">Trigger status updates in Owner or Labor Hub to test alert flows.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onNotificationClick(n.bookingId)}
              className={`p-3.5 transition-colors cursor-pointer flex gap-3 items-start relative ${
                !n.isRead ? "bg-amber-50/40 hover:bg-amber-50/75" : "hover:bg-slate-50"
              }`}
            >
              {/* Unread marker bar */}
              {!n.isRead && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#3E5C31]" />
              )}

              {/* Icon match */}
              <div className="shrink-0 mt-0.5">
                {n.type === "equipment_on_the_way" ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Truck className="h-4 w-4" />
                  </div>
                ) : n.type === "labor_shift_start" ? (
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex justify-between items-start gap-1">
                  <h4 className="font-extrabold text-[11px] text-[#2D2D2A] leading-tight pr-1">
                    {n.title}
                  </h4>
                  <span className="text-[8px] text-[#8A867E] whitespace-nowrap font-medium">
                    {n.timestamp}
                  </span>
                </div>
                <p className="text-[10px] text-[#5C5952] leading-relaxed">
                  {n.message}
                </p>

                {/* Subtitle action helper */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[9px] text-[#3E5C31] font-bold hover:underline flex items-center gap-0.5">
                    <Eye className="h-3 w-3" /> View Booking ({n.bookingId})
                  </span>
                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(n.id);
                      }}
                      className="text-[9px] text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded hover:bg-slate-100"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer info helper */}
      <div className="bg-[#FAF7F2] px-4 py-2 text-center text-[9px] text-[#8A867E] font-medium border-t border-[#E8E6E1] shrink-0">
        💡 Alerts simulate SMS & Push updates sent to Coimbatore farmers.
      </div>
    </motion.div>
  );
}
