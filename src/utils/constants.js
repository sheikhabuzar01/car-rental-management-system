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

// Premium gradient per category — used for vehicle card headers when no image
export const CATEGORY_GRADIENT = {
  Supercar: 'linear-gradient(135deg, #b8860b 0%, #1a1a1a 100%)',
  Sports: 'linear-gradient(135deg, #8b0000 0%, #1a1a1a 100%)',
  'Luxury SUV': 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
  'Luxury Sedan': 'linear-gradient(135deg, #34495e 0%, #0f0f0f 100%)',
  Convertible: 'linear-gradient(135deg, #6a3093 0%, #1a1a1a 100%)',
};
