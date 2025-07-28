import { type NextRequest, NextResponse } from "next/server"
import { analysisOperations, sessionOperations } from "@/lib/database"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = sessionOperations.findById(sessionId)
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const analyses = analysisOperations.getAll()

    return NextResponse.json(analyses)
  } catch (error) {
    console.error("Admin analyses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
