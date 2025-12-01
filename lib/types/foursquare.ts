/**
 * Foursquare Places API 型別定義
 */

export interface FoursquarePlace {
  fsq_id?: string;
  fsq_place_id?: string;
  name: string;
  latitude?: number;
  longitude?: number;
  geocodes?: {
    main?: {
      latitude: number;
      longitude: number;
    };
  };
  location?: {
    formatted_address?: string;
    address?: string;
  };
  categories?: Array<{
    name: string;
  }>;
  distance?: number;
  lat?: number;
  lon?: number;
}

export interface FoursquareAttraction extends FoursquarePlace {
  distance: number;
  lat: number;
  lon: number;
}

