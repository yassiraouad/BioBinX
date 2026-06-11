// pages/_app.js
import '../styles/globals.css';
import { AuthProvider } from '../hooks/useAuth';
import { DemoProvider } from '../hooks/useDemo';
import { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  return (
    <DemoProvider>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#101828',
              border: '1px solid #d0d5dd',
              borderRadius: '12px',
              fontFamily: 'Poppins, sans-serif',
            },
            success: {
              iconTheme: { primary: '#0f766e', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#b42318', secondary: '#ffffff' },
            },
          }}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={router.asPath}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </AuthProvider>
    </DemoProvider>
  );
}
