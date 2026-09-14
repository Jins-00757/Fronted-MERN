import { createContext } from 'react';

/**
 * ThemeContext - Stores the current light/dark theme
 * Used with useTheme hook to access and toggle theme throughout the app
 */
const themeContext = createContext();

export default themeContext;
