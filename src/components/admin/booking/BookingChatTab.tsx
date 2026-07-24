"use client";

import { useState } from "react";
import { Send, MessageCircle, Mail, Paperclip } from "lucide-react";
import { textareaCls } from "@/components/admin/ui/Field";
import type { AdminBookingNote } from "@/types/admin";

interface Props {
  notes: AdminBookingNote[];
  onAddNote: (authorName: string, message: string) => Promise<void>;
  authorName: string;
}

export default function BookingChatTab({ notes, onAddNote, authorName }: Props) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const send = async () => {
    if (!message.trim()) return;
    setSaving(true);
    try {
      await onAddNote(authorName, message.trim());
      setMessage("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Internal Notes</h3>
        <div className="space-y-3 mb-4">
          {notes.length > 0 ? (
            notes.map((n, i) => (
              <div key={n.id ?? i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">{n.authorName || "Team"}</span>
                  <span className="text-[10px] text-slate-400">{n.createdDate ? new Date(n.createdDate).toLocaleString("en-IN") : ""}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.message}</p>
              </div>
            ))
          ) : (
            <p className="text-center py-6 text-sm text-slate-500">No internal notes yet.</p>
          )}
        </div>
        <div className="flex gap-2">
          <textarea className={`${textareaCls} flex-1`} rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add an internal note — not visible to the customer" />
          <button type="button" onClick={send} disabled={saving || !message.trim()} className="self-end inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-slate-400">
          <MessageCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-semibold">WhatsApp Chat</p>
          <p className="text-xs mt-1">Not connected — requires WhatsApp Business API integration.</p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-slate-400">
          <Mail className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-semibold">Email History</p>
          <p className="text-xs mt-1">Not connected — requires email provider integration.</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Paperclip className="w-4 h-4" /> Attachments</h3>
        <p className="text-xs text-slate-500">Shared files appear here once WhatsApp/Email are connected — for now, use the Documents tab to upload customer files.</p>
      </div>
    </div>
  );
}
