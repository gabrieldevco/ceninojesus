import '@testing-library/jest-dom/vitest'

// jsdom no implementa estas APIs del navegador que usan framer-motion y la navegación
class IntersectionObserverFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver = IntersectionObserverFalso as unknown as typeof IntersectionObserver
window.scrollTo = () => {}

// ScrollTrigger (GSAP) consulta matchMedia al registrarse
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia
