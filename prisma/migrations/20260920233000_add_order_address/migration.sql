-- AlterTable: los pedidos "con envío" necesitan la dirección de entrega
ALTER TABLE "Order" ADD COLUMN     "address" TEXT;
