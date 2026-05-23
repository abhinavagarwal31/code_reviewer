import { useEffect } from 'react'
import { subscribeToStream } from '../services/stream'

export function useStream(onNewReview) {
  useEffect(() => {
    const unsubscribe = subscribeToStream(onNewReview)
    return unsubscribe
  }, [onNewReview])
}
