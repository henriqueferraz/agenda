-- F-09: Adicionar roles (master/enterprise) e trial ao User

-- Step 1: Criar enum UserRole
CREATE TYPE "UserRole" AS ENUM ('master', 'enterprise');

-- Step 2: Limpar CPFs vazios e duplicados
UPDATE "User" SET cpf = NULL WHERE cpf = '' OR cpf IS NULL;

-- Manter apenas o primeiro registro de cada CPF duplicado
WITH ranked AS (
  SELECT id, cpf, ROW_NUMBER() OVER (PARTITION BY cpf ORDER BY "createdAt" ASC) AS rn
  FROM "User"
  WHERE cpf IS NOT NULL
)
UPDATE "User"
SET cpf = NULL
FROM ranked
WHERE "User".id = ranked.id AND ranked.rn > 1;

-- Step 3: Adicionar novos campos ao User
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'enterprise';
ALTER TABLE "User" ADD COLUMN "trialEndsAt" TIMESTAMP(3);

-- Step 4: Adicionar unique constraint no cpf (permite multiplos NULLs)
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- Step 5: Configurar usuario MASTER (Henrique)
UPDATE "User"
SET "role" = 'master', "trialEndsAt" = NULL, cpf = NULL
WHERE id = 'cmk069h7v0000o1ui5n6uk0km';

-- Step 6: Configurar usuarios ENTERPRISE com trial de 30 dias a partir de createdAt
UPDATE "User"
SET "role" = 'enterprise', "trialEndsAt" = "createdAt" + INTERVAL '30 days'
WHERE id != 'cmk069h7v0000o1ui5n6uk0km';
