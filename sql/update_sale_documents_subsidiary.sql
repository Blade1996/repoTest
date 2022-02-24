UPDATE sal_documents a
INNER JOIN com_subsidiaries b
ON a.com_subsidiary_id = b.id
SET a.subsidiary_ruc = b.ruc, a.subsidiary_rz_social = b.rz_social, a.subsidiary_address = b.address, a.subsidiary_name = b.sucursal_name
WHERE a.deleted_at IS NULL