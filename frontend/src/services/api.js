import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL

export async function fetchReviews() {
  const res = await axios.get(`${BASE_URL}/reviews`)
  return res.data
}

export async function fetchReview(id) {
  const res = await axios.get(`${BASE_URL}/reviews/${id}`)
  return res.data
}

export async function clearDb() {
  const res = await axios.delete(`${BASE_URL}/admin/clear-db`)
  return res.data
}
