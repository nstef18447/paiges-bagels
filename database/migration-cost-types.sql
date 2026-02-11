-- Add cost_type and add_on_type_id to ingredients table
-- cost_type: 'per_bagel' (default, existing behavior), 'per_addon' (per add-on unit sold), 'fixed' (amortized over all bagels)
-- add_on_type_id: links to add_on_types when cost_type = 'per_addon'

ALTER TABLE ingredients ADD COLUMN cost_type text NOT NULL DEFAULT 'per_bagel';
ALTER TABLE ingredients ADD COLUMN add_on_type_id uuid REFERENCES add_on_types(id) ON DELETE SET NULL;
