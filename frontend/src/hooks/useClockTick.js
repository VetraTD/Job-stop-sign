import { useEffect, useState } from 'react'

/** Bumps on an interval so day-based UI (health, “days ago”) stays current without user interaction. */
export function useClockTick(intervalMs = 60_000) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const bump = () => setTick((n) => n + 1)
    const id = window.setInterval(bump, intervalMs)
    const onVis = () => {
      if (document.visibilityState === 'visible') bump()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [intervalMs])
  return tick
}
