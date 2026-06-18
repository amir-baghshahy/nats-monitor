import { AlertCircle } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

export function PageLoading({ text = 'Loading data...' }: { text?: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4 md:p-8">
      <div className="card flex w-full max-w-lg flex-col items-center justify-center py-16">
        <LoadingSpinner size="large" text={text} />
      </div>
    </div>
  )
}

export function PageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4 md:p-8">
      <div className="card w-full max-w-2xl border-status-error/50 bg-status-error/10 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-status-error/15 text-status-error ring-1 ring-status-error/30">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-dark-text">Unable to load data</h2>
            <p className="mt-2 text-sm leading-6 text-dark-muted">{message}</p>
            {onRetry && (
              <button onClick={onRetry} className="btn-secondary mt-5">
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
