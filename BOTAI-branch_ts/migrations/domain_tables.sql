-- Create domain_data table
CREATE TABLE IF NOT EXISTS domain_data (
  id SERIAL PRIMARY KEY,
  trial_id INTEGER NOT NULL REFERENCES trials(id),
  domain TEXT NOT NULL,
  source TEXT NOT NULL,
  record_id TEXT NOT NULL,
  record_data TEXT NOT NULL,
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create domain_sources table
CREATE TABLE IF NOT EXISTS domain_sources (
  id SERIAL PRIMARY KEY,
  trial_id INTEGER NOT NULL REFERENCES trials(id),
  domain TEXT NOT NULL,
  source TEXT NOT NULL,
  source_type TEXT NOT NULL,
  system TEXT NOT NULL,
  integration_method TEXT NOT NULL,
  format TEXT NOT NULL,
  description TEXT,
  mapping_details TEXT,
  frequency TEXT,
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_domain_data_trial_domain_source ON domain_data(trial_id, domain, source);
CREATE INDEX IF NOT EXISTS idx_domain_sources_trial_domain ON domain_sources(trial_id, domain);