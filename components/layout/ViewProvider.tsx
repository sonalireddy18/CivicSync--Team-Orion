"use client";

import { createContext, useContext, useState } from "react";

export type View = "citizen" | "authority";

const ViewContext = createContext<{
  view: View;
  setView: (v: View) => void;
}>({ view: "citizen", setView: () => {} });

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View>("citizen");
  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  );
}

export const useView = () => useContext(ViewContext);
