-- Demo policy: allow visitors to submit a booking, but not read bookings.
-- Review before running: this exposes an anonymous insert path to the public app.
create policy "Visitors can create bookings"
on public.bookings
for insert
to anon, authenticated
with check (
  char_length(trim(customer_name)) between 1 and 100
  and seats between 1 and 12
  and exists (
    select 1
    from public.matches
    where public.matches.id = bookings.match_id
  )
);
