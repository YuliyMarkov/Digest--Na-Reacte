import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LanguageContext } from "./languageContext";

export function LanguageProvider({ children }) {
  const location = useLocation();

  const getLanguageFromPath = (pathname) => {
    const firstSegment = pathname.split("/")[1];

    if (firstSegment === "ru" || firstSegment === "uz") {
      return firstSegment;
    }

    return null;
  };

  const [storedLanguage, setStoredLanguage] = useState(() => {
    return localStorage.getItem("site-language") || "ru";
  });

  const pathLanguage = getLanguageFromPath(location.pathname);
  const language = pathLanguage || storedLanguage;

  useEffect(() => {
    localStorage.setItem("site-language", language);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: setStoredLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}