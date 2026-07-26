"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User, Briefcase, MapPin, ShieldCheck, Landmark, FileText, Wallet, Lock, History,
  Camera, Phone, BadgeCheck, KeyRound, UserRound, Link2, Unlink,
} from "lucide-react";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import StatusToggle, { StatusBadge } from "@/components/admin/ui/StatusToggle";
import { useToast } from "@/components/admin/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import MaskedSensitiveField from "@/components/admin/employee/MaskedSensitiveField";
import ComingSoonPanel from "@/components/admin/employee/ComingSoonPanel";
import { employeesApi, rolesApi, uploadImage } from "@/lib/adminApi";
import type { AdminEmployee, AdminEmployeeAuditLog, AdminEmployeeManagerOption, AdminRolePickerOption, EmploymentType, PaymentMode } from "@/types/admin";

interface Props {
  id?: string;
}

const emptyForm = (): Partial<AdminEmployee> => ({
  employeeCode: "",
  fullName: "",
  gender: "",
  mobileNumber: "",
  personalEmail: "",
  officialEmail: "",
  profilePhotoUrl: "",
  designation: "",
  department: "",
  branch: "",
  reportingManagerId: null,
  employmentType: "Permanent",
  status: "Active",
  username: "",
  mfaEnabled: false,
  currentAddress: "",
  permanentAddress: "",
  city: "",
  state: "",
  pinCode: "",
  country: "India",
  aadhaarNumberMasked: "",
  panNumber: "",
  passportNumber: "",
  drivingLicenceNumber: "",
  accountHolderName: "",
  bankName: "",
  bankBranchName: "",
  accountNumberMasked: "",
  ifscCode: "",
  upiId: "",
  salaryPaymentMode: "BankTransfer",
  emergencyContactName: "",
  emergencyRelationship: "",
  emergencyMobile: "",
});

const TABS = [
  { key: "personal", label: "Personal", icon: User },
  { key: "employment", label: "Employment & Login", icon: Briefcase },
  { key: "address", label: "Address", icon: MapPin },
  { key: "govId", label: "Government IDs", icon: ShieldCheck },
  { key: "bank", label: "Bank Details", icon: Landmark },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "payroll", label: "Payroll", icon: Wallet },
  { key: "permissions", label: "Permissions", icon: Lock },
  { key: "activity", label: "Activity Log", icon: History },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const EMPLOYMENT_TYPES: EmploymentType[] = ["Permanent", "Contract", "Intern"];
