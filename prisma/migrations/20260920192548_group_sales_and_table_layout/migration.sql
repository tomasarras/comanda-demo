-- AlterTable: Order gains the FK it will own once Sale<->Order flips to 1:N
ALTER TABLE "Order" ADD COLUMN     "saleId" TEXT;

-- Backfill: carry over existing Sale -> Order links before dropping the old column
UPDATE "Order" o SET "saleId" = s.id FROM "Sale" s WHERE s."orderId" = o.id;

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_orderId_fkey";

-- DropIndex
DROP INDEX "Sale_orderId_key";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "orderId";

-- AlterTable: table layout for the visual floor plan
ALTER TABLE "RestaurantTable" ADD COLUMN     "posX" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN     "posY" DOUBLE PRECISION NOT NULL DEFAULT 50;

-- Spread out pre-existing tables on the same grid app/api/tables POST uses for
-- new ones — otherwise every existing table lands on the exact same 50/50
-- spot and stacks invisibly on the floor plan.
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY number) - 1 AS rn FROM "RestaurantTable"
)
UPDATE "RestaurantTable" t
SET "posX" = 20 + (ranked.rn % 5) * 15,
    "posY" = 20 + (ranked.rn / 5) * 25
FROM ranked
WHERE t.id = ranked.id;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
