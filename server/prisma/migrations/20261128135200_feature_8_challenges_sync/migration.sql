-- CreateEnum
CREATE TYPE "ChallengeHabitStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'LEFT', 'COMPLETED');

-- AlterTable
ALTER TABLE "habits" ADD COLUMN     "challengeStatus" "ChallengeHabitStatus",
ADD COLUMN     "sourceActivityId" INTEGER,
ADD COLUMN     "syncedVersion" INTEGER;

-- AlterTable
ALTER TABLE "challenge_programs" ADD COLUMN     "hasTemplateEditsSincePublish" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "program_enrollments" ADD COLUMN     "leftAt" TIMESTAMP(3),
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "challenge_ratings" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_comments" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "parentCommentId" INTEGER,
    "content" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "challenge_ratings_programId_idx" ON "challenge_ratings"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_ratings_programId_userId_key" ON "challenge_ratings"("programId", "userId");

-- CreateIndex
CREATE INDEX "challenge_comments_programId_createdAt_idx" ON "challenge_comments"("programId", "createdAt");

-- CreateIndex
CREATE INDEX "challenge_comments_parentCommentId_idx" ON "challenge_comments"("parentCommentId");

-- CreateIndex
CREATE INDEX "habits_sourceActivityId_idx" ON "habits"("sourceActivityId");

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_sourceActivityId_fkey" FOREIGN KEY ("sourceActivityId") REFERENCES "program_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_ratings" ADD CONSTRAINT "challenge_ratings_programId_fkey" FOREIGN KEY ("programId") REFERENCES "challenge_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_ratings" ADD CONSTRAINT "challenge_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_comments" ADD CONSTRAINT "challenge_comments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "challenge_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_comments" ADD CONSTRAINT "challenge_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_comments" ADD CONSTRAINT "challenge_comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "challenge_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
