import React from 'react';
import { motion } from 'motion/react';

export const WelcomeFooter: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.32 }}
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-6 border-t border-light-gray"
    >
      <p className="text-sm font-semibold tracking-tight text-ink">
        Centro de Control Fluvial
      </p>
      <p className="text-xs font-medium text-muted-gray">
        Sistema de Transportes {new Date().getFullYear()} • BUGBUSTERS
      </p>
    </motion.footer>
  );
};
