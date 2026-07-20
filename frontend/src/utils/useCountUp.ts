import { useState, useEffect, useRef } from 'react'

/**
 * A hook that animates a number from 0 to the target value.
 * Uses requestAnimationFrame with easeOutCubic easing for smooth animation.
 *
 * @param target - The target number to animate to
 * @param duration - Animation duration in milliseconds (default 800)
 * @param enabled - Whether the animation should play (default true)
 * @returns The current animated value
 */
export function useCountUp(target: number, duration = 800, enabled = true): number {
  const [current, setCurrent] = useState(0)
  const previousTargetRef = useRef(0)
  const frameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const startValueRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) {
      setCurrent(target)
      return
    }

    const startValue = previousTargetRef.current

    // If target equals startValue, just set it immediately (no animation needed)
    if (target === startValue) {
      setCurrent(target)
      return
    }
    startValueRef.current = startValue
    startTimeRef.current = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // easeOutCubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - progress, 3)

      const value = startValue + (target - startValue) * eased
      setCurrent(value)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    previousTargetRef.current = target

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [target, duration, enabled])

  return current
}

/**
 * A hook that formats a number using a given formatter function
 * and applies the count-up animation to the formatted result.
 * The display shows the animated number formatted correctly.
 *
 * @param target - The target number
 * @param formatter - A function that takes a number and returns a formatted string
 * @param duration - Animation duration in ms
 * @param enabled - Whether animation is enabled
 * @returns The formatted string of the animated value
 */
export function useFormattedCountUp(
  target: number,
  formatter: (value: number) => string,
  duration = 800,
  enabled = true
): string {
  const animatedValue = useCountUp(target, duration, enabled)
  return formatter(animatedValue)
}
