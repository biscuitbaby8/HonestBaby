-- 粉ミルクは1gあたり数円で保存するため、単価の小数桁を2桁から4桁に広げる。
ALTER TABLE staple_offers ALTER COLUMN unit_price TYPE NUMERIC(10,4);
ALTER TABLE staple_history ALTER COLUMN unit_price TYPE NUMERIC(10,4);
