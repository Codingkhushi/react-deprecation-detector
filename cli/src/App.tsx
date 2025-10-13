import './App.css'

function App() {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white px-6 py-16 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
          React Deprecation Detector
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed">
          ⚡ Instantly detect and fix deprecated React APIs across your entire codebase.  
          Upgrade confidently to React 19 and beyond — no manual hunt required.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#"
            className="px-6 py-3 rounded-2xl border border-gray-600 hover:bg-gray-800 transition font-semibold"
          >
            View GitHub Repo
          </a>
        </div>

        <div className="mt-14 text-sm text-gray-500">
          <p>Built for React developers who want clean, future-proof code ✨</p>
        </div>
      </div>
    </div>
  )
}

export default App
