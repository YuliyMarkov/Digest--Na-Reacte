import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const GA_MEASUREMENT_ID = "G-8HQBTTVPD4";

export default function AnalyticsTracker() {
  const location = useLocation();
  const previousUrlRef = useRef(document.referrer || "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    const pageLocation = window.location.href;
    const pagePath = `${location.pathname}${location.search}${location.hash}`;
    const pageTitle = document.title;
    const pageReferrer = previousUrlRef.current;

    window.gtag("event", "page_view", {
      send_to: GA_MEASUREMENT_ID,
      page_title: pageTitle,
      page_location: pageLocation,
      page_path: pagePath,
      page_referrer: pageReferrer,
    });

    previousUrlRef.current = pageLocation;
  }, [location]);

  return null;
}