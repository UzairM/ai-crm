-- Insert default categories
INSERT INTO categories (name, description)
VALUES 
  ('Hardware', 'Issues related to physical computer hardware and peripherals'),
  ('Software', 'Problems with software applications and operating systems'),
  ('Network', 'Network connectivity and access-related issues'),
  ('Account Access', 'Account login, permissions, and access-related problems'),
  ('Email', 'Email client issues and email-related problems'),
  ('Security', 'Security concerns, suspicious activities, and vulnerabilities'),
  ('Training', 'Requests for training or documentation'),
  ('Feature Request', 'Suggestions for new features or improvements'),
  ('Bug Report', 'Report of software bugs or unexpected behavior'),
  ('Other', 'Other miscellaneous issues')
ON CONFLICT (id) DO NOTHING; 