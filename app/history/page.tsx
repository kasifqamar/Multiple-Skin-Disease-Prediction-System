"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Eye, Download, History } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface AnalysisHistory {
  id: number
  disease: string
  confidence: number
  severity: string
  image_path: string
  created_at: string
  symptoms: string[]
  recommendations: string[]
  medications: {
    name: string
    dosage: string
    frequency: string
  }[]
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistory | null>(null)

  useEffect(() => {
    fetchAnalyses()
  }, [])

  const fetchAnalyses = async () => {
    try {
      const response = await fetch("/api/analysis")
      if (response.ok) {
        const data = await response.json()
        setAnalyses(data)
      }
    } catch (error) {
      console.error("Error fetching analyses:", error)
    } finally {
      setIsLoading(false)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your analysis history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/user-dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <History className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Analysis History</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analyses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis History</h3>
              <p className="text-gray-600 mb-4">You haven't performed any skin analyses yet.</p>
              <Link href="/user-dashboard">
                <Button>Start Your First Analysis</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {analyses.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{analysis.disease}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(analysis.created_at)}
                      </CardDescription>
                    </div>
                    <Badge className={getSeverityColor(analysis.severity)}>{analysis.severity}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative h-32 w-full rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={analysis.image_path || "/placeholder.svg"}
                      alt="Analysis image"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Confidence:</span>
                      <span className="font-medium">{analysis.confidence}%</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Medications:</span>
                      <span className="font-medium">{analysis.medications?.length || 0} prescribed</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedAnalysis(analysis)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detailed View Modal */}
        {selectedAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedAnalysis.disease}</h2>
                  <Button variant="outline" onClick={() => setSelectedAnalysis(null)}>
                    Close
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={selectedAnalysis.image_path || "/placeholder.svg"}
                      alt="Analysis image"
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="text-lg font-semibold">{selectedAnalysis.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Severity</p>
                      <Badge className={getSeverityColor(selectedAnalysis.severity)}>{selectedAnalysis.severity}</Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Symptoms</h3>
                    <ul className="space-y-1">
                      {selectedAnalysis.symptoms?.map((symptom, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Medications</h3>
                    <div className="space-y-2">
                      {selectedAnalysis.medications?.map((medication, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <h4 className="font-medium">{medication.name}</h4>
                          <p className="text-sm text-gray-600">
                            {medication.dosage} - {medication.frequency}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Recommendations</h3>
                    <ul className="space-y-1">
                      {selectedAnalysis.recommendations?.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2" />
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>Analysis performed on {formatDate(selectedAnalysis.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
