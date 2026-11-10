import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

const api = axios.create({ baseURL: BASE_URL, timeout: 30_000 })

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Halaman yang butuh login — sesi kedaluwarsa (401) di sini → kembali ke /login.
const PROTECTED_PATHS = [
  '/dashboard',
  '/orders',
  '/profile',
  '/collector',
  '/admin',
  '/notifications',
  '/eco',
]

let redirecting = false

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const hadToken = !!err.config?.headers?.Authorization
    if (err.response?.status === 401 && hadToken && typeof window !== 'undefined' && !redirecting) {
      // Token ditolak server (kedaluwarsa / user dihapus) → bersihkan sesi
      // SEPENUHNYA (token + user + socket), bukan cuma token seperti dulu —
      // sisa 'user' di localStorage membuat UI tetap merasa login.
      const { useAuthStore } = await import('@/store/authStore')
      useAuthStore.getState().logout()

      const { pathname, search } = window.location
      const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
      if (isProtected) {
        redirecting = true
        const next = encodeURIComponent(pathname + search)
        window.location.href = `/login?expired=1&next=${next}`
      }
    }
    return Promise.reject(err)
  }
)

export default api
