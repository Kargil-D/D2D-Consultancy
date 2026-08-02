-- Employee self-registration invite links — Admin never sets/sees a password, the
-- employee sets their own via a one-time emailed link.

CREATE TABLE "employee_invites" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employee_invites_tokenHash_key" ON "employee_invites"("tokenHash");
CREATE INDEX "employee_invites_employeeId_idx" ON "employee_invites"("employeeId");

ALTER TABLE "employee_invites" ADD CONSTRAINT "employee_invites_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
