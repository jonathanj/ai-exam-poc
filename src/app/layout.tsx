import type {Metadata} from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';
export const metadata: Metadata = {
  title: 'Exam Studio',
  description: 'A considered workspace for Grade 7 mathematics assessment.',
};
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang='en-ZA'>
      <body>{children}</body>
    </html>
  );
}
