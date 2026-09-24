-- AlterTable: quién entregó el pedido (persona de delivery que lo marcó como entregado)
ALTER TABLE "Order" ADD COLUMN     "deliveredBy" TEXT;
