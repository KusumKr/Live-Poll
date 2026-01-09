import { useEffect, useState, useRef } from 'react';

export function usePollTimer(remainingTime: number | null, isActive: boolean) {
  const [timeLeft, setTimeLeft] = useState<number>(remainingTime || 0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (remainingTime !== null) {
      setTimeLeft(remainingTime);
    }
  }, [remainingTime]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              window.clearInterval(intervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return {
    timeLeft,
    minutes,
    seconds,
    formatted: `${minutes} mins, ${seconds} secs`
  };
}
