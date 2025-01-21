export interface WaterQualityData {
    quality: string;
    details: string;
  }
  
  export interface WaterQualityRecord {
    [key: string]: WaterQualityData;
  }
  
  export interface LocationCoordinates {
    [key: string]: [number, number];
  }
  
  // Define the locations explicitly
  export const locations: LocationCoordinates = {
    Alibag: [18.6411, 72.8722],
    Panvel: [18.9894, 73.1175],
    Pune: [18.5204, 73.8567],
    Mumbai: [19.0760, 72.8777],
  };
  
  export type LocationName = keyof typeof locations;
  