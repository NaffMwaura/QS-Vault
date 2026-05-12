import { useEffect, useState } from "react";

/**
 * useOnlineStatus: The system's "Heartbeat" monitor.
 * Detects instantly when the site signal drops or restores.
 */
export const useOnlineStatus = () => {
  // Initialize with current browser state
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    // Handler pulls directly from the navigator for precision
    const handleStatusChange = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);

  return isOnline;
};