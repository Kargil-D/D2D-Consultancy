import { z } from "zod";

const nullableDate = z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional().nullable());
const nullableStr = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional().nullable());

export const EmployeeCreateSchema = z.object({
  // Auto-generated server-side from the row's own seq (D2D-1001, D2D-1002, …) — see employeeService.createEmployee. Accepted here but always ignored.
  employeeCode: z.string().optional(),
  fullName: z.string().trim().min(1, "Full Name is required"),
  dateOfBirth: nullableDate,
  gender: z.string().optional().default(""),
  mobileNumber: z.string().optional().default(""),
  personalEmail: nullableStr,
  officialEmail: nullableStr,
  profilePhotoUrl: nullableStr,

  designation: z.string().optional().default(""),
  department: z.string().optional().default(""),
  branch: z.string().optional().default(""),
  reportingManagerId: nullableStr,
  employmentType: z.enum(["Permanent", "Contract", "Intern"]).optional().default("Permanent"),
  joiningDate: nullableDate,
  confirmationDate: nullableDate,
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),

  username: nullableStr,

  currentAddress: z.string().optional().default(""),
  permanentAddress: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  pinCode: z.string().optional().default(""),
  country: z.string().optional().default("India"),

  // Raw plaintext, present only when the caller is setting/replacing the value —
  // encrypted at the service layer, never persisted as-is.
  aadhaarNumber: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().regex(/^\d{12}$/, "Aadhaar number must be 12 digits").optional(),
  ),
  panNumber: nullableStr,
  passportNumber: nullableStr,
  drivingLicenceNumber: nullableStr,

  accountHolderName: z.string().optional().default(""),
  bankName: z.string().optional().default(""),
  bankBranchName: z.string().optional().default(""),
  accountNumber: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().regex(/^\d{6,20}$/, "Account number must be 6-20 digits").optional(),
  ),
  ifscCode: z.string().optional().default(""),
  upiId: nullableStr,
  salaryPaymentMode: z.enum(["Cash", "BankTransfer", "Card", "UPI", "Cheque", "Other"]).optional().default("BankTransfer"),

  emergencyContactName: z.string().optional().default(""),
  emergencyRelationship: z.string().optional().default(""),
  emergencyMobile: z.string().optional().default(""),
});

export const EmployeeUpdateSchema = EmployeeCreateSchema.partial();

export const EmployeeLinkAccountSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export const EmployeeAssignRoleSchema = z.object({
  roleId: z.string().min(1),
});

// Self-service ("My Profile") — "" clears an optional field here (unlike the Admin schema above,
// where "" means "leave unchanged"), since the employee is editing their own current values.
const clearableStr = (schema: z.ZodString) => z.preprocess((v) => (v === "" ? null : v), schema.nullable().optional());
const text = (max: number) => z.string().trim().max(max).optional();
const phone = z.string().trim().regex(/^[+\d\s-]{0,20}$/, "Enter a valid phone number").optional();

/** The only fields an employee may change on their own record. `.strict()` rejects anything else
 * (designation, role, salary mode, status, …) outright rather than silently dropping it. */
export const EmployeeSelfUpdateSchema = z
  .object({
    // Contact & photo
    dateOfBirth: z.preprocess(
      (v) => (v === "" ? null : v),
      z.coerce.date().max(new Date(), "Date of birth can't be in the future").nullable().optional(),
    ),
    gender: z.enum(["", "Male", "Female", "Other", "Prefer not to say"]).optional(),
    mobileNumber: phone,
    personalEmail: clearableStr(z.string().trim().email("Enter a valid personal email")),
    profilePhotoUrl: clearableStr(z.string().url().startsWith("https://", "Invalid photo URL")),

    // Address
    currentAddress: text(500),
    permanentAddress: text(500),
    city: text(100),
    state: text(100),
    pinCode: z.string().trim().regex(/^[A-Za-z0-9\s-]{0,10}$/, "Enter a valid PIN code").optional(),
    country: text(100),

    // Emergency contact
    emergencyContactName: text(100),
    emergencyRelationship: text(50),
    emergencyMobile: phone,

    // Government IDs — Aadhaar/account number are write-only: sent only when replacing the value
    // ("" = keep the current one), encrypted by the service, never echoed back.
    aadhaarNumber: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().regex(/^\d{12}$/, "Aadhaar number must be 12 digits").optional(),
    ),
    panNumber: clearableStr(z.string().trim().toUpperCase().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Enter a valid PAN (e.g. ABCDE1234F)")),
    passportNumber: clearableStr(z.string().trim().toUpperCase().max(20)),
    drivingLicenceNumber: clearableStr(z.string().trim().toUpperCase().max(20)),

    // Bank details (salary payment mode stays Admin-only)
    accountHolderName: text(100),
    bankName: text(100),
    bankBranchName: text(100),
    accountNumber: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().regex(/^\d{6,20}$/, "Account number must be 6-20 digits").optional(),
    ),
    ifscCode: z.string().trim().toUpperCase().regex(/^$|^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC (e.g. HDFC0001234)").optional(),
    upiId: clearableStr(z.string().trim().regex(/^[\w.-]{2,256}@[A-Za-z]{2,64}$/, "Enter a valid UPI ID (e.g. name@bank)")),
  })
  .strict();

export type EmployeeCreate = z.infer<typeof EmployeeCreateSchema>;
export type EmployeeUpdate = z.infer<typeof EmployeeUpdateSchema>;
export type EmployeeSelfUpdate = z.infer<typeof EmployeeSelfUpdateSchema>;
