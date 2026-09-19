"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getRole } from "@/lib/roles";

const STORAGE_KEY = "comanda_role";

const RoleContext = createContext({
  roleId: null,
  role: null,
  loaded: false,
  setRoleId: () => {},
  clearRole: () => {},
});

export function RoleProvider({ children }) {
  const [roleId, setRoleIdState] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setRoleIdState(saved);
    setLoaded(true);
  }, []);

  function setRoleId(id) {
    setRoleIdState(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }

  function clearRole() {
    setRoleIdState(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <RoleContext.Provider value={{ roleId, role: getRole(roleId), loaded, setRoleId, clearRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
