MATCHDAY — open and run in VS Code

1. Unzip matchday-project.zip.
2. In VS Code, choose File > Open Folder and select the unzipped folder.
3. In Supabase, open Project Settings > API Keys and copy the publishable key.
4. In the project folder, make a copy of .env.example and name it .env.local.
5. Open .env.local and replace YOUR_SUPABASE_PUBLISHABLE_KEY with the publishable key.
   The Supabase project URL is already filled in.
6. In VS Code, choose Terminal > New Terminal, then run:

   npm install
   npm run dev

7. Open the http://localhost link shown in the terminal.

The app reads matches from public.matches, refreshes them when match rows change,
and submits seat reservations to public.bookings. The Supabase tables and policies
must exist in the linked Supabase project. Never put a database password or a
service_role/secret key in this app.
