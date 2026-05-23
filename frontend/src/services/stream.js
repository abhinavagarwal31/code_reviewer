const BASE_URL = import.meta.env.VITE_API_URL

export function subscribeToStream(onNewReview) {
  const es = new EventSource(`${BASE_URL}/stream`)
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data)
      if (data.type === 'new_review') onNewReview(data.review_id)
    } catch (_) {}
  }
  return () => es.close()
}
