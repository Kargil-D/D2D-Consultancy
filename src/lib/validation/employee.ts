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

export type EmployeeCreate = z.infer<typeof EmployeeCreateSchema>;
export type EmployeeUpdate = z.infer<typeof EmployeeUpdateSchema>;
