INSERT INTO platform_settings (key, value) VALUES
  ('platform_email', 'support@apex.edu'),
  ('platform_phone', '+91 98765 43210'),
  ('platform_location', 'APEX Innovation Center, Bangalore, India')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO team_members (name, role, qualification, email, phone, photo_url, social_media, sort_order)
VALUES
  (
    'Jeevansri',
    'Technical Team Head',
    'B.Sc Computer Science',
    'jeevansri@apex.edu',
    '+91 98765 43210',
    NULL,
    '{"linkedin": "", "github": "", "twitter": ""}',
    1
  )
ON CONFLICT DO NOTHING;
