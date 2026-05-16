'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/common/PageContainer';
import { useTheme } from '@/hooks/useTheme';

type Colorway = 'blue' | 'emerald' | 'violet' | 'rose' | 'amber' | 'cyan';
type FontFamily = 'inter' | 'poppins' | 'roboto' | 'nunito' | 'system';
type FontSize = 'sm' | 'md' | 'lg';

const COLORWAYS: { id: Colorway; name: string; primary: string; secondary: string; swatch: string[] }[] = [
  { id: 'blue', name: 'Ocean', primary: '#2563eb', secondary: '#7c3aed', swatch: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'] },
  { id: 'emerald', name: 'Forest', primary: '#059669', secondary: '#0891b2', swatch: ['#059669', '#10b981', '#34d399', '#6ee7b7'] },
  { id: 'violet', name: 'Violet', primary: '#7c3aed', secondary: '#ec4899', swatch: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'] },
  { id: 'rose', name: 'Rose', primary: '#e11d48', secondary: '#f59e0b', swatch: ['#e11d48', '#f43f5e', '#fb7185', '#fda4af'] },
  { id: 'amber', name: 'Sunset', primary: '#d97706', secondary: '#dc2626', swatch: ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d'] },
  { id: 'cyan', name: 'Mint', primary: '#0891b2', secondary: '#0d9488', swatch: ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9'] },
];

const FONTS: { id: FontFamily; name: string; preview: string }[] = [
  { id: 'inter', name: 'Inter', preview: 'The quick brown fox' },
  { id: 'poppins', name: 'Poppins', preview: 'The quick brown fox' },
  { id: 'roboto', name: 'Roboto', preview: 'The quick brown fox' },
  { id: 'nunito', name: 'Nunito', preview: 'The quick brown fox' },
  { id: 'system', name: 'System', preview: 'The quick brown fox' },
];

const FONT_SIZES: { id: FontSize; name: string; size: string; value: number }[] = [
  { id: 'sm', name: 'Small', size: 'text-[13px]', value: 13 },
  { id: 'md', name: 'Medium', size: 'text-[14px]', value: 14 },
  { id: 'lg', name: 'Large', size: 'text-[16px]', value: 16 },
];

const STORAGE_KEY = '3jes-theme-prefs';

function getStoredPrefs() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function applyColorway(colorway: Colorway) {
  const root = document.documentElement;
  const colors: Record<Colorway, { primary: string; primaryLight: string; primaryDark: string; secondary: string }> = {
    blue: { primary: '#2563eb', primaryLight: '#3b82f6', primaryDark: '#1d4ed8', secondary: '#7c3aed' },
    emerald: { primary: '#059669', primaryLight: '#10b981', primaryDark: '#047857', secondary: '#0891b2' },
    violet: { primary: '#7c3aed', primaryLight: '#8b5cf6', primaryDark: '#6d28d9', secondary: '#ec4899' },
    rose: { primary: '#e11d48', primaryLight: '#f43f5e', primaryDark: '#be123c', secondary: '#f59e0b' },
    amber: { primary: '#d97706', primaryLight: '#f59e0b', primaryDark: '#b45309', secondary: '#dc2626' },
    cyan: { primary: '#0891b2', primaryLight: '#06b6d4', primaryDark: '#0e7490', secondary: '#0d9488' },
  };
  const c = colors[colorway];
  root.style.setProperty('--color-primary', c.primary);
  root.style.setProperty('--color-primary-light', c.primaryLight);
  root.style.setProperty('--color-primary-dark', c.primaryDark);
  root.style.setProperty('--color-secondary', c.secondary);
}

function applyFont(font: FontFamily) {
  const fonts: Record<FontFamily, string> = {
    inter: "'Inter', sans-serif",
    poppins: "'Poppins', sans-serif",
    roboto: "'Roboto', sans-serif",
    nunito: "'Nunito', sans-serif",
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };
  document.documentElement.style.setProperty('--font-family', fonts[font]);
  document.body.style.fontFamily = fonts[font];
}

function applyFontSize(size: FontSize) {
  const sizes: Record<FontSize, string> = { sm: '13px', md: '14px', lg: '16px' };
  document.documentElement.style.fontSize = sizes[size];
}

export const ThemeCustomizer: React.FC = () => {
  const { theme, setTheme, isSystem, setSystemPreference } = useTheme();
  const [colorway, setColorway] = useState<Colorway>(() => {
    const prefs = getStoredPrefs();
    return (prefs?.colorway as Colorway) || 'blue';
  });
  const [font, setFont] = useState<FontFamily>(() => {
    const prefs = getStoredPrefs();
    return (prefs?.font as FontFamily) || 'inter';
  });
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const prefs = getStoredPrefs();
    return (prefs?.fontSize as FontSize) || 'md';
  });

  useEffect(() => {
    applyColorway(colorway);
  }, [colorway]);

  useEffect(() => {
    applyFont(font);
  }, [font]);

  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  const savePrefs = (updates: Partial<{ colorway: Colorway; font: FontFamily; fontSize: FontSize }>) => {
    const prefs = { ...getStoredPrefs(), ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  };

  const handleColorwayChange = (cw: Colorway) => {
    setColorway(cw);
    savePrefs({ colorway: cw });
  };

  const handleFontChange = (f: FontFamily) => {
    setFont(f);
    savePrefs({ font: f });
  };

  const handleFontSizeChange = (fs: FontSize) => {
    setFontSize(fs);
    savePrefs({ fontSize: fs });
  };

  return (
    <div className="space-y-6">
      {/* Appearance Mode */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-text">Appearance</h3>
            <p className="text-xs text-text-muted">Light or dark mode</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
              theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
            }`}
          >
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-medium text-text">Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
              theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
            }`}
          >
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span className="text-sm font-medium text-text">Dark</span>
          </button>
        </div>

        <label className="flex items-center gap-2 mt-3 cursor-pointer">
          <input type="checkbox" checked={isSystem} onChange={(e) => setSystemPreference(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
          <span className="text-xs text-text-muted">Follow system preference</span>
        </label>
      </Card>

      {/* Colorways */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-violet-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-text">Colorway</h3>
            <p className="text-xs text-text-muted">Choose your accent colors</p>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {COLORWAYS.map((cw) => (
            <button
              key={cw.id}
              onClick={() => handleColorwayChange(cw.id)}
              className={`group relative rounded-xl p-3 border-2 transition-all ${
                colorway === cw.id ? 'border-primary shadow-md scale-105' : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex gap-0.5 mb-2">
                {cw.swatch.map((c, i) => (
                  <div key={i} className="w-full h-3 rounded-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-xs font-medium text-text block">{cw.name}</span>
              {colorway === cw.id && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Font Family */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-text">Font Family</h3>
            <p className="text-xs text-text-muted">Choose your typeface</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => handleFontChange(f.id)}
              className={`px-4 py-2.5 rounded-xl border-2 transition-all text-sm ${
                font === f.id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text hover:border-primary/30'
              }`}
              style={{ fontFamily: f.id === 'system' ? undefined : f.name }}
            >
              {f.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Font Size */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 16v-4m0 0h4m8-4h4m-4 0v12m0 0h4m-4-8V4m0 0h-4" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-text">Font Size</h3>
            <p className="text-xs text-text-muted">Adjust text size</p>
          </div>
        </div>

        <div className="flex gap-3">
          {FONT_SIZES.map((fs) => (
            <button
              key={fs.id}
              onClick={() => handleFontSizeChange(fs.id)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                fontSize === fs.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              }`}
            >
              <span className={`font-medium text-text block ${fs.size}`}>Aa</span>
              <span className="text-xs text-text-muted mt-1 block">{fs.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-text">Preview</h3>
            <p className="text-xs text-text-muted">See how it looks</p>
          </div>
        </div>

        <div className="rounded-xl bg-background-alt border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
              3J
            </div>
            <div>
              <p className="font-semibold text-text">Sample Card</p>
              <p className="text-xs text-text-muted">This is how your UI looks</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">Primary</span>
            <span className="px-3 py-1 rounded-lg bg-secondary/10 text-secondary text-xs font-medium">Secondary</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
