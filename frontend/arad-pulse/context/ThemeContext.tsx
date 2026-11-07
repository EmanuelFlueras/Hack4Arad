import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
  badge: string;
  inputBg: string;
}

export const lightTheme: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  subtext: '#64748B',
  border: '#E2E8F0',
  primary: '#DC2626',
  badge: '#ECFDF5',
  inputBg: '#F1F5F9',
};

export const darkTheme: ThemeColors = {
  background: '#0B0F19',
  card: '#161F30',
  text: '#F8FAFC',
  subtext: '#94A3B8',
  border: '#1E293B',
  primary: '#EF4444',
  badge: '#064E3B',
  inputBg: '#1E293B',
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightTheme,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(systemScheme === 'dark');

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);