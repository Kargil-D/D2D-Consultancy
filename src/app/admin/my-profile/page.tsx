"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import Breadcrumb from "@/components/admin/ui/Breadcrumb";
import DateInput from "@/components/admin/ui/DateInput";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { Field, inputCls, selectCls } from "@/components/admin/ui/Field";
import { useToast } from "@/components/admin/ui/Toast";
import { employeesApi } from "@/lib/adminApi";
import type { AdminEmployee, AdminEmployeeSelfUpdate } from "@/types/admin";

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

/** The editable slice of the employee's own record, in form-friendly shape (dates as yyyy-mm-dd). */
function toForm(e: AdminEmployee): AdminEmployeeSelfUpdate {
  return {
    dateOfBirth: e.dateOfBirth ? e.dateOfBirth.slice(0, 10) : "",
    gender: e.gender ?? "",
    mobileNumber: e.mobileNumber ?? "",
    personalEmail: e.personalEmail ?? "",
    profilePhotoUrl: e.profilePhotoUrl ?? "",
    currentAddress: e.currentAddress ?? "",
    permanentAddress: e.permanentAddress ?? "",
    city: e.city ?? "",
    state: e.state ?? "",
    pinCode: e.pinCode ?? "",
    country: e.country ?? "",
    emergencyContactName: e.emergencyContactName ?? "",
    emergencyRelationship: e.emergencyRelationship ?? "",
    emergencyMobile: e.emergencyMobile ?? "",
    panNumber: e.panNumber ?? "",
    passportNumber: e.passportNumber ?? "",
    drivingLicenceNumber: e.drivingLicenceNumber ?? "",
    accountHolderName: e.accountHolderName ?? "",
    bankName: e.bankName ?? "",
    bankBranchName: e.bankBranchName ?? "",
    ifscCode: e.ifscCode ?? "",
    upiId: e.upiId ?? "",
  };
}

const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white border border-slate-200 p-6">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ReadOnly({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm text-slate-900 mt-1 break-words">{value || "—"}</div>
    </div>
  );
}

