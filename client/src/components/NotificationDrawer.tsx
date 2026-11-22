import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { X, Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const { notifications, isOpen, setIsOpen, markAsRead, markAllAsRead } = useNotifications();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#11181c] border-l border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#162024]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-400" />
            <h3 id="drawer-title" className="font-semibold text-slate-100">Notifications</h3>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {notifications.filter(n => !n.is_read).length} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
                title="Mark all as read"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close notifications panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="text-sm">No notifications right now.</p>
              <p className="text-xs text-slate-600 mt-1">Status changes on requests and equipment will appear here.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  notif.is_read
                    ? 'bg-[#162024]/60 border-slate-800/80 text-slate-400'
                    : 'bg-[#1a262c] border-teal-500/40 text-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm font-semibold ${notif.is_read ? 'text-slate-300' : 'text-teal-300'}`}>
                    {notif.title}
                  </h4>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-1 shadow-[0_0_8px_rgba(45,212,191,0.8)]"></span>
                  )}
                </div>
                <p className="text-xs mt-1 text-slate-300 leading-relaxed">{notif.message}</p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">
                    {notif.event_type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
