-- =====================================================
-- IMPORTANT: Run these queries ONE AT A TIME!
-- =====================================================

-- QUERY 1: Run this FIRST, then wait for it to complete
-- This adds UPDATE_METAL_RATES to the Permission enum
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'UPDATE_METAL_RATES';

-- =====================================================
-- After Query 1 succeeds, run Query 2 below
-- =====================================================

-- QUERY 2: Run this SECOND (after Query 1 completes)
-- This updates all Shop Owners to have the new permission
UPDATE "User"
SET permissions = array_append(permissions, 'UPDATE_METAL_RATES'::"Permission")
WHERE role = 'SHOP_OWNER'
AND NOT ('UPDATE_METAL_RATES'::"Permission" = ANY(permissions));

-- QUERY 3: Run this THIRD to verify
-- This shows the updated permissions
SELECT id, name, email, role, permissions
FROM "User"
WHERE role = 'SHOP_OWNER';
