import { useState } from 'react'
import Link from 'next/link'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../lib/authContext'
import { useRouter } from 'next/router'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // If already logged in, redirect to dashboard
  if (user) {
    router.push('/dashboard')
    return null
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('Signing in...')

    try {
      await signInWithEmailAndPassword(auth, email, password)
      setMessage('Signed in! Redirecting...')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } catch (err: any) {
      setMessage(err.message || 'Error signing in')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Sign in</h2>
        <p className="text-sm text-gray-600 mb-6">Welcome back! Sign in to your account</p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        {message && <p className="mt-3 text-sm text-gray-700 text-center">{message}</p>}

        <p className="mt-4 text-sm text-gray-600 text-center">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>

        <p className="mt-4 text-sm text-gray-600 text-center">
          Back to <Link href="/" className="text-blue-600 hover:underline">home</Link>
        </p>
      </form>
    </div>
  )
}
