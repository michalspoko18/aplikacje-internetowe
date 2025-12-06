CREATE TABLE IF NOT EXISTS category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL
);

INSERT INTO category (name, description) VALUES
('General', 'General topics'),
('Announcements', 'Official announcements'),
('Tips', 'Helpful tips and tricks');
