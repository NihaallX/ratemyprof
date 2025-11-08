import { useEffect, useRef, useState } from 'react';

export default function FPSMeter() {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationFrame: number;

    function measureFPS() {
      frameCount.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime.current;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      animationFrame = requestAnimationFrame(measureFPS);
    }

    animationFrame = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const fpsColor =
    fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg font-mono text-sm">
      <span className="text-gray-400">FPS: </span>
      <span className={fpsColor + ' font-bold'}>{fps}</span>
    </div>
  );
}
