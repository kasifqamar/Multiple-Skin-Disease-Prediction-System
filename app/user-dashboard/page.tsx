"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, LogOut, User, FileImage, AlertCircle, CheckCircle, Pill, History } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface PredictionResult {
  disease: string
  confidence: number
  description: string
  symptoms: string[]
  medications: {
    name: string
    dosage: string
    frequency: string
  }[]
  recommendations: string[]
  severity: "Low" | "Medium" | "High"
}

export default function UserDashboard() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const mockPredictions: PredictionResult[] = [
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
      description:
        "A common skin condition that occurs when hair follicles become clogged with oil and dead skin cells.",
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
  ]

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setPredictionResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const analyzeImage = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)

    try {
      const formData = new FormData()

      // Convert base64 to blob
      const response = await fetch(selectedImage)
      const blob = await response.blob()
      formData.append("image", blob, "skin-image.jpg")

      const analysisResponse = await fetch("/api/analysis", {
        method: "POST",
        body: formData,
      })

      if (analysisResponse.ok) {
        const result = await analysisResponse.json()
        setPredictionResult(result)
      } else {
        const error = await analysisResponse.json()
        alert(error.error || "Analysis failed")
      }
    } catch (error) {
      alert("Network error. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Low":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "High":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">SkinCare AI</h1>
                <p className="text-sm text-gray-500">User Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/history">
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Welcome, User</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Upload Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Skin Image
                </CardTitle>
                <CardDescription>Upload a clear image of the affected skin area for analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedImage ? (
                    <div className="space-y-4">
                      <Image
                        src={selectedImage || "/placeholder.svg"}
                        alt="Selected skin image"
                        width={300}
                        height={200}
                        className="mx-auto rounded-lg object-cover"
                      />
                      <p className="text-sm text-gray-600">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileImage className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">Upload an image</p>
                        <p className="text-sm text-gray-600">PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {selectedImage && (
                  <Button onClick={analyzeImage} className="w-full" disabled={isAnalyzing}>
                    {isAnalyzing ? "Analyzing..." : "Analyze Image"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {isAnalyzing && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>AI is analyzing your image. This may take a few moments...</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {predictionResult && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Analysis Results
                      </span>
                      <Badge className={getSeverityColor(predictionResult.severity)}>
                        {predictionResult.severity} Severity
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{predictionResult.disease}</h3>
                      <p className="text-sm text-gray-600 mt-1">Confidence: {predictionResult.confidence}%</p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{predictionResult.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Common Symptoms</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {predictionResult.symptoms.map((symptom, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            {symptom}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      Recommended Medications
                    </CardTitle>
                    <CardDescription>Consult with a healthcare provider before starting any treatment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {predictionResult.medications.map((medication, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{medication.name}</h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Dosage:</span> {medication.dosage}
                          </p>
                          <p>
                            <span className="font-medium">Frequency:</span> {medication.frequency}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Care Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {predictionResult.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Disclaimer:</strong> This AI analysis is for informational purposes only. Please consult
                    with a qualified dermatologist or healthcare provider for proper diagnosis and treatment.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
