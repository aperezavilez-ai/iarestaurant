-- ================================================================
-- IA-RESTAURANT — MIGRACIÓN 012: FOTOS DE PRODUCTOS + STORAGE
-- ================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "product_images_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "product_images_auth_delete" ON storage.objects;

CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "product_images_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "product_images_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1565299585323-38174c0a5e73?w=400&q=80'
WHERE id = '00000000-0000-0000-0000-000000000201';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1551504738-cee027f75213?w=400&q=80'
WHERE id = '00000000-0000-0000-0000-000000000202';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400&q=80'
WHERE id = '00000000-0000-0000-0000-000000000203';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1599974129793-fabb78a32f34?w=400&q=80'
WHERE id = '00000000-0000-0000-0000-000000000204';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1628191010210-a59de9c2efc5?w=400&q=80'
WHERE id = '00000000-0000-0000-0000-000000000205';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1622597467836-f32821f8271b?w=400&q=80'
WHERE id = '00000000-0000-0000-0000-000000000206';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1555633724-dab1d64b9a75?w=400&q=80'
WHERE id = '00000000-0000-0000-0000-000000000207';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1551024926-7fb043ee4ec6?w=400&q=80'
WHERE id = '00000000-0000-0000-0000-000000000214';
