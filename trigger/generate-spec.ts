import { task } from "@trigger.dev/sdk/v3";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export const generateSpec = task({
  id: "generate-spec",
  retry: { maxAttempts: 2 },
  run: async (payload: {
    projectId: string;
    roomId: string;
    chatHistory: Array<{ role: string; content: string }>;
    nodes: Array<any>;
    edges: Array<any>;
  }) => {
    console.log("[SpecTask] Starting spec generation for project:", payload.projectId);

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });

    const systemPrompt = `You are Ghost AI, an expert system architect that writes comprehensive, professional, and clean technical architecture specifications.

Given a user's goal, the chat history of design choices, and the current canvas node-link diagram representing the architecture:
Your task is to generate a comprehensive, production-ready system design and technical specification document in Markdown.

The document MUST contain:
1. Executive Summary: High-level overview of the system, its objectives, and key requirements.
2. Architecture Diagram Description: A text-based breakdown of the component hierarchy, describing the role of each node and edge present in the canvas design.
3. Requests and Data Flows: Detailed step-by-step Request/Response or Event-Driven data flows across the systems.
4. Technical Stack & Rationale: Choices made for databases, servers, queues, caching, and external APIs based on the canvas nodes.
5. Security, Scaling, and Performance: Considerations for authentication, authorization, caching strategies, and load balancing.
6. Milestones and Phase-based Implementation Plan.

Format rules:
- Format cleanly in standard GitHub Markdown.
- Ensure proper headers, lists, tables, and bold highlights.
- Do NOT output HTML tags, wrappers, or any non-standard elements.
- Keep the tone highly professional, precise, and authoritative.`;

    const prompt = `Project ID: ${payload.projectId}
Room ID: ${payload.roomId}

Current Architecture Elements on Canvas:
Nodes:
${JSON.stringify(payload.nodes, null, 2)}

Edges (connections):
${JSON.stringify(payload.edges, null, 2)}

Design Chat & Context History:
${payload.chatHistory.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

Please generate the complete technical architecture specification document in Markdown.`;

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: prompt,
    });

    const markdownContent = result.text;
    console.log("[SpecTask] Spec content generated, length:", markdownContent.length);

    // Upload to Vercel Blob
    const timestamp = Date.now();
    const blobPath = `specs/${payload.projectId}/${timestamp}.md`;
    
    console.log("[SpecTask] Uploading spec to Vercel Blob:", blobPath);
    const blob = await put(blobPath, markdownContent, {
      access: "private",
      contentType: "text/markdown",
      addRandomSuffix: true,
    });

    console.log("[SpecTask] Uploaded to Blob URL:", blob.url);

    // Save spec metadata to database
    console.log("[SpecTask] Creating ProjectSpec record in database...");
    const specRecord = await prisma.projectSpec.create({
      data: {
        projectId: payload.projectId,
        filePath: blob.url,
      },
    });

    console.log("[SpecTask] ProjectSpec created with ID:", specRecord.id);

    return {
      success: true,
      specId: specRecord.id,
      spec: markdownContent,
    };
  },
});
