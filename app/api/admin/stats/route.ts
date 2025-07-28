import { type NextRequest, NextResponse } from "next/server"
import { userOperations, analysisOperations, sessionOperations } from "@/lib/database"
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

    const userStats = userOperations.getStats()
    const analysisStats = analysisOperations.getStats()

    return NextResponse.json({
      ...userStats,
      ...analysisStats,
      accuracyRate: 94.2, // Mock accuracy rate
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
