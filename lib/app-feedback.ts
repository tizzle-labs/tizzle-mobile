import { Colors } from '@/constants/colors'
import Snackbar from 'react-native-snackbar'

export interface AppErrorDetails {
  title: string
  message: string
}

function extractBackendMessage(error: any): string | null {
  const payload = error?.response?.data
  const message = payload?.message

  if (Array.isArray(message) && message.length > 0) return message.join(', ')
  if (typeof message === 'string' && message.trim()) return message
  return null
}

export function describeAppError(error: any, fallbackTitle: string, fallbackMessage: string): AppErrorDetails {
  const backendMessage = extractBackendMessage(error)
  const message = String(error?.message ?? '')
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('reject') ||
    normalizedMessage.includes('cancel') ||
    normalizedMessage.includes('declin')
  ) {
    return {
      title: 'Request Cancelled',
      message: 'You dismissed the wallet request before it was confirmed.',
    }
  }

  if (
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('failed to fetch') ||
    !error?.response
  ) {
    return {
      title: 'Network Problem',
      message: backendMessage ?? 'Please check your connection and try again.',
    }
  }

  if (
    normalizedMessage.includes('insufficient') ||
    normalizedMessage.includes('balance') ||
    normalizedMessage.includes('funds') ||
    normalizedMessage.includes('lamports')
  ) {
    return {
      title: 'Insufficient Balance',
      message: backendMessage ?? 'Your wallet does not have enough funds to finish this action.',
    }
  }

  if (backendMessage) {
    return {
      title: 'Action Failed',
      message: backendMessage,
    }
  }

  return {
    title: fallbackTitle,
    message: fallbackMessage,
  }
}

export function showErrorFeedback(error: any, fallbackTitle: string, fallbackMessage: string) {
  const details = describeAppError(error, fallbackTitle, fallbackMessage)
  Snackbar.show({
    text: `${details.title}: ${details.message}`,
    duration: Snackbar.LENGTH_LONG,
    backgroundColor: Colors.error,
  })
}
