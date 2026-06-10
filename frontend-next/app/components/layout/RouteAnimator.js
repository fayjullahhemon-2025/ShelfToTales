'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const NO_ANIMATION_PREFIXES = ['/admin'];

export default function RouteAnimator({ children }) {
  const pathname = usePathname();

  const skipAnimation = NO_ANIMATION_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (skipAnimation) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
