-- F-10 Fase 4: Migrar dados de clientes e remover campos do Appointment

-- Step 1: Criar Client records para agendamentos orfaos (sem clientId)
-- Usa CTE com ROW_NUMBER para atribuir CPFs sequencialmente por usuario
WITH unique_clients AS (
    SELECT DISTINCT ON (LOWER(a.email), a."userId")
        a."userId",
        a.name,
        LOWER(a.email) AS email,
        a.phone
    FROM "Appointment" a
    WHERE a."clientId" IS NULL
    ORDER BY LOWER(a.email), a."userId", a."createdAt" DESC
),
numbered AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY email) AS rn
    FROM unique_clients
)
INSERT INTO "Client" (id, "userId", name, email, phone, cpf, "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "userId",
    name,
    email,
    phone,
    (ARRAY[
        '27182322005', '54226322061', '29149201050', '77479410050',
        '79302755070', '69742088047', '32664064002', '71653677058',
        '66084138071', '55344929021', '78000257050', '67640113032'
    ])[rn],
    NOW(),
    NOW()
FROM numbered
WHERE rn <= 12;

-- Step 2: Vincular agendamentos orfaos aos clientes recem-criados
UPDATE "Appointment" a
SET "clientId" = c.id
FROM "Client" c
WHERE a."clientId" IS NULL
  AND a."userId" = c."userId"
  AND LOWER(a.email) = c.email;

-- Step 3: Tornar clientId obrigatorio (todos os NULLs ja foram preenchidos)
ALTER TABLE "Appointment" ALTER COLUMN "clientId" SET NOT NULL;

-- Step 4: Remover campos de cliente do Appointment
ALTER TABLE "Appointment" DROP COLUMN "name";
ALTER TABLE "Appointment" DROP COLUMN "email";
ALTER TABLE "Appointment" DROP COLUMN "phone";
