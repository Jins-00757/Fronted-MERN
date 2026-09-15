import { createContext } from 'react';

// Same bare-context + separate hook/provider split as authContext.js /
// themeContext.js, so react-refresh only flags component-exporting files.
export default createContext(null);
