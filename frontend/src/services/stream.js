const BASE_URL = import.meta.env.VITE_API_URL

export function subscribeToStream(onNewReview) {
  let es
  let retryTimeout

  function connect() {
    es = new EventSource(`${BASE_URL}/stream`)
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'new_review') onNewReview(data.review_id)
      } catch (_) {}
    }
    es.onerror = () => {
      es.close()
      retryTimeout = setTimeout(connect, 3000)
    }
  }

  connect()
  return () => {
    clearTimeout(retryTimeout)
    es?.close()
  }
}
