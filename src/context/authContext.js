import { createContext } from 'react';

/**
 * AuthContext - Stores authentication state
 * Used with useAuth hook to access auth data throughout the app
 */
const authContext = createContext();

export default authContext;