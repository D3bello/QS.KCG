-- QTO Items Table
CREATE TABLE IF NOT EXISTS QTO_Items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    csi_code TEXT, -- Could be linked to a separate CSI Codes table if more detail is needed
    item_description TEXT NOT NULL,
    quantity REAL,
    unit TEXT, -- e.g., m2, m3, lm, nr
    unit_rate REAL,
    total_cost REAL, -- Calculated: quantity * unit_rate
    notes TEXT,
    created_by_id INTEGER NOT NULL, -- User who added/last modified this item
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES Users(id)
);

-- Optional: CSI Codes Table (if a predefined list of CSI codes is managed)
-- CREATE TABLE IF NOT EXISTS CSI_Codes (
--     code TEXT PRIMARY KEY,
--     division_number TEXT,
--     division_title TEXT,
--     description TEXT
-- );

-- Trigger to update `updated_at` timestamp on QTO_Items table
CREATE TRIGGER IF NOT EXISTS qto_items_update_timestamp
AFTER UPDATE ON QTO_Items
FOR EACH ROW
BEGIN
    UPDATE QTO_Items SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

-- Bill of Quantities (BOQ) Table - Integrated from QTO Items
-- This table will store items that are specifically marked for or linked to the BOQ.
-- The structure can be similar to QTO_Items but might have additional BOQ-specific fields.
-- For direct integration as requested, QTO_Items might have a boolean flag like `is_boq_item`
-- or items are copied here when a CSI code is assigned.
-- Let's add a flag to QTO_Items for now to simplify, and a dedicated BOQ table if more structure is needed later.

ALTER TABLE QTO_Items ADD COLUMN is_boq_item BOOLEAN DEFAULT FALSE;
ALTER TABLE QTO_Items ADD COLUMN boq_division TEXT; -- To store CSI division for BOQ sheet organization

-- Consider an index for faster lookups on project_id and csi_code in QTO_Items
CREATE INDEX IF NOT EXISTS idx_qto_items_project_id ON QTO_Items(project_id);
CREATE INDEX IF NOT EXISTS idx_qto_items_csi_code ON QTO_Items(csi_code);

