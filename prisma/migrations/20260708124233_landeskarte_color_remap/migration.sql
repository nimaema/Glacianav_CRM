-- V2 "Alpine Modernist": remap stored colors from the old saturated palette
-- to the Landeskarte hues. Idempotent: only matches old values.

UPDATE "Status" SET color = CASE color
  WHEN '#64748b' THEN '#5b6b78'
  WHEN '#2563eb' THEN '#33688c'
  WHEN '#7c3aed' THEN '#6d5a8e'
  WHEN '#b45309' THEN '#9c6b3f'
  WHEN '#15803d' THEN '#47704a'
  WHEN '#dc2626' THEN '#c6362c'
  WHEN '#0d9488' THEN '#3e7d7b'
  WHEN '#db2777' THEN '#a45a74'
  WHEN '#4f46e5' THEN '#46557f'
  WHEN '#57534e' THEN '#7a6f5f'
  ELSE color END;

UPDATE "Group" SET color = CASE color
  WHEN '#64748b' THEN '#5b6b78'
  WHEN '#2563eb' THEN '#33688c'
  WHEN '#7c3aed' THEN '#6d5a8e'
  WHEN '#b45309' THEN '#9c6b3f'
  WHEN '#15803d' THEN '#47704a'
  WHEN '#dc2626' THEN '#c6362c'
  WHEN '#0d9488' THEN '#3e7d7b'
  WHEN '#db2777' THEN '#a45a74'
  WHEN '#4f46e5' THEN '#46557f'
  WHEN '#57534e' THEN '#7a6f5f'
  WHEN '#f97316' THEN '#9c6b3f'
  WHEN '#6366f1' THEN '#46557f'
  ELSE color END;

UPDATE "User" SET color = CASE color
  WHEN '#64748b' THEN '#5b6b78'
  WHEN '#2563eb' THEN '#33688c'
  WHEN '#7c3aed' THEN '#6d5a8e'
  WHEN '#b45309' THEN '#9c6b3f'
  WHEN '#15803d' THEN '#47704a'
  WHEN '#dc2626' THEN '#c6362c'
  WHEN '#0d9488' THEN '#3e7d7b'
  WHEN '#db2777' THEN '#a45a74'
  WHEN '#4f46e5' THEN '#46557f'
  WHEN '#57534e' THEN '#7a6f5f'
  ELSE color END;
