-- Rename CircleType enum values to match frontend (CREW, GAME, NETWORK, CLUB, LEAGUE)
ALTER TYPE "CircleType" RENAME VALUE 'FRIENDS' TO 'CREW';
ALTER TYPE "CircleType" RENAME VALUE 'COMPETITION' TO 'GAME';
ALTER TYPE "CircleType" RENAME VALUE 'CUSTOM' TO 'NETWORK';
ALTER TYPE "CircleType" RENAME VALUE 'TRIP' TO 'LEAGUE';
-- CLUB stays the same

-- Update default value for Circle.type column
ALTER TABLE "Circle" ALTER COLUMN "type" SET DEFAULT 'CREW'::"CircleType";

-- Rename VerificationMethod enum values to match frontend (NONE, ADMIN_APPROVAL, CODE, EMAIL_DOMAIN)
ALTER TYPE "VerificationMethod" RENAME VALUE 'ADMIN_MANUAL' TO 'ADMIN_APPROVAL';
ALTER TYPE "VerificationMethod" RENAME VALUE 'DOCUMENT' TO 'CODE';
ALTER TYPE "VerificationMethod" RENAME VALUE 'VOUCHING' TO 'NONE';
ALTER TYPE "VerificationMethod" RENAME VALUE 'DOMAIN' TO 'EMAIL_DOMAIN';
