'use client';

import { useEffect, useState } from 'react';

const SEEN_KEY = 'optinex-admin-tour-seen';

export function useTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) {
      setOpen(true);
    }
  }, []);

  const close = () => {
    setOpen(false);
    setStep(0);
    localStorage.setItem(SEEN_KEY, '1');
  };

  const start = () => {
    setStep(0);
    setOpen(true);
  };

  return { open, step, setStep, start, close };
}

export type TourState = ReturnType<typeof useTour>;
