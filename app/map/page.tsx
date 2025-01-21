"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Loader2, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";

// Define types
type WaterQualityRecord = {
  quality: string;
  details: string;
  parameters: {
    ph: number;
    turbidity: number;
    dissolved_oxygen: number;
  };
};

type WaterQualityData = {
  [location: string]: WaterQualityRecord;
};

type Location = {
  lat: number;
  lng: number;
  name: string;
};

type LocationsData = {
  [location: string]: Location;
};

// Enhanced static data
const locations: LocationsData = {
  Alibag: { lat: 18.6411, lng: 72.8722, name: "Alibag Coastal Area" },
  Panvel: { lat: 18.9894, lng: 73.1175, name: "Panvel Creek" },
  Pune: { lat: 18.5204, lng: 73.8567, name: "Pune River Basin" },
  Mumbai: { lat: 19.0760, lng: 72.8777, name: "Mumbai Harbor" },
};

const waterQualityData: WaterQualityData = {
  Alibag: {
    quality: "Good",
    details: "Suitable for most aquatic life and recreational activities",
    parameters: {
      ph: 7.5,
      turbidity: 2.3,
      dissolved_oxygen: 7.2
    }
  },
  Panvel: {
    quality: "Fair",
    details: "Moderate concerns about industrial runoff impact",
    parameters: {
      ph: 6.9,
      turbidity: 4.5,
      dissolved_oxygen: 6.1
    }
  },
  Pune: {
    quality: "Excellent",
    details: "Pristine water quality with minimal contamination",
    parameters: {
      ph: 7.2,
      turbidity: 1.2,
      dissolved_oxygen: 8.5
    }
  },
  Mumbai: {
    quality: "Poor",
    details: "Significant urban pollution affecting water quality",
    parameters: {
      ph: 6.4,
      turbidity: 8.7,
      dissolved_oxygen: 4.3
    }
  },
};

// Dynamically import Leaflet components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Custom hook for map view
const MapView = dynamic(
  () => import("react-leaflet").then((mod) => {
    const MapView = ({ center }: { center: [number, number] }) => {
      const map = mod.useMap();
      useEffect(() => {
        map.setView(center, 12);
      }, [center, map]);
      return null;
    };
    return Promise.resolve(MapView);
  }),
  { ssr: false }
);

const getQualityDetails = (quality: string) => {
  switch (quality) {
    case "Excellent":
      return {
        color: "text-green-600 bg-green-50",
        border: "border-green-200",
        badge: "bg-green-100 text-green-800"
      };
    case "Good":
      return {
        color: "text-blue-600 bg-blue-50",
        border: "border-blue-200",
        badge: "bg-blue-100 text-blue-800"
      };
    case "Fair":
      return {
        color: "text-yellow-600 bg-yellow-50",
        border: "border-yellow-200",
        badge: "bg-yellow-100 text-yellow-800"
      };
    case "Poor":
      return {
        color: "text-red-600 bg-red-50",
        border: "border-red-200",
        badge: "bg-red-100 text-red-800"
      };
    default:
      return {
        color: "text-gray-600 bg-gray-50",
        border: "border-gray-200",
        badge: "bg-gray-100 text-gray-800"
      };
  }
};

const WaterQualityMap = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WaterQualityRecord | null>(null);

  const handleLocationChange = async (location: string) => {
    setLoading(true);
    setSelectedLocation(location);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setResult(waterQualityData[location]);
    setLoading(false);
  };

  const getLocationCoords = (locationName: string): [number, number] => {
    const location = locations[locationName];
    return [location.lat, location.lng];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Card className="max-w-5xl mx-auto shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-center gap-2">
            <Droplets className="w-6 h-6 text-blue-500" />
            <CardTitle className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
              Water Quality Monitor
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Select onValueChange={handleLocationChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a monitoring station" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(locations).map(([key, location]) => (
                    <SelectItem key={key} value={key}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-[450px] w-full rounded-xl overflow-hidden border shadow-inner">
                {typeof window !== "undefined" && (
                  <MapContainer
                    center={[18.7984, 73.2000]}
                    zoom={9}
                    className="h-full w-full"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {selectedLocation && (
                      <MapView center={getLocationCoords(selectedLocation)} />
                    )}
                    {Object.entries(locations).map(([key, location]) => (
                      <Marker key={key} position={[location.lat, location.lng]}>
                        <Popup>
                          <div className="p-2">
                            <h3 className="font-semibold">{location.name}</h3>
                            <p className="text-sm text-gray-600">
                              Quality: {waterQualityData[key].quality}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                )}
              </div>
            </div>

            <div className="flex flex-col h-full">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : selectedLocation && result ? (
                <div className={`p-6 rounded-xl space-y-6 ${getQualityDetails(result.quality).color} ${getQualityDetails(result.quality).border} border`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold">
                          {locations[selectedLocation].name}
                        </h3>
                      </div>
                      <Badge className={getQualityDetails(result.quality).badge}>
                        {result.quality}
                      </Badge>
                    </div>

                    <p className="text-gray-700">{result.details}</p>

                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-sm text-gray-600">pH Level</div>
                        <div className="text-xl font-semibold mt-1">
                          {result.parameters.ph}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-sm text-gray-600">Turbidity</div>
                        <div className="text-xl font-semibold mt-1">
                          {result.parameters.turbidity}
                        </div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-sm text-gray-600">Dissolved O₂</div>
                        <div className="text-xl font-semibold mt-1">
                          {result.parameters.dissolved_oxygen}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 rounded-xl border-2 border-dashed">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg">Select a monitoring station to view water quality data</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaterQualityMap;