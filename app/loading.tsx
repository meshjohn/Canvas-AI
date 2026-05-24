import { Loader2 } from "lucide-react"

export default function RootLoading() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#080809] text-[#f0f0f4] relative overflow-hidden">
      {/* Ambient glowing backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#00c8d4]/5 blur-[90px] pointer-events-none" />

      <div className="z-10 flex flex-col items-center space-y-4">
        {/* Pulsing visual container */}
        <div className="relative flex items-center justify-center h-14 w-14 rounded-2xl border border-[#2a2a30] bg-[#111114]/90 shadow-[0_0_20px_rgba(0,200,212,0.1)]">
          <Loader2 className="h-6 w-6 animate-spin text-[#00c8d4]" />
          <div className="absolute inset-0 rounded-2xl border border-[#00c8d4]/20 animate-ping opacity-75" />
        </div>
        
        <div className="space-y-1 text-center">
          <h2 className="text-sm font-medium text-[#f0f0f4] tracking-wide uppercase">Ghost AI</h2>
          <p className="text-xs text-[#808090] animate-pulse">Initializing secure session...</p>
        </div>
      </div>
    </div>
  )
}