export default function MyProfilePage() {
  const { notify } = useToast();
  const [employee, setEmployee] = useState<AdminEmployee | null>(null);
  const [form, setForm] = useState<AdminEmployeeSelfUpdate>({});
  const [pendingAadhaar, setPendingAadhaar] = useState("");
  const [pendingAccount, setPendingAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await employeesApi.me();
        if (res.success && res.data) {
          setEmployee(res.data);
          setForm(toForm(res.data));
        } else {
          setError(res.message || "Unable to load your profile");
        }
      } catch {
        setError("Unable to load your profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (patch: AdminEmployeeSelfUpdate) => setForm((f) => ({ ...f, ...patch }));

  // Only the fields actually edited are sent — keeps the Activity Log accurate (it records every
  // field in the request) and means an old, badly formatted value elsewhere can't block a save.
  const changes = useMemo(() => {
    if (!employee) return {};
    const initial = toForm(employee) as Record<string, unknown>;
    const diff: AdminEmployeeSelfUpdate = Object.fromEntries(
      Object.entries(form).filter(([key, value]) => value !== initial[key]),
    );
    if (pendingAadhaar) diff.aadhaarNumber = pendingAadhaar;
    if (pendingAccount) diff.accountNumber = pendingAccount;
    return diff;
  }, [employee, form, pendingAadhaar, pendingAccount]);
  const dirty = Object.keys(changes).length > 0;

  const save = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    try {
      const res = await employeesApi.updateMe(changes);
      if (!res.success || !res.data) {
        notify(res.message || "Unable to save your profile", "error");
        return;
      }
      setEmployee(res.data);
      setForm(toForm(res.data));
      setPendingAadhaar("");
      setPendingAccount("");
      notify("Profile updated", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Unable to save your profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="My Profile">
      <Breadcrumb items={[{ label: "My Profile" }]} />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Keep your contact, address, emergency, ID and bank details up to date.</p>
        </div>
        {employee && (
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-slate-500 text-center py-12">Loading…</p>}

      {error && !loading && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3">{error}</div>
      )}

      {employee && (
        <div className="space-y-4">
          <Section title="Employment" hint="Managed by Admin — contact Admin if any of these are wrong.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ReadOnly label="Full Name" value={employee.fullName} />
              <ReadOnly label="Employee Code" value={employee.employeeCode} />
              <ReadOnly label="Designation" value={employee.designation} />
              <ReadOnly label="Department" value={employee.department} />
              <ReadOnly label="Branch" value={employee.branch} />
              <ReadOnly label="Reporting Manager" value={employee.reportingManager?.fullName} />
              <ReadOnly label="Employment Type" value={employee.employmentType} />
              <ReadOnly label="Joining Date" value={formatDate(employee.joiningDate)} />
              <ReadOnly label="Official Email" value={employee.officialEmail} />
              <ReadOnly label="Role" value={employee.user?.role?.name} />
            </div>
          </Section>

          <Section title="Contact & Photo">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
              <ImageUpload
                value={form.profilePhotoUrl ?? ""}
                onChange={(url) => set({ profilePhotoUrl: url })}
                label="Profile Photo"
                aspect="square"
                size="sm"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Mobile Number">
                  <input className={inputCls} value={form.mobileNumber ?? ""} onChange={(e) => set({ mobileNumber: e.target.value })} />
                </Field>
                <Field label="Personal Email">
                  <input type="email" className={inputCls} value={form.personalEmail ?? ""} onChange={(e) => set({ personalEmail: e.target.value })} />
                </Field>
                <Field label="Date of Birth">
                  <DateInput value={form.dateOfBirth} onChange={(iso) => set({ dateOfBirth: iso })} max={new Date().toISOString().slice(0, 10)} />
                </Field>
                <Field label="Gender">
                  <select className={selectCls} value={form.gender ?? ""} onChange={(e) => set({ gender: e.target.value })}>
                    <option value="">Select</option>
                    {GENDERS.map((g) => (<option key={g} value={g}>{g}</option>))}
                  </select>
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Address">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Current Address">
                  <textarea className={`${inputCls} min-h-[80px]`} value={form.currentAddress ?? ""} onChange={(e) => set({ currentAddress: e.target.value })} />
                </Field>
                <Field label="Permanent Address">
                  <textarea className={`${inputCls} min-h-[80px]`} value={form.permanentAddress ?? ""} onChange={(e) => set({ permanentAddress: e.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="City">
                  <input className={inputCls} value={form.city ?? ""} onChange={(e) => set({ city: e.target.value })} />
                </Field>
                <Field label="State">
                  <input className={inputCls} value={form.state ?? ""} onChange={(e) => set({ state: e.target.value })} />
                </Field>
                <Field label="PIN Code">
                  <input className={inputCls} value={form.pinCode ?? ""} onChange={(e) => set({ pinCode: e.target.value })} />
                </Field>
                <Field label="Country">
                  <input className={inputCls} value={form.country ?? ""} onChange={(e) => set({ country: e.target.value })} />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Emergency Contact">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Contact Name">
                <input className={inputCls} value={form.emergencyContactName ?? ""} onChange={(e) => set({ emergencyContactName: e.target.value })} />
              </Field>
              <Field label="Relationship">
                <input className={inputCls} value={form.emergencyRelationship ?? ""} onChange={(e) => set({ emergencyRelationship: e.target.value })} />
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={form.emergencyMobile ?? ""} onChange={(e) => set({ emergencyMobile: e.target.value })} />
              </Field>
            </div>
          </Section>

          <Section title="Government IDs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Aadhaar Number"
                hint={employee.aadhaarNumberMasked ? `Current: ${employee.aadhaarNumberMasked} — enter a new number only to change it` : "Not added yet"}
              >
                <input
                  className={inputCls}
                  inputMode="numeric"
                  autoComplete="off"
                  value={pendingAadhaar}
                  onChange={(e) => setPendingAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="12-digit Aadhaar number"
                />
              </Field>
              <Field label="PAN Number">
                <input className={inputCls} value={form.panNumber ?? ""} onChange={(e) => set({ panNumber: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" />
              </Field>
              <Field label="Passport Number" hint="Optional">
                <input className={inputCls} value={form.passportNumber ?? ""} onChange={(e) => set({ passportNumber: e.target.value.toUpperCase() })} />
              </Field>
              <Field label="Driving Licence Number" hint="Optional">
                <input className={inputCls} value={form.drivingLicenceNumber ?? ""} onChange={(e) => set({ drivingLicenceNumber: e.target.value.toUpperCase() })} />
              </Field>
            </div>
          </Section>

          <Section title="Bank Details" hint="Your salary is paid into this account. Every change is recorded in your activity log.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Account Holder Name">
                <input className={inputCls} value={form.accountHolderName ?? ""} onChange={(e) => set({ accountHolderName: e.target.value })} />
              </Field>
              <Field label="Bank Name">
                <input className={inputCls} value={form.bankName ?? ""} onChange={(e) => set({ bankName: e.target.value })} />
              </Field>
              <Field label="Branch Name">
                <input className={inputCls} value={form.bankBranchName ?? ""} onChange={(e) => set({ bankBranchName: e.target.value })} />
              </Field>
              <Field label="IFSC Code">
                <input className={inputCls} value={form.ifscCode ?? ""} onChange={(e) => set({ ifscCode: e.target.value.toUpperCase() })} placeholder="HDFC0001234" />
              </Field>
              <Field
                label="Account Number"
                hint={employee.accountNumberMasked ? `Current: ${employee.accountNumberMasked} — enter a new number only to change it` : "Not added yet"}
              >
                <input
                  className={inputCls}
                  inputMode="numeric"
                  autoComplete="off"
                  value={pendingAccount}
                  onChange={(e) => setPendingAccount(e.target.value.replace(/\D/g, "").slice(0, 20))}
                  placeholder="Bank account number"
                />
              </Field>
              <Field label="UPI ID" hint="Optional">
                <input className={inputCls} value={form.upiId ?? ""} onChange={(e) => set({ upiId: e.target.value })} placeholder="name@bank" />
              </Field>
              <ReadOnly label="Salary Payment Mode" value={employee.salaryPaymentMode === "BankTransfer" ? "Bank Transfer" : employee.salaryPaymentMode} />
            </div>
          </Section>
        </div>
      )}
    </AdminShell>
  );
}
