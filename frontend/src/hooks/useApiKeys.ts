import { useState, useEffect, useCallback } from "react"

export type Provider = "openai" | "gemini" | "groq" | "openrouter"

export interface ApiKeysState {
  openai: string
  gemini: string
  groq: string
  openrouter: string
}

const STORAGE_KEY = "api-keys"
const ACTIVE_PROVIDER_KEY = "active-provider"

const DEFAULT_KEYS: ApiKeysState = {
  openai: "",
  gemini: "",
  groq: "",
  openrouter: "",
}

export function openApiKeysModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-api-keys-modal"))
  }
}

export function useApiKeys() {
  const [apiKeys, setApiKeysState] = useState<ApiKeysState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...DEFAULT_KEYS, ...JSON.parse(stored) }
      }
    } catch {
      // fallback
    }
    return DEFAULT_KEYS
  })

  const [activeProvider, setActiveProviderState] = useState<Provider>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_PROVIDER_KEY)
      if (stored && ["openai", "gemini", "groq", "openrouter"].includes(stored)) {
        return stored as Provider
      }
    } catch {
      // fallback
    }
    return "openrouter"
  })

  const saveApiKeys = useCallback((newKeys: Partial<ApiKeysState>) => {
    setApiKeysState((prev) => {
      const merged = { ...prev, ...newKeys }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      window.dispatchEvent(new CustomEvent("api-keys-changed", { detail: merged }))
      return merged
    })
  }, [])

  const setActiveProvider = useCallback((prov: Provider) => {
    setActiveProviderState(prov)
    localStorage.setItem(ACTIVE_PROVIDER_KEY, prov)
    window.dispatchEvent(new CustomEvent("active-provider-changed", { detail: prov }))
  }, [])

  // Escuchar cambios de storage o eventos personalizados entre componentes
  useEffect(() => {
    const handleKeysChange = (e: Event) => {
      const custom = e as CustomEvent<ApiKeysState>
      if (custom.detail) {
        setApiKeysState(custom.detail)
      } else {
        try {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored) setApiKeysState({ ...DEFAULT_KEYS, ...JSON.parse(stored) })
        } catch {
          // ignore
        }
      }
    }

    const handleProviderChange = (e: Event) => {
      const custom = e as CustomEvent<Provider>
      if (custom.detail) {
        setActiveProviderState(custom.detail)
      } else {
        const stored = localStorage.getItem(ACTIVE_PROVIDER_KEY) as Provider
        if (stored) setActiveProviderState(stored)
      }
    }

    window.addEventListener("api-keys-changed", handleKeysChange)
    window.addEventListener("active-provider-changed", handleProviderChange)
    window.addEventListener("storage", handleKeysChange)

    return () => {
      window.removeEventListener("api-keys-changed", handleKeysChange)
      window.removeEventListener("active-provider-changed", handleProviderChange)
      window.removeEventListener("storage", handleKeysChange)
    }
  }, [])

  const configuredCount = Object.values(apiKeys).filter((k) => k && k.trim().length > 0).length

  return {
    apiKeys,
    activeProvider,
    saveApiKeys,
    setActiveProvider,
    configuredCount,
    hasActiveKey: Boolean(apiKeys[activeProvider]?.trim()),
  }
}
