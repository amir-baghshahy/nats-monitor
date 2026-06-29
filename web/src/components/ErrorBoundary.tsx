import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

const translations: Record<string, Record<string, string>> = {
  en: {
    somethingWentWrong: "Something went wrong",
    unexpectedError: "An unexpected error occurred",
    tryAgain: "Try again"
  },
  fa: {
    somethingWentWrong: "مشکلی پیش آمد",
    unexpectedError: "خطای غیرمنتظره‌ای رخ داد",
    tryAgain: "تلاش مجدد"
  },
  fr: {
    somethingWentWrong: "Une erreur est survenue",
    unexpectedError: "Une erreur inattendue s'est produite",
    tryAgain: "Réessayer"
  },
  de: {
    somethingWentWrong: "Etwas ist schiefgelaufen",
    unexpectedError: "Ein unerwarteter Fehler ist aufgetreten",
    tryAgain: "Erneut versuchen"
  },
  tr: {
    somethingWentWrong: "Bir şeyler yanlış gitti",
    unexpectedError: "Beklenmeyen bir hata oluştu",
    tryAgain: "Tekrar dene"
  },
  ar: {
    somethingWentWrong: "حدث خطأ ما",
    unexpectedError: "حدث خطأ غير متوقع",
    tryAgain: "حاول مرة أخرى"
  }
};

function getLang(): string {
  return document.documentElement.lang || 'en';
}

function t(key: string): string {
  const lang = getLang();
  return translations[lang]?.[key] || translations.en[key] || key;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="card text-center max-w-md">
            <div className="text-red-400 text-4xl mb-4">!</div>
            <h2 className="text-lg font-semibold mb-2">{t('somethingWentWrong')}</h2>
            <p className="text-dark-muted text-sm mb-4">
              {this.state.error?.message || t('unexpectedError')}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary"
            >
              {t('tryAgain')}
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export { ErrorBoundary }
