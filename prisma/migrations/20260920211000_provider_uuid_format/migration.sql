-- Give migrated deterministic IDs the RFC 9562 custom UUID version and variant
-- bits. Raw MD5 UUID casts can fail strict UUID validation in application APIs.
-- ON UPDATE CASCADE carries every existing record link to the corrected ID.
UPDATE "CareProvider"
SET "id" = (
  substr(md5("normalizedName"), 1, 8) || '-' ||
  substr(md5("normalizedName"), 9, 4) || '-8' ||
  substr(md5("normalizedName"), 14, 3) || '-8' ||
  substr(md5("normalizedName"), 18, 3) || '-' ||
  substr(md5("normalizedName"), 21, 12)
)::uuid
WHERE "id" = md5("normalizedName")::uuid;
