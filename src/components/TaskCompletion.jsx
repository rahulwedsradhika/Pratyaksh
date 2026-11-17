import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function TaskCompletion({ completed, total }) {
  const target = total ? Math.round(completed / total * 100) : 0;
  const [display, setDisplay] = useState(0);
  const current = useRef(0);
  const { readingPreferences } = useTheme();
  useEffect(() => {
    if (readingPreferences.reduceMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      current.current = target;
      setDisplay(target);
      return;
    }
    const from = current.current;
    const start = performance.now();
    let frame;
    function tick(now) {
      const fraction = Math.min(1, (now - start) / 650);
      current.current = from + (target - from) * (1 - (1 - fraction) ** 3);
      setDisplay(current.current);
      if (fraction < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, readingPreferences.reduceMotion]);
  const circumference = 2 * Math.PI * 31;
  return <div className={`task-completion ${target === 100 ? 'all-complete' : ''}`}>
    <div className="task-completion-ring" role="progressbar" aria-label="Study target completion" aria-valuenow={target} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${completed} of ${total} tasks complete`}>
      <svg viewBox="0 0 76 76" aria-hidden="true"><circle className="task-ring-track" cx="38" cy="38" r="31"/><circle className="task-ring-value" cx="38" cy="38" r="31" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - display / 100)}/></svg>
      <strong aria-hidden="true">{Math.round(display)}<small>%</small></strong>
    </div>
    <div><span className="task-completion-caption">YOUR MOMENTUM</span><h2>{target === 100 ? 'All targets complete' : 'One step at a time'}</h2><p>{completed} of {total} targets completed</p></div>
  </div>;
}
