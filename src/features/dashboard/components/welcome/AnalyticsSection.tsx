import React from 'react';
import { motion } from 'motion/react';

type AnalyticsSectionProps = {
  chart: React.ReactNode;
  ranking: React.ReactNode;
};

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ chart, ranking }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.24 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
    >
      <div className="lg:col-span-8 h-full">
        {chart}
      </div>
      <div className="lg:col-span-4 h-full">
        {ranking}
      </div>
    </motion.section>
  );
};
