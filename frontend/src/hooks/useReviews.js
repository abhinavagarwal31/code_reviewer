import { useState, useEffect, useCallback } from 'react'
import { fetchReviews } from '../services/api'

export function useReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await fetchReviews()
      setReviews(data)
    } catch (_) {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return { reviews, loading, reload: load }
}
