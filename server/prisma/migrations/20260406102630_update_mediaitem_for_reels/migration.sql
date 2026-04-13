-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'reel';

COMMIT;

-- AlterTable
ALTER TABLE "MediaItem" ALTER COLUMN "type" SET DEFAULT 'reel';