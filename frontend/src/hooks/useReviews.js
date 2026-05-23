import { useState, useEffect, useCallback } from 'react'
import { fetchReviews } from '../services/api'

export function useReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchReviews()
      setReviews(data)
      setError(null)
    } catch (err) {
      setError('Failed to load reviews. Is the backend running?')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { reviews, loading, error, reload: load }
}
