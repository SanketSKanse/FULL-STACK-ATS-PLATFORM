import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'oatmeal',
  toggleTheme: () => { },
  isDark: false,
});

export function ThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove('dark', 'light');
    body.classList.remove('dark', 'light');
    root.setAttribute('data-theme', 'oatmeal');
    body.setAttribute('data-theme', 'oatmeal');
    try {
      localStorage.removeItem('ats_theme');
      localStorage.removeItem('theme');
    } catch (e) { }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'oatmeal', toggleTheme: () => { }, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return {
    theme: 'oatmeal',
    toggleTheme: () => { },
    isDark: false,
  };
}

export default useTheme;
