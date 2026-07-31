import { useEffect, useRef, useState } from 'react';
import { useAva } from '@/contexts/AvaContext';

interface UseStruggleDetectionProps {
  taskId: string;
  maxAttempts?: number;
  maxTimeSeconds?: number;
  context?: any;
}

export function useStruggleDetection({
  taskId,
  maxAttempts = 2,
  maxTimeSeconds = 60,
  context
}: UseStruggleDetectionProps) {
  const [attempts, setAttempts] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const hasTriggeredRef = useRef(false);
  const { triggerAva } = useAva();

  // Reset timer on task change
  useEffect(() => {
    startTimeRef.current = Date.now();
    setAttempts(0);
    hasTriggeredRef.current = false;
  }, [taskId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasTriggeredRef.current) return;
      
      const secondsPassed = (Date.now() - startTimeRef.current) / 1000;
      if (secondsPassed > maxTimeSeconds) {
        hasTriggeredRef.current = true;
        triggerAva("struggling", context);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [maxTimeSeconds, triggerAva, context]);

  const recordAttempt = () => {
    setAttempts((prev) => {
      const newAttempts = prev + 1;
      if (newAttempts > maxAttempts && !hasTriggeredRef.current) {
         hasTriggeredRef.current = true;
         triggerAva("struggling", context);
      }
      return newAttempts;
    });
  };

  const resetDetection = () => {
     startTimeRef.current = Date.now();
     setAttempts(0);
     hasTriggeredRef.current = false;
  };

  return { attempts, recordAttempt, resetDetection };
}
