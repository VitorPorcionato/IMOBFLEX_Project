ALTER TABLE visits
 ADD COLUMN reserved_start TIMESTAMP(6) GENERATED ALWAYS AS (CASE WHEN status IN ('SCHEDULED','CONFIRMED') THEN starts_at ELSE NULL END) STORED,
 ADD UNIQUE KEY uq_property_slot(property_id,reserved_start),
 ADD UNIQUE KEY uq_broker_slot(broker_id,reserved_start),
 ADD UNIQUE KEY uq_client_slot(client_id,reserved_start);
