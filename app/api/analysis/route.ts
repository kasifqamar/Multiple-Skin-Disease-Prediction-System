import { type NextRequest, NextResponse } from "next/server"
import { analysisOperations, sessionOperations } from "@/lib/database"
import { cookies } from "next/headers"
import { writeFile } from "fs/promises"
import path from "path"

const mockPredictions = [
  {
    disease: "Eczema (Atopic Dermatitis)",
    confidence: 87,
    description: "A chronic inflammatory skin condition characterized by dry, itchy, and inflamed skin patches.",
    symptoms: ["Dry, scaly skin", "Intense itching", "Red or brownish patches", "Small raised bumps"],
    medications: [
      { name: "Hydrocortisone Cream 1%", dosage: "Apply thin layer", frequency: "2-3 times daily" },
      { name: "Cetirizine", dosage: "10mg", frequency: "Once daily" },
      { name: "Moisturizing Lotion", dosage: "Liberal application", frequency: "Multiple times daily" },
    ],
    recommendations: [
      "Avoid known triggers and allergens",
      "Use fragrance-free moisturizers",
      "Take lukewarm baths with oatmeal",
      "Wear soft, breathable fabrics",
    ],
    severity: "Medium",
  },
  {
    disease: "Acne Vulgaris",
    confidence: 92,
    description: "A common skin condition that occurs when hair follicles become clogged with oil and dead skin cells.",
    symptoms: ["Blackheads", "Whiteheads", "Papules", "Pustules", "Cysts"],
    medications: [
      { name: "Benzoyl Peroxide 2.5%", dosage: "Apply to affected area", frequency: "Once daily" },
      { name: "Salicylic Acid Cleanser", dosage: "Use as directed", frequency: "Twice daily" },
      { name: "Adapalene Gel 0.1%", dosage: "Apply thin layer", frequency: "Once daily at bedtime" },
    ],
    recommendations: [
      "Wash face gently twice daily",
      "Avoid touching or picking at acne",
      "Use non-comedogenic products",
      "Maintain a consistent skincare routine",
    ],
    severity: "Low",
  },
  {
    disease: "Psoriasis",
    confidence: 78,
    description: "An autoimmune condition that causes rapid skin cell turnover, leading to thick, scaly patches.",
    symptoms: ["Thick, red patches", "Silvery scales", "Dry, cracked skin", "Itching and burning"],
    medications: [
      { name: "Topical Corticosteroids", dosage: "Apply as directed", frequency: "1-2 times daily" },
      { name: "Calcipotriene", dosage: "Apply thin layer", frequency: "Twice daily" },
      { name: "Coal Tar Shampoo", dosage: "Use as directed", frequency: "2-3 times weekly" },
    ],
    recommendations: [
      "Moisturize regularly",
      "Avoid triggers like stress and infections",
      "Use gentle, fragrance-free products",
      "Consider phototherapy",
    ],
    severity: "High",
  },
]

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = sessionOperations.findById(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Save the uploaded image
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const filename = `${Date.now()}-${file.name}`
    const filepath = path.join(process.cwd(), "public", "uploads", filename)

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    try {
      await writeFile(filepath, buffer)
    } catch (error) {
      // Create directory if it doesn't exist
      const fs = require("fs")
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      await writeFile(filepath, buffer)
    }

    // Simulate AI analysis
    const randomPrediction = mockPredictions[Math.floor(Math.random() * mockPredictions.length)]

    // Add some randomness to confidence
    const confidence = Math.max(70, Math.min(95, randomPrediction.confidence + (Math.random() - 0.5) * 10))

    const result = {
      ...randomPrediction,
      confidence: Math.round(confidence),
    }

    // Save analysis to database
    const analysis = analysisOperations.create(session.user_id, `/uploads/${filename}`, result)

    return NextResponse.json({
      id: analysis.lastInsertRowid,
      ...result,
      imagePath: `/uploads/${filename}`,
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = sessionOperations.findById(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const analyses = analysisOperations.getByUserId(session.user_id)

    return NextResponse.json(analyses)
  } catch (error) {
    console.error("Get analyses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
