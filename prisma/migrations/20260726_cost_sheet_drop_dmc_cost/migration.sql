-- Drops DMC Cost from the Cost Sheet. Supplier Invoice line amounts now use Booked Cost
-- instead (see /api/admin/bookings/[id]/invoice), and Profit is recomputed as
-- Selling Price - Booked Cost.

ALTER TABLE "booking_cost_sheet_entries"
  DROP COLUMN "dmcCost";
