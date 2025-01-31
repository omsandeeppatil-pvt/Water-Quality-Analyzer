"use client";
import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertCircle, CheckCircle2, Droplets } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';

interface WaterQualityResult {
  overallQuality: string;
  metrics: {
    ph: number;
    turbidity: number;
    dissolvedOxygen: number;
    temperature: number;
    conductivity: number;
    totalDissolvedSolids: number;
  };
  recommendations: string[];
}

export default function AnalyzePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<WaterQualityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setError(null);
      setResult(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setError(null);
        setResult(null);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please upload an image file.');
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setError('Please select an image to analyze.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError('Failed to analyze the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (value: number, type: string) => {
    switch (type) {
      case 'ph':
        if (value >= 6.5 && value <= 8.5) return 'text-green-600';
        return 'text-red-600';
      case 'turbidity':
        if (value <= 5) return 'text-green-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getOverallQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excellent':
        return 'text-green-600';
      case 'Good':
        return 'text-blue-600';
      case 'Fair':
        return 'text-yellow-600';
      case 'Poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Droplets className="w-6 h-6" />
            Advanced Water Quality Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${!selectedFile ? 'border-gray-300 hover:border-gray-400' : 'border-blue-500'}
              ${loading ? 'opacity-50' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg shadow-md"
                />
                <p className="text-sm text-gray-500">
                  Click or drag to change image
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <div>
                  <p className="text-lg font-medium">
                    Drop your water sample image here or click to upload
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-center text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing water quality...</span>
              </div>
              <Progress value={66} className="h-1" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="bg-white rounded-lg p-6 shadow-sm border space-y-6">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <h3 className="text-xl font-semibold">Analysis Complete</h3>
              </div>

              <div className="text-center">
                <p className="text-gray-600">Overall Water Quality:</p>
                <p className={`text-2xl font-bold mt-2 ${getOverallQualityColor(result.overallQuality)}`}>
                  {result.overallQuality}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">pH Level</p>
                  <p className={`text-xl font-bold ${getQualityColor(result.metrics.ph, 'ph')}`}>
                    {result.metrics.ph}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Turbidity (NTU)</p>
                  <p className={`text-xl font-bold ${getQualityColor(result.metrics.turbidity, 'turbidity')}`}>
                    {result.metrics.turbidity}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Dissolved Oxygen (mg/L)</p>
                  <p className="text-xl font-bold">
                    {result.metrics.dissolvedOxygen}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Temperature (°C)</p>
                  <p className="text-xl font-bold">
                    {result.metrics.temperature}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Conductivity (µS/cm)</p>
                  <p className="text-xl font-bold">
                    {result.metrics.conductivity}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">TDS (mg/L)</p>
                  <p className="text-xl font-bold">
                    {result.metrics.totalDissolvedSolids}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-2">Recommendations:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!selectedFile || loading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white 
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${!selectedFile || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Analyzing...' : 'Analyze Water Quality'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}