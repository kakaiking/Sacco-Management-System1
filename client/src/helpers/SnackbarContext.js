import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";

const SnackbarContext = createContext({ showMessage: () => {} });

export function useSnackbar() {
  return useContext(SnackbarContext);
}

export function SnackbarProvider({ children }) {
  const [snack, setSnack] = useState({ open: false, message: "", type: "info" });

  const showMessage = useCallback((message, type = "info") => {
    setSnack({ open: true, message, type });
  }, []);

  useEffect(() => {
    if (!snack.open) return;
    const t = setTimeout(() => setSnack(s => ({ ...s, open: false })), 3000);
    return () => clearTimeout(t);
  }, [snack.open]);

  const value = useMemo(() => ({ showMessage }), [showMessage]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      {snack.open && (
        <div className={`snackbar snackbar--${snack.type}`} role="status" aria-live="polite">
          {snack.message}
        </div>
      )}
    </SnackbarContext.Provider>
  );
}


