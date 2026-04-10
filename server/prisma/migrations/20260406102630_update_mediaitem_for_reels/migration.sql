-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'reel';

-- AlterTable
ALTER TABLE "MediaItem" ALTER COLUMN "type" SET DEFAULT 'reel';