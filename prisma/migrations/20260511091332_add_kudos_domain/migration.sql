-- CreateEnum
CREATE TYPE "SecretBoxState" AS ENUM ('pending', 'opened');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "heartsReceivedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kudosReceivedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kudosSentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "secretBoxesOpenedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "secretBoxesPendingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hashtag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kudo" (
    "id" TEXT NOT NULL,
    "senderUserId" TEXT NOT NULL,
    "receiverUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "heartCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KudoImage" (
    "id" TEXT NOT NULL,
    "kudoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KudoImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KudoLike" (
    "id" TEXT NOT NULL,
    "kudoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isSpecialDayLike" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KudoLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KudoHashtag" (
    "kudoId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KudoHashtag_pkey" PRIMARY KEY ("kudoId","hashtagId")
);

-- CreateTable
CREATE TABLE "SpecialDay" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "label" TEXT,
    "multiplier" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretBox" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "giftId" TEXT,
    "state" "SecretBoxState" NOT NULL DEFAULT 'pending',
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretBox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Hashtag_name_key" ON "Hashtag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Hashtag_slug_key" ON "Hashtag"("slug");

-- CreateIndex
CREATE INDEX "Kudo_createdAt_id_idx" ON "Kudo"("createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Kudo_heartCount_idx" ON "Kudo"("heartCount" DESC);

-- CreateIndex
CREATE INDEX "Kudo_senderUserId_idx" ON "Kudo"("senderUserId");

-- CreateIndex
CREATE INDEX "Kudo_receiverUserId_idx" ON "Kudo"("receiverUserId");

-- CreateIndex
CREATE INDEX "KudoImage_kudoId_idx" ON "KudoImage"("kudoId");

-- CreateIndex
CREATE INDEX "KudoLike_userId_idx" ON "KudoLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KudoLike_kudoId_userId_key" ON "KudoLike"("kudoId", "userId");

-- CreateIndex
CREATE INDEX "KudoHashtag_hashtagId_idx" ON "KudoHashtag"("hashtagId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialDay_date_key" ON "SpecialDay"("date");

-- CreateIndex
CREATE INDEX "SecretBox_userId_state_idx" ON "SecretBox"("userId", "state");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kudo" ADD CONSTRAINT "Kudo_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kudo" ADD CONSTRAINT "Kudo_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudoImage" ADD CONSTRAINT "KudoImage_kudoId_fkey" FOREIGN KEY ("kudoId") REFERENCES "Kudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudoLike" ADD CONSTRAINT "KudoLike_kudoId_fkey" FOREIGN KEY ("kudoId") REFERENCES "Kudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudoLike" ADD CONSTRAINT "KudoLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudoHashtag" ADD CONSTRAINT "KudoHashtag_kudoId_fkey" FOREIGN KEY ("kudoId") REFERENCES "Kudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KudoHashtag" ADD CONSTRAINT "KudoHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretBox" ADD CONSTRAINT "SecretBox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretBox" ADD CONSTRAINT "SecretBox_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
