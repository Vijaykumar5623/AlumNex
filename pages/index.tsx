import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-semibold mb-4">Alumni Management — Prototype</h1>
        <p className="mb-6 text-sm text-gray-600">Starter scaffold: Next.js + Tailwind + Firebase (place your Firebase config in <code>lib/firebase.ts</code>).</p>
        <div className="flex gap-3">
          <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded">
            Sign up
          </Link>
          <Link href="/admin" className="px-4 py-2 border rounded">
            Admin (stub)
          </Link>
        </div>
      </div>
    </div>
  )
}
