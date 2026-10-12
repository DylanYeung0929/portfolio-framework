import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Route } from '../types'

gsap.registerPlugin(ScrollTrigger)

// 供组件主动发起平滑滚动（如回到顶部）
let activeLenis: Lenis | null = null
export const getLenis = () => activeLenis

/** 全站平滑滚动（Lenis）；路由切换时回到顶部。 */
export function useSmoothScroll(route: Route) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({ anchors: true, lerp: 0.085, smoothWheel: true })
    const update = (time: number) => lenis.raf(time * 1000)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    lenisRef.current = lenis
    activeLenis = lenis
    return () => {
      gsap.ticker.remove(update)
      lenis.destroy()
      lenisRef.current = null
      activeLenis = null
    }
  }, [])

  useEffect(() => {
    const lenis = lenisRef.current
    if (!lenis) return
    lenis.scrollTo(0, { immediate: true })
  }, [route])
}
