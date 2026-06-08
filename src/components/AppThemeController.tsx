'use client';

import { useEffect } from 'react';

const THEME_KEY = 'starrabbit-theme';

export type AppTheme = 'default' | 'excel' | 'field' | 'moon';

export function applyAppTheme(theme: AppTheme) {
  document.documentElement.dataset.appTheme = theme;
  window.localStorage.setItem(THEME_KEY, theme);
}

export function readAppTheme(): AppTheme {
  const value = window.localStorage.getItem(THEME_KEY);
  return value === 'excel' || value === 'field' || value === 'moon' ? value : 'default';
}

export default function AppThemeController() {
  useEffect(() => {
    applyAppTheme(readAppTheme());
  }, []);

  return null;
}
