// Shared constants & formatters for the Dubai Luxury Car Rental app

export const formatAED = (n) =>
  `AED ${Number(n || 0).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`;

export const VEHICLE_CATEGORIES = [
  'Supercar',
  'Sports',
  'Luxury SUV',
  'Luxury Sedan',
  'Convertible',
];

export const VEHICLE_STATUSES = ['Available', 'Rented', 'Maintenance'];

export const BOOKING_STATUSES = ['Active', 'Completed', 'Cancelled'];

// Dubai pickup / drop-off locations
export const DUBAI_LOCATIONS = [
  'Dubai Marina',
  'Downtown Dubai',
  'Palm Jumeirah',
  'Business Bay',
  'JBR - The Beach',
  'Dubai Intl Airport (DXB)',
  'Al Maktoum Airport (DWC)',
  'Deira',
  'Al Barsha',
  'Jumeirah',
];

export const NATIONALITIES = [
  'United Arab Emirates',
  'Saudi Arabia',
  'United Kingdom',
  'India',
  'Pakistan',
  'United States',
  'Russia',
  'China',
  'Germany',
  'France',
  'Other',
];

// Monochrome gradient per category — TMT black & white. Used for vehicle
// card headers when no image is set.
export const CATEGORY_GRADIENT = {
  Supercar: 'linear-gradient(135deg, #3a3a3a 0%, #000000 100%)',
  Sports: 'linear-gradient(135deg, #4a4a4a 0%, #111111 100%)',
  'Luxury SUV': 'linear-gradient(135deg, #2b2b2b 0%, #000000 100%)',
  'Luxury Sedan': 'linear-gradient(135deg, #555555 0%, #1a1a1a 100%)',
  Convertible: 'linear-gradient(135deg, #6b6b6b 0%, #222222 100%)',
};
