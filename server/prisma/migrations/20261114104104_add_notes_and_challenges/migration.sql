-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "habits" ALTER COLUMN "colorHex" SET DEFAULT '#448aff';

-- CreateTable
CREATE TABLE "daily_notes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "habitId" INTEGER,
    "noteDate" DATE NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_programs" (
    "id" SERIAL NOT NULL,
    "managerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "previouslyPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenge_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_activities" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "FrequencyType" NOT NULL DEFAULT 'DAILY',
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6, 7]::INTEGER[],
    "targetCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_enrollments" (
    "id" SERIAL NOT NULL,
    "programId" INTEGER NOT NULL,
    "participantId" INTEGER NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "program_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_notes_userId_noteDate_idx" ON "daily_notes"("userId", "noteDate");

-- CreateIndex
CREATE INDEX "challenge_programs_managerId_idx" ON "challenge_programs"("managerId");

-- CreateIndex
CREATE INDEX "challenge_programs_status_idx" ON "challenge_programs"("status");

-- CreateIndex
CREATE INDEX "challenge_programs_category_idx" ON "challenge_programs"("category");

-- CreateIndex
CREATE INDEX "program_activities_programId_idx" ON "program_activities"("programId");

-- CreateIndex
CREATE INDEX "program_enrollments_programId_idx" ON "program_enrollments"("programId");

-- CreateIndex
CREATE INDEX "program_enrollments_participantId_idx" ON "program_enrollments"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "program_enrollments_programId_participantId_key" ON "program_enrollments"("programId", "participantId");

-- CreateIndex
CREATE INDEX "habits_programId_idx" ON "habits"("programId");

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_programId_fkey" FOREIGN KEY ("programId") REFERENCES "challenge_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_notes" ADD CONSTRAINT "daily_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_notes" ADD CONSTRAINT "daily_notes_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_programs" ADD CONSTRAINT "challenge_programs_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_activities" ADD CONSTRAINT "program_activities_programId_fkey" FOREIGN KEY ("programId") REFERENCES "challenge_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "challenge_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_enrollments" ADD CONSTRAINT "program_enrollments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
