import { createContext, useContext, useEffect, useState } from "react";

import Dialog from ".";
import { useSearchParams } from "react-router-dom";

export const DialogContext = createContext();

export const DialogProvider = ({ children }) => {
  const [dialogContent, setDialogContent] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const dialogParam = searchParams.get("dialog");

  const openDialog = (content) => {
    setDialogContent(() => content);
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      sp.set("dialog", "custom");
      return sp;
    });
  };
  const closeDialog = () => {
    document.body.style = null;
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("dialog");
        return sp;
      },
      { replace: true },
    );
    setDialogContent(null);
  };

  useEffect(() => {
    if (!dialogParam) {
      closeDialog();
    }
  }, [dialogParam]);

  useEffect(() => {
    if (!dialogContent && dialogParam) {
      closeDialog();
    }
  }, [dialogContent, dialogParam]);
  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      {dialogContent && (
        <Dialog isOpened setIsOpened={closeDialog}>
          {dialogContent}
        </Dialog>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => useContext(DialogContext);
