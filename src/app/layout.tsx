import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocMail — First-Party Communication Platform',
  description: 'DocMail by Docdril: Modern, tactile business communication powered by Hostinger infrastructure',
  icons: {
    icon: '/docdril.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen text-slate-800 selection:bg-pink-200 selection:text-pink-900">
        {children}
      </body>
    </html>
  );
}
