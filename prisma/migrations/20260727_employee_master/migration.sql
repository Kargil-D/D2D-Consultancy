-- PM > Employees master. Aadhaar/bank account number columns hold AES-256-GCM ciphertext
-- (encrypted at the service layer, src/lib/crypto.ts); only the last-4-digit sidecar columns
-- are ever read for masked display.

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('Permanent', 'Contract', 'Intern');

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT NOT NULL DEFAULT '',
    "mobileNumber" TEXT NOT NULL DEFAULT '',
    "personalEmail" TEXT,
    "officialEmail" TEXT,
    "profilePhotoUrl" TEXT,
    "designation" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "branch" TEXT NOT NULL DEFAULT '',
    "reportingManagerId" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'Permanent',
    "joiningDate" TIMESTAMP(3),
    "confirmationDate" TIMESTAMP(3),
    "status" "Status" NOT NULL DEFAULT 'Active',
    "username" TEXT,
    "systemRole" TEXT NOT NULL DEFAULT '',
    "lastLogin" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "currentAddress" TEXT NOT NULL DEFAULT '',
    "permanentAddress" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "pinCode" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT 'India',
    "aadhaarNumberEnc" TEXT,
    "aadhaarLast4" TEXT,
    "panNumber" TEXT,
    "passportNumber" TEXT,
    "drivingLicenceNumber" TEXT,
    "accountHolderName" TEXT NOT NULL DEFAULT '',
    "bankName" TEXT NOT NULL DEFAULT '',
    "bankBranchName" TEXT NOT NULL DEFAULT '',
    "accountNumberEnc" TEXT,
    "accountLast4" TEXT,
    "ifscCode" TEXT NOT NULL DEFAULT '',
    "upiId" TEXT,
    "salaryPaymentMode" "PaymentMode" NOT NULL DEFAULT 'BankTransfer',
    "emergencyContactName" TEXT NOT NULL DEFAULT '',
    "emergencyRelationship" TEXT NOT NULL DEFAULT '',
    "emergencyMobile" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_audit_logs" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_seq_key" ON "employees"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "employees_username_key" ON "employees"("username");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_reportingManagerId_idx" ON "employees"("reportingManagerId");

-- CreateIndex
CREATE INDEX "employee_audit_logs_employeeId_idx" ON "employee_audit_logs"("employeeId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_audit_logs" ADD CONSTRAINT "employee_audit_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
