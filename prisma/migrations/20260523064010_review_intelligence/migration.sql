-- CreateTable
CREATE TABLE "ReviewInsight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "prosJson" TEXT NOT NULL,
    "consJson" TEXT NOT NULL,
    "topicsJson" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewInsight_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewInsight_courseId_key" ON "ReviewInsight"("courseId");
