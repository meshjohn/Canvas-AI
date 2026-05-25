# Canvas AI 🎨🧠

An interactive, AI-powered infinite canvas workspace designed for visual thinking, dynamic asset generation, and intelligent workflow mapping. `Canvas AI` bridges the gap between structured text prompting and spatial design, letting you build, draw, and generate concepts on an open whiteboard.

---

## 🚀 Features

*   **Infinite Spatial Canvas:** Smooth pan, zoom, and multi-select mechanics to handle massive, complex workflows without spatial constraints.
*   **Intelligent AI Generation:** Contextual text-to-image, text-to-layer, and text-to-component rendering built directly into the canvas interface.
*   **Vector & Sketch Tools:** Rich vector primitives (rectangles, ellipses, paths) alongside responsive freehand drawing tools.
*   **Dynamic Chat Panel:** A floating or dockable chat interface with streaming AI responses that can actively mutate or insert objects onto your canvas view.
*   **Global Hotkeys & Layouts:** Production-grade shortcuts for object transformations, layer arrangements, and immediate export capabilities.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** Next.js (App Router) / React
*   **Canvas Rendering:** Fabric.js / ReactFlow / HTML5 Canvas API
*   **State Management:** Zustand (for high-frequency spatial tracking)
*   **Styling & UI:** Tailwind CSS + Radix UI / shadcn/ui
*   **Icons:** Lucide React

### Backend & AI Orchestration
*   **Runtime:** Node.js (Next.js API Routes) / FastAPI (Python)
*   **AI SDK:** Vercel AI SDK / OpenAI & Anthropic SDKs
*   **Models Supported:** GPT-4o, Claude 3.5 Sonnet, Stable Diffusion / Midjourney API

---

## 📦 Installation & Setup

### Prerequisites
Make sure you have **Node.js (v18+)** and your favorite package manager installed (`npm`, `pnpm`, or `yarn`).

### 1. Clone the Repository
```bash
git clone [https://github.com/meshjohn/Canvas-AI.git](https://github.com/meshjohn/Canvas-AI.git)
```
cd Canvas-AI

Bash
npm install
# or
pnpm install

Code snippet
# AI Provider Credentials
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Next.js Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000

npm run dev
# or
pnpm run dev

🗺️ Project Architecture

├── app/                  # Next.js App Router (Pages & API routes)
│   ├── api/chat/         # Streaming AI backend controller
│   └── page.tsx          # Main entrypoint housing the workspace wrapper
├── components/           # Reusable UI Blocks
│   ├── canvas/           # Canvas render engine, coordinate loops, grid overlays
│   ├── chat/             # Chat interface panels and message streams
│   └── ui/               # Primary components (buttons, dialogs, sliders)
├── hooks/                # Custom React hooks (useCanvas, useKeybinds)
├── lib/                  # Vector utilities, mathematical helpers, and API configs
└── store/                # Global Zustand states for layer and scene nodes
