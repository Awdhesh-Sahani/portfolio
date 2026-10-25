create table if not exists public.portfolio_admins (
    user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.portfolio_admins enable row level security;
revoke all on public.portfolio_admins from anon, authenticated;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.portfolio_admins
        where user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to authenticated;

create table if not exists public.portfolio_content (
    id text primary key check (id = 'site'),
    content jsonb not null,
    updated_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;
grant select on public.portfolio_content to anon, authenticated;
grant update (content, updated_at) on public.portfolio_content to authenticated;

drop policy if exists "Portfolio content is public" on public.portfolio_content;
drop policy if exists "Portfolio admins update content" on public.portfolio_content;

create policy "Portfolio content is public"
    on public.portfolio_content for select
    to anon, authenticated
    using (true);

create policy "Portfolio admins update content"
    on public.portfolio_content for update
    to authenticated
    using ((select public.is_portfolio_admin()))
    with check ((select public.is_portfolio_admin()));

insert into public.portfolio_content (id, content)
values (
    'site',
    '{
      "profile": {
        "name": "Awdhesh Sahani",
        "heroRole": "Software Developer & Web Developer",
        "heroDescription": "A passionate fresher who loves building modern, responsive and user-friendly web applications. I enjoy solving problems and learning new technologies.",
        "aboutRole": "Software Developer",
        "aboutSummary": "Fresher passionate about software development, web technologies and creating real-world projects.",
        "aboutHeading": "Building Ideas Into Web Experiences",
        "aboutParagraphOne": "I''m a software and web development enthusiast with a strong interest in creating responsive and user-friendly applications.",
        "aboutParagraphTwo": "I have worked with technologies such as Java, JavaScript, React, Node.js, Express and MongoDB. I continuously improve my skills by building practical projects.",
        "experience": "Fresher",
        "location": "India",
        "phone": "+91 6392789729",
        "email": "sahaniawdhesh01@gmail.com",
        "profileImageUrl": "/assets/profile.jpg",
        "profileImagePath": "",
        "resumeUrl": "/assets/resume.pdf",
        "resumePath": "",
        "footerRole": "Software Developer | Web Developer | Fresher",
        "hireDescription": "I am a motivated fresher who is passionate about technology, eager to learn, and ready to contribute to real-world projects.",
        "social": [
          {"platform": "github", "url": "https://github.com/Awdhesh-Sahani"},
          {"platform": "linkedin", "url": "https://www.linkedin.com/in/awdheshsahani01/"},
          {"platform": "email", "url": "mailto:sahaniawdhesh01@gmail.com"},
          {"platform": "instagram", "url": "https://www.instagram.com/sa_coder.015"},
          {"platform": "facebook", "url": "https://www.facebook.com/share/1T2k883cFr/"}
        ]
      },
      "skills": [
        {"id":"skill-html","name":"HTML5","level":90,"icon":"bi-filetype-html"},
        {"id":"skill-css","name":"CSS3","level":85,"icon":"bi-filetype-css"},
        {"id":"skill-bootstrap","name":"Bootstrap","level":85,"icon":"bi-bootstrap"},
        {"id":"skill-js","name":"JavaScript","level":80,"icon":"bi-filetype-js"},
        {"id":"skill-react","name":"React.js","level":75,"icon":"bi-code-square"},
        {"id":"skill-java","name":"Java","level":80,"icon":"bi-cup-hot"},
        {"id":"skill-node","name":"Node.js","level":70,"icon":"bi-server"},
        {"id":"skill-mongodb","name":"MongoDB","level":70,"icon":"bi-database"},
        {"id":"skill-git","name":"Git & GitHub","level":80,"icon":"bi-git"}
      ],
      "projects": [
        {"id":"project-resume","title":"AI Resume Analyzer","description":"An AI-powered resume analyzer that evaluates resumes and provides ATS-based feedback.","icon":"bi-robot","imageUrl":"","imagePath":"","technologies":["React","Node.js","MongoDB","AI"],"githubUrl":"","demoUrl":""},
        {"id":"project-voxmeet","title":"VoxMeet","description":"A modern video conferencing application designed for online meetings and communication.","icon":"bi-camera-video","imageUrl":"","imagePath":"","technologies":["React","Node.js","Express","WebRTC"],"githubUrl":"","demoUrl":""},
        {"id":"project-spotify","title":"Spotify Clone","description":"Using HTML CSS make a spotify clone.","icon":"","imageUrl":"/certificates/spotify.jpg","imagePath":"","technologies":["HTML","CSS"],"githubUrl":"https://github.com/Awdhesh-Sahani/Spotify_Clone","demoUrl":"https://spotifyawd.vercel.app/"}
      ],
      "education": [
        {"id":"education-degree","period":"2023 - 2027","degree":"Bachelor''s Degree","field":"Computer Science Engineering and Artificial Intelligence","description":"Gn Group of Institute/Dr. A.P.J Abdul kalam Technical University 7CGPA."},
        {"id":"education-higher","period":"2021 - 2023","degree":"Higher Secondary Education","field":"Science (Physics Chemistry Maths)","description":"S.S.M Inter College Nautanwa."},
        {"id":"education-school","period":"2019 - 2021","degree":"High School","field":"Science","description":"M.K High School Durgapur."}
      ],
      "certificates": [
        {"id":"certificate-java","tag":"DSA(Java)","title":"DSA with Java","issuer":"Apna College","year":"2026","verified":true,"imageUrl":"/certificates/java.jpg.png","imagePath":"","fileUrl":"/certificates/java.pdf.pdf","filePath":""},
        {"id":"certificate-expo1","tag":"Project Expo","title":"Project Exhibition","issuer":"College","year":"2024","verified":true,"imageUrl":"/certificates/expo1.jpg","imagePath":"","fileUrl":"/certificates/expo1.pdf","filePath":""},
        {"id":"certificate-expo2","tag":"Project Expo","title":"Project Exhibition","issuer":"College","year":"2026","verified":true,"imageUrl":"/certificates/expo2.jpg","imagePath":"","fileUrl":"/certificates/expo2.pdf","filePath":""}
      ],
      "highlights": [
        {"id":"highlight-problem-solving","title":"Solver Real world Problem","icon":"bi-lightbulb"},
        {"id":"highlight-learning","title":"Quick Learner","icon":"bi-book"},
        {"id":"highlight-developer","title":"Developer","icon":"bi-code-slash"},
        {"id":"highlight-team","title":"Team Player","icon":"bi-people"}
      ]
    }'::jsonb
)
on conflict (id) do nothing;

create table if not exists public.contact_messages (
    id bigint generated always as identity primary key,
    name text not null check (char_length(name) between 1 and 100),
    email text not null check (char_length(email) between 3 and 254),
    subject text not null check (char_length(subject) between 1 and 200),
    message text not null check (char_length(message) between 1 and 5000),
    created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
grant select, delete on public.contact_messages to authenticated;

drop policy if exists "Portfolio admins view contact messages" on public.contact_messages;
drop policy if exists "Portfolio admins delete contact messages" on public.contact_messages;

create policy "Portfolio admins view contact messages"
    on public.contact_messages for select
    to authenticated
    using ((select public.is_portfolio_admin()));

create policy "Portfolio admins delete contact messages"
    on public.contact_messages for delete
    to authenticated
    using ((select public.is_portfolio_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'portfolio-assets',
    'portfolio-assets',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio assets are public" on storage.objects;
drop policy if exists "Portfolio admins upload assets" on storage.objects;
drop policy if exists "Portfolio admins update assets" on storage.objects;
drop policy if exists "Portfolio admins delete assets" on storage.objects;

create policy "Portfolio assets are public"
    on storage.objects for select
    to public
    using (bucket_id = 'portfolio-assets');

create policy "Portfolio admins upload assets"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'portfolio-assets'
        and (select public.is_portfolio_admin())
    );

create policy "Portfolio admins update assets"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'portfolio-assets'
        and (select public.is_portfolio_admin())
    )
    with check (
        bucket_id = 'portfolio-assets'
        and (select public.is_portfolio_admin())
    );

create policy "Portfolio admins delete assets"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'portfolio-assets'
        and (select public.is_portfolio_admin())
    );
