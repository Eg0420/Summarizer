import PDFUploadForm from '@/components/PDFUploadForm';

export const metadata = {
  title: 'PDF Summarizer',
  description: 'Upload PDFs and get summaries with Q&A',
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <PDFUploadForm />
    </main>
  );
}
