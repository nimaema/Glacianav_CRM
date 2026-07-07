-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "passwordLoginEnabled" BOOLEAN NOT NULL DEFAULT true,
    "microsoftEnabled" BOOLEAN NOT NULL DEFAULT false,
    "microsoftTenantId" TEXT,
    "microsoftClientId" TEXT,
    "microsoftClientSecret" TEXT,
    "ssoAllowedDomain" TEXT,
    "ssoAutoProvision" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

