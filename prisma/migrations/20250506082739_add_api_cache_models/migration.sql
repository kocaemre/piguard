-- CreateTable
CREATE TABLE "ArduinoLogCache" (
    "id" TEXT NOT NULL,
    "gyroX" TEXT NOT NULL,
    "gyroY" TEXT NOT NULL,
    "gyroZ" TEXT NOT NULL,
    "servoNeck" TEXT NOT NULL,
    "servoHead" TEXT NOT NULL,
    "distFront" TEXT NOT NULL,
    "distLeft" TEXT NOT NULL,
    "distRight" TEXT NOT NULL,
    "motorState" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArduinoLogCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiSystemCache" (
    "id" TEXT NOT NULL,
    "cpu" TEXT NOT NULL,
    "ram" TEXT NOT NULL,
    "cpuTemp" TEXT NOT NULL,
    "gpuTemp" TEXT NOT NULL,
    "uploadSpeed" TEXT NOT NULL,
    "downloadSpeed" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PiSystemCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageCache" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogFileCache" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogFileCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArduinoLogCache_createdAt_idx" ON "ArduinoLogCache"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "PiSystemCache_createdAt_idx" ON "PiSystemCache"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ImageCache_timestamp_idx" ON "ImageCache"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "LogFileCache_timestamp_idx" ON "LogFileCache"("timestamp" DESC);
