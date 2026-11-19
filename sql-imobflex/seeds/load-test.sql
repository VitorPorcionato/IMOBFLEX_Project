-- ONLY on a disposable restored database, never on the pilot or production database.
-- Precondition: exactly the 3 demo properties from DemoSeeder; otherwise stop.
-- Run separately after checking SELECT COUNT(*) FROM properties = 3.
INSERT INTO properties(title,type,purpose,description,cep,street,number,neighborhood,city,state,sale_price,rent_price,area,bedrooms,bathrooms,parking,owner_id,broker_id,status)
SELECT CONCAT('Carga fictícia ',n),'HOUSE','BOTH',p.description,p.cep,p.street,p.number,p.neighborhood,p.city,p.state,p.sale_price,p.rent_price,p.area,p.bedrooms,p.bathrooms,p.parking,p.owner_id,p.broker_id,'AVAILABLE'
FROM properties p CROSS JOIN
(WITH RECURSIVE seq AS (SELECT 1 n UNION ALL SELECT n+1 FROM seq WHERE n<1000) SELECT n FROM seq) s
WHERE p.id=(SELECT MIN(id) FROM (SELECT id FROM properties) existing) LIMIT 997;
