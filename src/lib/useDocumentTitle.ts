import { useEffect } from "react";

const APP_NAME = "RenoSwiss";

export const useDocumentTitle = (title?: string): void => {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} — Home Renovation, Simplified`;
  }, [title]);
};
