-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'ENVIANDO';

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('RETIRA', 'ENVIO');

-- AlterTable: pedidos para retirar / con envío llevan datos del cliente en vez de mesa,
-- y pueden llegar ya pagados (cobrados por adelantado) antes de terminar el flujo de cocina
ALTER TABLE "Order" ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "deliveryMode" "DeliveryMode",
ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false;
