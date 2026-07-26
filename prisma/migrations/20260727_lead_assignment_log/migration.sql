-- Lead assignment history — powers the Lead Assignment Board's live feed, round-robin
-- pointer, and "reassigned today" count. Not a relation-backed audit of every field, just
-- the who/when of each assign/reassign event (mirrors employee_audit_logs' pattern).

CREATE TYPE "LeadAssignmentMethod" AS ENUM ('Manual', 'Reassign', 'BulkReassign', 'RoundRobin');

CREATE TABLE "lead_assignment_logs" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "fromUserName" TEXT,
    "toUserId" TEXT NOT NULL,
    "toUserName" TEXT NOT NULL,
    "method" "LeadAssignmentMethod" NOT NULL DEFAULT 'Manual',
    "performedBy" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_assignment_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_assignment_logs_leadId_idx" ON "lead_assignment_logs"("leadId");
CREATE INDEX "lead_assignment_logs_toUserId_idx" ON "lead_assignment_logs"("toUserId");
CREATE INDEX "lead_assignment_logs_createdDate_idx" ON "lead_assignment_logs"("createdDate");

ALTER TABLE "lead_assignment_logs" ADD CONSTRAINT "lead_assignment_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
