import { useAuth } from "../features/auth/AuthContext";

export const useTheme = () => {
  const { theme, setTheme, toggleTheme } = useAuth();

  return {
    theme,
    isDark: theme === "dark",
    isLight: theme === "light",
    setTheme,
    toggleTheme,
  };
};
