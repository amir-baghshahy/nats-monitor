// Export all from the generated API client
export * from '../generated/index'

// Add custom types that were previously defined
export type ConnectionStatus = {
  id: string
  name: string
  connected: boolean
  healthy: boolean
  latency?: string
  error?: string
  last_checked: string
}
