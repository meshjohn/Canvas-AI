# Canvas AI 🎨🧠

An interactive, AI-powered infinite canvas workspace designed for visual thinking, intelligent content generation, and dynamic workflow mapping.

**Canvas AI** bridges the gap between structured prompting and spatial creativity, allowing users to draw, organize, generate, and manipulate ideas directly on an open-ended visual workspace.

---

## 🚀 Features

### Infinite Spatial Canvas
- Smooth pan and zoom interactions
- Multi-select object handling
- Large-scale workflow support without spatial limitations
- Optimized navigation for complex scenes and diagrams

### Intelligent AI Generation
- Context-aware text-to-image generation
- AI-powered text-to-layer and component rendering
- Direct AI interaction inside the canvas workspace
- Real-time object insertion and scene mutation

### Vector & Sketch Tools
- Vector primitives including:
  - Rectangles
  - Ellipses
  - Paths
  - Connectors
- Responsive freehand sketching tools
- Precision editing and transformation controls

### Dynamic Chat Panel
- Floating or dockable AI assistant interface
- Streaming AI responses
- Context-aware canvas interaction
- Ability to create or modify canvas elements through chat commands

### Global Hotkeys & Layout System
- Keyboard shortcuts for productivity workflows
- Layer arrangement and alignment controls
- Object transformation utilities
- Fast export and workspace management actions

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js (App Router) | Application framework |
| React | UI rendering |
| Fabric.js / ReactFlow / HTML5 Canvas API | Canvas rendering engine |
| Zustand | High-frequency state management |
| Tailwind CSS | Styling system |
| Radix UI / shadcn/ui | Accessible UI components |
| Lucide React | Icon system |

---

### Backend & AI Orchestration

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Next.js API Routes | API layer |
| FastAPI (Python) | AI orchestration services |
| Vercel AI SDK | Streaming AI integration |
| OpenAI SDK | GPT model integration |
| Anthropic SDK | Claude model integration |

#### Supported Models
- GPT-4o
- Claude 3.5 Sonnet
- Stable Diffusion
- Midjourney API

---

## 📦 Installation & Setup

### Prerequisites

Make sure the following are installed:

- Node.js `v18+`
- npm, pnpm, or yarn

---

### 1. Clone the Repository

```bash
git clone https://github.com/meshjohn/Canvas-AI.git
cd Canvas-AI
```

---

### 2. Install Dependencies

```bash
npm install
```

or

```bash
pnpm install
```

---

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# AI Provider Credentials
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 4. Start the Development Server

```bash
npm run dev
```

or

```bash
pnpm run dev
```

---

## 🗺️ Project Architecture

```bash
├── app/
│   ├── api/chat/
│   └── page.tsx

├── components/
│   ├── canvas/
│   ├── chat/
│   └── ui/

├── hooks/
│   ├── useCanvas.ts
│   └── useKeybinds.ts

├── lib/
│   └── Vector utilities, helpers, and API configurations

└── store/
    └── Zustand global states
```

---

## 📁 Directory Breakdown

| Directory | Description |
|---|---|
| `app/` | Next.js App Router pages and API routes |
| `components/canvas/` | Core canvas engine and rendering logic |
| `components/chat/` | AI chat panels and streaming interfaces |
| `components/ui/` | Shared UI components |
| `hooks/` | Custom React hooks |
| `lib/` | Utility functions and AI configuration |
| `store/` | Global Zustand stores for layers and scene state |

---

## 🎯 Vision

Canvas AI is designed to become a next-generation creative operating system where:
- AI collaborates visually with users
- Ideas become interactive spatial systems
- Design, thinking, and generation happen in one unified environment

It combines the flexibility of infinite whiteboards with the intelligence of modern AI models to create a highly interactive creative workflow experience.
