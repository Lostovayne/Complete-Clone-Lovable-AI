/*
  Warnings:

  - You are about to drop the column `sandoxUrl` on the `Fragment` table. All the data in the column will be lost.
  - Added the required column `sandboxUrl` to the `Fragment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Fragment" DROP COLUMN "sandoxUrl",
ADD COLUMN     "sandboxUrl" TEXT NOT NULL;
