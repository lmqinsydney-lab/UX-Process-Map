/** 资源解析：单文件分发时从内联的 __ASSETS__ 映射取 data URI，否则走常规路径 */
declare global {
  interface Window {
    __ASSETS__?: Record<string, string>
  }
}

const BASE: string = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'

export const asset = (path: string): string => window.__ASSETS__?.[path] ?? BASE + path
