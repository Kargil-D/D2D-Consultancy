-- Roles master (Role Name/Description/Status) + a per-module View/Add/Edit/Delete
-- permission matrix, and an optional Employee -> User link so assigning a Role on the
-- Employee screen can write through to the real login account's roleId.

-- CreateEnum
CREATE TYPE "AdminModule" AS ENUM ('Dashboard', 'Customers', 'Enquiries', 'Packages', 'Bookings', 'Payments', 'Employees', 'Reports', 'WebsiteCMS', 'Settings');

-- AlterTable
ALTER TABLE "roles"
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "status" "Status" NOT NULL DEFAULT 'Active';

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "module" "AdminModule" NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canAdd" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_module_key" ON "role_permissions"("roleId", "module");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable (Employee login info: drop the free-text role label, add a real User link)
ALTER TABLE "employees"
  DROP COLUMN "systemRole",
  ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