const PAYMENT_MODES: PaymentMode[] = ["Cash", "BankTransfer", "Card", "UPI", "Cheque", "Other"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export default function EmployeeForm({ id }: Props) {
  const router = useRouter();
  const { notify } = useToast();
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState<Partial<AdminEmployee>>(emptyForm());
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [tab, setTab] = useState<TabKey>("personal");
  const [managers, setManagers] = useState<AdminEmployeeManagerOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<AdminRolePickerOption[]>([]);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [assigningRole, setAssigningRole] = useState(false);
  const [auditLog, setAuditLog] = useState<AdminEmployeeAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Pending plaintext replacements for the two encrypted fields — undefined means "not
  // editing this field right now"; present (even "") means "send this value on save".
  const [pendingAadhaar, setPendingAadhaar] = useState<string | undefined>(undefined);
  const [pendingAccount, setPendingAccount] = useState<string | undefined>(undefined);

  useEffect(() => {
    employeesApi.picker(id).then((res) => {
      if (res.success) setManagers(res.data);
    });
    rolesApi.picker().then((res) => {
      if (res.success) setRoleOptions(res.data);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await employeesApi.get(id);
      if (res.success && res.data) {
        setForm(res.data);
      } else {
        notify(res.message || "Unable to load employee", "error");
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id || tab !== "activity") return;
    setAuditLoading(true);
    employeesApi.auditLog(id).then((res) => {
      if (res.success) setAuditLog(res.data);
      setAuditLoading(false);
    });
  }, [id, tab]);

  const onChange = (next: Partial<AdminEmployee>) => setForm((f) => ({ ...f, ...next }));

  const canSave = !!form.fullName?.trim();

  const handlePhoto = async (file: File) => {
    setUploadingPhoto(true);
    const res = await uploadImage(file);
    setUploadingPhoto(false);
    if (res.success) onChange({ profilePhotoUrl: res.data.url });
  };

  const linkAccount = async () => {
    if (!id || !linkEmail.trim()) return;
    setLinking(true);
    try {
      const res = await employeesApi.linkAccount(id, linkEmail.trim());
      if (!res.success) return notify(res.message || "Unable to link account", "error");
      if (res.data) setForm(res.data);
      setLinkEmail("");
      notify("Login account linked", "success");
    } finally {
      setLinking(false);
    }
  };

  const unlinkAccount = async () => {
    if (!id) return;
    const res = await employeesApi.unlinkAccount(id);
    if (!res.success) return notify(res.message || "Unable to unlink account", "error");
    if (res.data) setForm(res.data);
    notify("Login account unlinked", "success");
  };

  const assignRole = async (roleId: string) => {
    if (!id) return;
    setAssigningRole(true);
    try {
      const res = await employeesApi.assignRole(id, roleId);
      if (!res.success) return notify(res.message || "Unable to assign role", "error");
      if (res.data) setForm(res.data);
      notify("Role assigned", "success");
    } finally {
      setAssigningRole(false);
    }
  };

  const save = async () => {
    if (!canSave) return notify("Employee Code and Full Name are required", "error");
    const payload: Partial<AdminEmployee> = {
      ...form,
      ...(pendingAadhaar !== undefined && { aadhaarNumber: pendingAadhaar }),
      ...(pendingAccount !== undefined && { accountNumber: pendingAccount }),
    };

    setSaving(true);
    try {
      if (id) {
        const res = await employeesApi.update(id, payload);
        if (!res.success) return notify(res.message || "Unable to update employee", "error");
        notify("Employee updated", "success");
        if (res.data) setForm(res.data);
        setPendingAadhaar(undefined);
        setPendingAccount(undefined);
      } else {
        const res = await employeesApi.create(payload as Omit<AdminEmployee, "id">);
        if (!res.success) return notify(res.message || "Unable to create employee", "error");
        notify("Employee created", "success");
        router.push(`/admin/employees/${res.data.id}/edit`);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unexpected error", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!id) return onChange({ status: form.status === "Active" ? "Inactive" : "Active" });
    const res = await employeesApi.toggleStatus(id);
    if (res.success && res.data) setForm(res.data);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  const employeeIdLabel = form.seq ? `EMP-${String(form.seq).padStart(4, "0")}` : "Assigned after saving";

  // Viewing/editing your own linked record: Personal, Employment & Login (incl. Role/Link
  // Account), Permissions, and Activity Log are locked so you can't self-modify your own
  // employment data or role — Address/Government IDs/Bank Details/Documents/Payroll stay
  // editable as self-service HR data. Editing someone else's record is unaffected.
  const isSelf = !!form.userId && !!currentUser?.id && form.userId === currentUser.id;

  return (
    <div className="space-y-4">
      {/* Profile header */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-slate-100 flex-shrink-0 flex items-center justify-center group"
              >
                {form.profilePhotoUrl ? (
                  <Image src={form.profilePhotoUrl} alt={form.fullName || "Employee"} fill sizes="96px" className="object-cover" unoptimized />
                ) : (
                  <UserRound className="w-10 h-10 text-slate-300" />
                )}
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePhoto(f);
                  }}
                />
              </button>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-slate-900">{form.fullName || "New Employee"}</h1>
                <p className="text-sm text-slate-500">
                  {form.designation || "—"}
                  {form.department ? ` · ${form.department}` : ""}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <BadgeCheck className="w-3 h-3" /> {employeeIdLabel}
                  </span>
                  {form.employeeCode && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      {form.employeeCode}
                    </span>
                  )}
                  {form.employmentType && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {form.employmentType}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pb-1">
              <div className="flex items-center gap-2">
                <StatusToggle value={form.status ?? "Active"} onChange={toggleStatus} />
                <StatusBadge status={form.status ?? "Active"} />
              </div>
              <Link href="/admin/employees" className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100">
                Cancel
              </Link>
              <button
                type="button"
                onClick={save}
                disabled={!canSave || saving}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm ${
                  !canSave || saving ? "opacity-50 cursor-not-allowed hover:bg-blue-600" : ""
                }`}
              >
                {id ? "Save Changes" : "Create Employee"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="flex items-center overflow-x-auto px-4 py-3 gap-1 bg-slate-50/60 border-b border-slate-200">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {tab === "personal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isSelf && (
                <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  This is your own profile — Personal and Employment &amp; Login details are locked. Ask another Admin to change them.
                </div>
              )}
              <Field label="Employee Code" hint="Auto-generated on save">
                <input className={inputCls} value={form.employeeCode ?? ""} disabled placeholder="Assigned after saving" />
              </Field>
              <Field label="Full Name" required>
                <input className={inputCls} value={form.fullName ?? ""} onChange={(e) => onChange({ fullName: e.target.value })} disabled={isSelf} />
              </Field>
              <Field label="Date of Birth">
                <input type="date" className={inputCls} value={form.dateOfBirth ?? ""} onChange={(e) => onChange({ dateOfBirth: e.target.value || null })} disabled={isSelf} />
              </Field>
              <Field label="Gender">
                <select className={selectCls} value={form.gender ?? ""} onChange={(e) => onChange({ gender: e.target.value })} disabled={isSelf}>
                  <option value="">Select</option>
                  {GENDERS.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={form.mobileNumber ?? ""} onChange={(e) => onChange({ mobileNumber: e.target.value })} disabled={isSelf} />
              </Field>
              <div />
              <Field label="Personal Email">
                <input type="email" className={inputCls} value={form.personalEmail ?? ""} onChange={(e) => onChange({ personalEmail: e.target.value })} disabled={isSelf} />
              </Field>
              <Field label="Official Email">
                <input type="email" className={inputCls} value={form.officialEmail ?? ""} onChange={(e) => onChange({ officialEmail: e.target.value })} disabled={isSelf} />
              </Field>
            </div>
          )}

          {tab === "employment" && (
            <div className="space-y-6">
              {isSelf && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  This is your own profile — Employment and Login details, including your Role, are locked. Ask another Admin to change them.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Designation">
                  <input className={inputCls} value={form.designation ?? ""} onChange={(e) => onChange({ designation: e.target.value })} disabled={isSelf} />
                </Field>
                <Field label="Department">
                  <input className={inputCls} value={form.department ?? ""} onChange={(e) => onChange({ department: e.target.value })} disabled={isSelf} />
                </Field>
                <Field label="Branch">
                  <input className={inputCls} value={form.branch ?? ""} onChange={(e) => onChange({ branch: e.target.value })} disabled={isSelf} />
                </Field>
                <Field label="Reporting Manager">
                  <select
                    className={selectCls}
                    value={form.reportingManagerId ?? ""}
                    onChange={(e) => onChange({ reportingManagerId: e.target.value || null })}
                    disabled={isSelf}
                  >
                    <option value="">None</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                        {m.designation ? ` — ${m.designation}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Employment Type">
                  <select className={selectCls} value={form.employmentType ?? "Permanent"} onChange={(e) => onChange({ employmentType: e.target.value as EmploymentType })} disabled={isSelf}>
                    {EMPLOYMENT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </Field>
                <Field label="Joining Date">
                  <input type="date" className={inputCls} value={form.joiningDate ?? ""} onChange={(e) => onChange({ joiningDate: e.target.value || null })} disabled={isSelf} />
                </Field>
                <Field label="Confirmation Date">
                  <input type="date" className={inputCls} value={form.confirmationDate ?? ""} onChange={(e) => onChange({ confirmationDate: e.target.value || null })} disabled={isSelf} />
                </Field>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <KeyRound className="w-3.5 h-3.5" /> Login Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Field label="Username">
                    <input className={inputCls} value={form.username ?? ""} onChange={(e) => onChange({ username: e.target.value })} disabled={isSelf} />
                  </Field>
                  <Field label="MFA Enabled" hint="No MFA system exists in this app yet — reference only">
                    <select className={selectCls} value={form.mfaEnabled ? "yes" : "no"} onChange={(e) => onChange({ mfaEnabled: e.target.value === "yes" })} disabled={isSelf}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </Field>
                </div>

                {!id ? (
                  <p className="text-xs text-slate-500 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5">
                    Save the employee first to link a login account and assign a Role.
                  </p>
                ) : form.user ? (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{form.user.email}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Last login: {form.user.lastLogin ? new Date(form.user.lastLogin).toLocaleString() : "Never"}
                          {!form.user.isActive && <span className="text-rose-600 font-semibold"> · Account deactivated</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={unlinkAccount}
                        disabled={isSelf}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:hover:bg-transparent"
                      >
                        <Unlink className="w-3.5 h-3.5" /> Unlink
                      </button>
                    </div>
                    <div className="mt-3 max-w-xs">
                      <Field label="Role" hint={form.user.role.status === "Inactive" ? "This role is Inactive — login is currently blocked" : "Real access — grants the modules this role permits"}>
                        <select
                          className={selectCls}
                          value={form.user.role.id}
                          disabled={assigningRole || isSelf}
                          onChange={(e) => assignRole(e.target.value)}
                        >
                          {!roleOptions.some((r) => r.id === form.user!.role.id) && (
                            <option value={form.user.role.id}>{form.user.role.name}{form.user.role.status === "Inactive" ? " (Inactive)" : ""}</option>
                          )}
                          {roleOptions.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                        </select>
                      </Field>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-700 mb-1">No login account linked</div>
                    <p className="text-xs text-slate-500 mb-3">
                      Link this employee to an existing login account by email to assign a real, enforced Role. This doesn&apos;t create new accounts.
                    </p>
                    <div className="flex items-center gap-2 max-w-sm">
                      <input
                        type="email"
                        className={inputCls}
                        placeholder="user@d2dholidays.com"
                        value={linkEmail}
                        onChange={(e) => setLinkEmail(e.target.value)}
                        disabled={isSelf}
                      />
                      <button
                        type="button"
                        onClick={linkAccount}
                        disabled={isSelf || linking || !linkEmail.trim()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold disabled:opacity-50 flex-shrink-0"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "address" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Current Address">
                  <textarea className={`${inputCls} min-h-[80px]`} value={form.currentAddress ?? ""} onChange={(e) => onChange({ currentAddress: e.target.value })} />
                </Field>
                <Field label="Permanent Address">
                  <textarea className={`${inputCls} min-h-[80px]`} value={form.permanentAddress ?? ""} onChange={(e) => onChange({ permanentAddress: e.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="City">
                  <input className={inputCls} value={form.city ?? ""} onChange={(e) => onChange({ city: e.target.value })} />
                </Field>
                <Field label="State">
                  <input className={inputCls} value={form.state ?? ""} onChange={(e) => onChange({ state: e.target.value })} />
                </Field>
                <Field label="PIN Code">
                  <input className={inputCls} value={form.pinCode ?? ""} onChange={(e) => onChange({ pinCode: e.target.value })} />
                </Field>
                <Field label="Country">
                  <input className={inputCls} value={form.country ?? ""} onChange={(e) => onChange({ country: e.target.value })} />
                </Field>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Phone className="w-3.5 h-3.5" /> Emergency Contact
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Contact Name">
                    <input className={inputCls} value={form.emergencyContactName ?? ""} onChange={(e) => onChange({ emergencyContactName: e.target.value })} />
                  </Field>
                  <Field label="Relationship">
                    <input className={inputCls} value={form.emergencyRelationship ?? ""} onChange={(e) => onChange({ emergencyRelationship: e.target.value })} />
                  </Field>
                  <Field label="Mobile Number">
                    <input className={inputCls} value={form.emergencyMobile ?? ""} onChange={(e) => onChange({ emergencyMobile: e.target.value })} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {tab === "govId" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
              <Field label="Aadhaar Number" hint="Masked — only Admin can reveal, every reveal is logged">
                <MaskedSensitiveField
                  employeeId={id}
                  field="aadhaarNumber"
                  maskedValue={form.aadhaarNumberMasked ?? ""}
                  pendingValue={pendingAadhaar}
                  onPendingChange={setPendingAadhaar}
                  placeholder="12-digit Aadhaar number"
                />
              </Field>
              <Field label="PAN Number">
                <input className={inputCls} value={form.panNumber ?? ""} onChange={(e) => onChange({ panNumber: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" />
              </Field>
              <Field label="Passport Number" hint="Optional">
                <input className={inputCls} value={form.passportNumber ?? ""} onChange={(e) => onChange({ passportNumber: e.target.value })} />
              </Field>
              <Field label="Driving Licence Number" hint="Optional">
                <input className={inputCls} value={form.drivingLicenceNumber ?? ""} onChange={(e) => onChange({ drivingLicenceNumber: e.target.value })} />
              </Field>
            </div>
          )}

          {tab === "bank" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
              <Field label="Account Holder Name">
                <input className={inputCls} value={form.accountHolderName ?? ""} onChange={(e) => onChange({ accountHolderName: e.target.value })} />
              </Field>
              <Field label="Bank Name">
                <input className={inputCls} value={form.bankName ?? ""} onChange={(e) => onChange({ bankName: e.target.value })} />
              </Field>
              <Field label="Branch Name">
                <input className={inputCls} value={form.bankBranchName ?? ""} onChange={(e) => onChange({ bankBranchName: e.target.value })} />
              </Field>
              <Field label="IFSC Code">
                <input className={inputCls} value={form.ifscCode ?? ""} onChange={(e) => onChange({ ifscCode: e.target.value.toUpperCase() })} placeholder="HDFC0001234" />
              </Field>
              <Field label="Account Number" hint="Masked — only Admin can reveal, every reveal is logged">
                <MaskedSensitiveField
                  employeeId={id}
                  field="accountNumber"
                  maskedValue={form.accountNumberMasked ?? ""}
                  pendingValue={pendingAccount}
                  onPendingChange={setPendingAccount}
                  placeholder="Bank account number"
                />
              </Field>
              <Field label="UPI ID" hint="Optional">
                <input className={inputCls} value={form.upiId ?? ""} onChange={(e) => onChange({ upiId: e.target.value })} placeholder="name@bank" />
              </Field>
              <Field label="Salary Payment Mode">
                <select className={selectCls} value={form.salaryPaymentMode ?? "BankTransfer"} onChange={(e) => onChange({ salaryPaymentMode: e.target.value as PaymentMode })}>
                  {PAYMENT_MODES.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              </Field>
            </div>
          )}

          {tab === "documents" && (
            <ComingSoonPanel
              icon={FileText}
              title="Documents"
              description="Aadhaar/PAN/passport scans, resume, offer & appointment letters, certificates. Needs real file storage before uploads here can be permission-gated for download — today's uploader is a shared placeholder across the whole admin panel."
            />
          )}
          {tab === "payroll" && (
            <ComingSoonPanel icon={Wallet} title="Payroll" description="Basic salary, allowances, PF/ESI numbers, professional tax, TDS. Coming in a follow-up pass." />
          )}
          {tab === "permissions" && (
            <ComingSoonPanel
              icon={Lock}
              title="Permissions"
              description="Module access and branch access matrix, approval level. Coming in a follow-up pass once the access-control model is designed."
            />
          )}
          {tab === "activity" && (
            <div>
              {!id ? (
                <p className="text-sm text-slate-500 text-center py-10">Save the employee first to start recording activity.</p>
              ) : auditLoading ? (
                <p className="text-sm text-slate-500 text-center py-10">Loading…</p>
              ) : auditLog.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">No activity recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <span className="font-semibold text-slate-800">{entry.action.replace(/_/g, " ")}</span>
                        {entry.field && <span className="text-slate-500"> — {entry.field}</span>}
                        <div className="text-xs text-slate-400">by {entry.performedBy}</div>
                      </div>
                      <div className="text-xs text-slate-400">{new Date(entry.performedAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
