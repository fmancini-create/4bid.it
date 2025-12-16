// Type definitions for Google Analytics gtag
interface Window {
  dataLayer: any[]
  gtag?: (command: string, ...args: any[]) => void
}
