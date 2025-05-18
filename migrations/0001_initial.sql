-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Admin', 'Data Entry', 'Project Manager', 'Read-Only Viewer')),
    email TEXT UNIQUE,
    full_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS Projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL,
    project_number TEXT UNIQUE,
    client_name TEXT,
    client_contact TEXT,
    project_address TEXT,
    start_date TEXT, -- ISO 8601 format (YYYY-MM-DD)
    expected_end_date TEXT, -- ISO 8601 format (YYYY-MM-DD)
    actual_end_date TEXT, -- ISO 8601 format (YYYY-MM-DD)
    project_status TEXT DEFAULT 'Planning' CHECK(project_status IN ('Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled')),
    project_manager_id INTEGER, -- Can be NULL if not assigned or if PM is not a system user
    project_description TEXT,
    contract_value REAL,
    currency TEXT DEFAULT 'USD',
    key_reference_numbers TEXT, -- Store as JSON string or comma-separated
    created_by_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_excel_sync_at TEXT, -- ISO 8601 format (YYYY-MM-DD HH:MM:SS)
    FOREIGN KEY (project_manager_id) REFERENCES Users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES Users(id) ON DELETE RESTRICT
);

-- (Optional) A table to link users to projects if multiple users can be assigned to a project with different roles
-- CREATE TABLE IF NOT EXISTS ProjectUsers (
--    project_id INTEGER NOT NULL,
--    user_id INTEGER NOT NULL,
--    project_role TEXT NOT NULL, -- e.g., 'Editor', 'Viewer'
--    PRIMARY KEY (project_id, user_id),
--    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
--    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
-- );

-- Initial Admin User (example - password needs to be hashed securely in practice)
-- For D1, direct inserts like this are fine in migrations. Password management will be handled by the app.
INSERT INTO Users (username, password_hash, role, email, full_name) VALUES ('admin', 'super_secret_hashed_password', 'Admin', 'admin@example.com', 'Administrator');

-- Note: Triggers for updated_at are not directly supported in SQLite in the same way as other DBs.
-- The application logic will need to handle updating the 'updated_at' fields.

