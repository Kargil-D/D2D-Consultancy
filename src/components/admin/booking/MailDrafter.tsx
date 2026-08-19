"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Link as LinkIcon, Eraser, Smile, Save, Send,
} from "lucide-react";
import { Field, inputCls } from "@/components/admin/ui/Field";
import TagInput from "@/components/admin/ui/TagInput";
import ConfirmModal from "@/components/admin/ui/ConfirmModal";
import { useToast } from "@/components/admin/ui/Toast";
import { bookingsApi } from "@/lib/adminApi";
import type { EmailRecipientType } from "@/types/admin";
import { EMAIL_EMOJIS } from "@/components/admin/booking/emojiList";

interface MailDrafterProps {
  bookingId: string;
  recipientType: EmailRecipientType;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const csvToTags = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

const badgeCls: Record<EmailRecipientType, string> = {
  Customer: "bg-blue-100 text-blue-700",
  Supplier: "bg-amber-100 text-amber-700",
};

export default function MailDrafter({ bookingId, recipientType }: MailDrafterProps) {
  const router = useRouter();
  const { notify } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const [to, setTo] = useState("");
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState("");

  const emojiRef = useRef<HTMLDivElement>(null);
  const backTo = `/admin/bookings/${bookingId}`;

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    immediatelyRender: false,
    editorProps: { attributes: { class: "prose prose-sm max-w-none focus:outline-none min-h-[280px] px-4 py-3" } },
    onUpdate: () => setDirty(true),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await bookingsApi.getEmailDraft(bookingId, recipientType);
      if (cancelled) return;
      if (res.success && res.data) {
        setTo(res.data.toEmail ?? "");
        setCc(csvToTags(res.data.cc ?? ""));
        setBcc(csvToTags(res.data.bcc ?? ""));
        setSubject(res.data.subject ?? "");
        editor?.commands.setContent(res.data.bodyHtml ?? "");
      } else {
        notify(res.message || "Unable to load email draft", "error");
      }
      setDirty(false);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, recipientType, editor]);

  useEffect(() => {
    if (!showEmoji) return;
    const onClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showEmoji]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const buildPayload = () => ({
    recipientType,
    toEmail: to.trim(),
    cc: cc.join(","),
    bcc: bcc.join(","),
    subject: subject.trim(),
    bodyHtml: editor?.getHTML() ?? "",
  });

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const res = await bookingsApi.saveEmailDraft(bookingId, buildPayload());
      if (!res.success) {
        notify(res.message || "Unable to save draft", "error");
        return;
      }
      setDirty(false);
      notify("Draft saved", "success");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, to, cc, bcc, subject, editor]);

  const sendMail = async () => {
    const payload = buildPayload();
    if (!EMAIL_RE.test(payload.toEmail)) return notify("Enter a valid recipient email address", "error");
    if (!payload.subject) return notify("Subject is required", "error");
    if (!editor || editor.getText().trim().length === 0) return notify("Message body cannot be empty", "error");

    setSending(true);
    try {
      const res = await bookingsApi.sendMail(bookingId, payload);
      if (!res.success) {
        notify(res.message || "Unable to send email. Please try again.", "error");
        return;
      }
      setDirty(false);
      notify("Email sent successfully.", "success");
      router.push(backTo);
    } catch {
      notify("Unable to send email. Please try again.", "error");
    } finally {
      setSending(false);
    }
  };

  const leave = () => {
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    router.push(backTo);
  };

  const busy = saving || sending;
  const toolbarBtn = (active: boolean) =>
    `p-2 rounded-lg text-slate-600 hover:bg-slate-100 ${active ? "bg-slate-200 text-slate-900" : ""}`;

  if (loading || !editor) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={leave} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-slate-900">Draft Email</h1>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badgeCls[recipientType]}`}>{recipientType}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="p-5 space-y-4 border-b border-slate-100">
          <Field label="To">
            <input
              type="email"
              className={inputCls}
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setDirty(true);
              }}
              placeholder="recipient@example.com"
            />
          </Field>
          <Field label="CC">
            <TagInput
              value={cc}
              onChange={(next) => {
                setCc(next);
                setDirty(true);
              }}
              placeholder="Add CC and press Enter"
            />
          </Field>
          <Field label="BCC">
            <TagInput
              value={bcc}
              onChange={(next) => {
                setBcc(next);
                setDirty(true);
              }}
              placeholder="Add BCC and press Enter"
            />
          </Field>
          <Field label="Subject">
            <input
              className={inputCls}
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setDirty(true);
              }}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50/60">
          <button type="button" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={toolbarBtn(editor.isActive("bold"))}>
            <Bold className="w-4 h-4" />
          </button>
          <button type="button" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={toolbarBtn(editor.isActive("italic"))}>
            <Italic className="w-4 h-4" />
          </button>
          <button type="button" title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} className={toolbarBtn(editor.isActive("underline"))}>
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-slate-200 mx-1" />
          <button type="button" title="Bulleted list" onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolbarBtn(editor.isActive("bulletList"))}>
            <List className="w-4 h-4" />
          </button>
          <button type="button" title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toolbarBtn(editor.isActive("orderedList"))}>
            <ListOrdered className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-slate-200 mx-1" />
          <button
            type="button"
            title="Link"
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              const url = window.prompt("Link URL");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            className={toolbarBtn(editor.isActive("link"))}
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <div className="relative" ref={emojiRef}>
            <button type="button" title="Emoji" onClick={() => setShowEmoji((v) => !v)} className={toolbarBtn(showEmoji)}>
              <Smile className="w-4 h-4" />
            </button>
            {showEmoji && (
              <div className="absolute left-0 z-20 mt-1 w-64 p-2 rounded-xl bg-white shadow-2xl border border-slate-200 grid grid-cols-8 gap-1">
                {EMAIL_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().insertContent(e).run();
                      setShowEmoji(false);
                    }}
                    className="text-lg rounded hover:bg-slate-100 p-1"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="w-px h-5 bg-slate-200 mx-1" />
          <button type="button" title="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className={toolbarBtn(false)}>
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={leave} disabled={busy} className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 disabled:opacity-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={saveDraft}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {saving ? <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Draft"}
        </button>
        <button
          type="button"
          onClick={sendMail}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50"
        >
          {sending ? <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Sending…" : "Send Mail"}
        </button>
      </div>

      <ConfirmModal
        open={confirmDiscard}
        title="Discard draft?"
        message="You have unsaved changes to this email. Leaving now will discard them."
        confirmText="Discard"
        tone="danger"
        onConfirm={() => {
          setConfirmDiscard(false);
          router.push(backTo);
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  );
}
