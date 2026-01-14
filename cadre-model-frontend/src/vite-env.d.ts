/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 运行时配置类型声明
declare global {
  interface Window {
    config?: {
      API_BASE_URL: string;
    };
  }
}

export {};
