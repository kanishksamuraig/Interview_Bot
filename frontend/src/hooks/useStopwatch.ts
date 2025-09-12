// frontend/src/hooks/useStopwatch.ts
import { useState, useRef } from 'react';

export function useStopwatch() {
    const [time, setTime] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const start = () => {
        if (intervalRef.current) return;
        const startTime = Date.now() - time * 1000;
        intervalRef.current = setInterval(() => {
            setTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
    };

    const stop = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return time;
    };

    const reset = () => {
        stop();
        setTime(0);
    };

    return { time, start, stop, reset };
}