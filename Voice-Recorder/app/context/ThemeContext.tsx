import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof darkColors;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "APP_THEME";

export const darkColors = {
  background: "#000",
  card: "#373738ff",
  text: "#fff",
  subText: "#9e9e9e",
  accent: "#e53935",
  icon: "#fff",
  input: "#373738ff",
  modal: "#d6cdcdff",
};

export const lightColors = {
  background: "#f2f2f2",
  card: "#fff",
  text: "#000",
  subText: "#666",
  accent: "#e53935",
  icon: "#000",
  input: "#e5e5e5",
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
      }
    });
  }, []);

  const toggleTheme = async () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
