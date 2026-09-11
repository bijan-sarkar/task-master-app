import './globals.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'TaskMaster AI | Weekly Accountability & Roadmap Engine',
  description: 'Smart task organizer that aligns tasks to your free hours with harsh reminders and custom roadmaps.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-8 antialiased">
        {children}
      </body>
    </html>
  );
}
