-- CreateTable
CREATE TABLE "StopDay" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "motivation" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StopDay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StopDay" ADD CONSTRAINT "StopDay_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
