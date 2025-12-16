-- WETrack Storage Setup
-- Run this in your Supabase SQL Editor after schema.sql

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
