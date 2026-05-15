-- Create a storage bucket for movies
insert into storage.buckets (id, name, public)
values ('movies', 'movies', true)
on conflict (id) do nothing;

-- Set up security policies for the 'movies' bucket
-- Allow public access to read files
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'movies' );

-- Allow authenticated users to insert files
create policy "Authenticated users can upload files"
  on storage.objects for insert
  with check ( bucket_id = 'movies' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update files
create policy "Authenticated users can update files"
  on storage.objects for update
  using ( bucket_id = 'movies' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete files
create policy "Authenticated users can delete files"
  on storage.objects for delete
  using ( bucket_id = 'movies' AND auth.role() = 'authenticated' );
