-- Drops the "Hotels" permission module — the standalone /admin/hotels screen it pointed to
-- was removed in favor of the existing Hotel Master screen. No RolePermission rows exist yet.

DROP TABLE "role_permissions";
DROP TYPE "AdminModule";

CREATE TYPE "AdminModule" AS ENUM ('Dashboard', 'Destinations', 'Campaigns', 'Itineraries', 'TransferTypes', 'HotelMaster', 'CurrencyMaster', 'Employees', 'Roles', 'HeroSection', 'Reviews', 'EnquiryConfig', 'Leads', 'Quotations', 'Bookings');

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

CREATE UNIQUE INDEX "role_permissions_roleId_module_key" ON "role_permissions"("roleId", "module");

ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
