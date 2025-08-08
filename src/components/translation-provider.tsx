'use client';

import React from 'react';
import { TranslationContext, useTranslationHook } from '@/hooks/use-translation';

interface TranslationProviderProps {
  children: React.ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const translationValue = useTranslationHook();

  return (
    <TranslationContext.Provider value={translationValue}>
      {children}
    </TranslationContext.Provider>
  );
}