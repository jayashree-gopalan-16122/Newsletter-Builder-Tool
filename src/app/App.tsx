import { Toaster } from 'sonner';
import { BuilderLayout } from './components/newsletter-builder/BuilderLayout';

export default function App() {
  return (
    <>
      <BuilderLayout />
      <Toaster position="bottom-center" richColors />
    </>
  );
}
