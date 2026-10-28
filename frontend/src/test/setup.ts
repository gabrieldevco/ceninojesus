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
