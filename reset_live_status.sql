-- Reset IsLive status for all presentations and questions
-- This will set IsLive to false for all rows in both tables
-- PostgreSQL version with quoted table names and correct column names

-- Reset IsLive for all presentations
UPDATE "Presentations" 
SET "IsLive" = false, 
    "LiveEndedAt" = NOW()
WHERE "IsLive" = true;

-- Reset IsLive for all questions
UPDATE "Questions" 
SET "IsLive" = false, 
    "LiveEndedAt" = NOW()
WHERE "IsLive" = true;

-- Optional: Show the results
SELECT 'Presentations updated' as "TableName", COUNT(*) as "RowsUpdated"
FROM "Presentations" 
WHERE "IsLive" = false AND "LiveEndedAt" IS NOT NULL

UNION ALL

SELECT 'Questions updated' as "TableName", COUNT(*) as "RowsUpdated"
FROM "Questions" 
WHERE "IsLive" = false AND "LiveEndedAt" IS NOT NULL;
