'use client';

import React, { useState, useCallback } from 'react';
import { syncFromRemote } from '@/lib/database';
import { motion, AnimatePresence } from 'framer-motion';

export const SyncButton: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

const handleSync = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await syncFromRemote();
      window.dispatchEvent(new CustomEvent('db-synced'));
      setShowCheck(true);
      setTimeout(() => setShowCheck(false), 2000);
    } catch (err) {
      console.error('Sync failed:', err);
      alert('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  return (
    <motion.button
      onClick={handleSync}
      disabled={isSyncing}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`fixed top-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
        isSyncing
          ? 'bg-primary/80 cursor-not-allowed'
          : showCheck
          ? 'bg-green-500'
          : 'bg-primary hover:shadow-xl hover:shadow-primary/30'
      }`}
      title="Sync from database"
    >
      <AnimatePresence mode="wait">
        {isSyncing ? (
          <motion.svg
            key="spinner"
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </motion.svg>
        ) : showCheck ? (
          <motion.svg
            key="check"
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        ) : (
          <motion.svg
            key="sync"
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            animate={{ rotate: 0 }}
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2h3.062M20 20v-5h-.582m-15.356-2H8.562A9.963 9.963 0 004 12c0 5.523 4.477 10 10 10s10-4.477 10-10-4.477-10-10-10z" />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
};