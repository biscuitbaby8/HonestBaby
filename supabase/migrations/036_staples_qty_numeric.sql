-- 輸入サプリの内容量は「10.3ml」のような小数があるため、内容量を小数で持てるようにする。
ALTER TABLE staple_offers ALTER COLUMN qty TYPE NUMERIC(10,2);
ALTER TABLE staple_history ALTER COLUMN qty TYPE NUMERIC(10,2);
