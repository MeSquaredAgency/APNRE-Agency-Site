import { createContext, useContext } from 'react';

// The current page's path (e.g. '/selling/'). Provided by both entries:
// src/main.tsx in the browser and src/server.tsx at build time, so
// components never read window.location while rendering. That keeps the
// pre-rendered HTML and the browser's first render identical, which
// hydration needs. Anything that depends on the query string or storage
// reads it in an effect instead.
export const PathContext = createContext('/');

export const usePath = () => useContext(PathContext);
