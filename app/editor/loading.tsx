import { Loader2 } from "lucide-react"

export default function EditorHomeLoading() {
  return (
    <div className="flex h-screen w-screen flex-col bg-[#080809] text-[#f0f0f4]">
      {/* Top Navbar Skeleton */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#2a2a30] bg-[#111114]/85 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-6 w-20 animate-pulse rounded-lg bg-[#2a2a30]" />
        </div>
        <div className="h-8 w-8 animate-pulse rounded-full bg-[#2a2a30]" />
      </header>

      {/* Main Workspace Skeleton */}
      <main className="flex flex-1 flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#00c8d4]/5 blur-[80px]" />
        
        <div className="z-10 flex flex-col items-center max-w-md w-full text-center space-y-6">
          {/* Pulsing AI Bot Icon */}
          <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl border border-[#2a2a30] bg-[#111114]/90 shadow-[0_0_25px_-5px_rgba(0,200,212,0.15)] animate-bounce">
            <Loader2 className="h-8 w-8 animate-spin text-[#00c8d4]" />
            <div className="absolute inset-0 rounded-2xl border border-[#00c8d4]/30 animate-pulse" />
          </div>

          <div className="space-y-2 w-full">
            <div className="h-6 w-48 mx-auto animate-pulse rounded-lg bg-[#2a2a30]" />
            <div className="h-4 w-72 mx-auto animate-pulse rounded-md bg-[#2a2a30]/60" />
          </div>

          {/* Project List Skeleton Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">
            <div className="h-20 animate-pulse rounded-2xl border border-[#2a2a30] bg-[#111114]/50" />
            <div className="h-20 animate-pulse rounded-2xl border border-[#2a2a30] bg-[#111114]/50" />
          </div>
        </div>
      </main>
    </div>
  )
}
