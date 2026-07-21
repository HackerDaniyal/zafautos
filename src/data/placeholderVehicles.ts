import { VehicleCardData } from '@/components/marketplace/VehicleCard';

const makes = ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki', 'Lexus'];
const models = ['Land Cruiser Prado', 'CR-V', 'X-Trail', 'CX-5', 'Forester', 'Outlander', 'Jimny', 'RX'];
const bodyTypes = ['SUV', 'Sedan', 'Hatchback', 'SUV', 'Wagon', 'SUV', 'SUV', 'SUV'];
const locations = ['Tokyo', 'Osaka', 'Nagoya', 'Yokohama', 'Kobe', 'Fukuoka', 'Sapporo', 'Sendai'];
const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Petrol', 'Petrol', 'Hybrid', 'Petrol', 'Hybrid'];
const transmissions = ['Automatic', 'Automatic', 'Automatic', 'Manual', 'Automatic', 'CVT', 'Manual', 'Automatic'];
const conditions = ['Grade 4.5', 'Grade 4.0', 'Grade S', 'Grade 4.0', 'Grade 3.5', 'Grade 4.5', 'Grade 4.0', 'Grade S'];
const destinationCountries = ['ke', 'ng', 'pk', 'ae', 'au', 'nz', 'uk', 'gh', 'ug', 'sa', 'jp', 'us'];

function createVehicle(i: number): VehicleCardData {
  const idx = i % makes.length;
  return {
    id: `v-${i + 1}`,
    slug: `${makes[idx].toLowerCase()}-${models[idx].toLowerCase().replace(/\s+/g, '-')}-${2016 + (i % 8)}-${i + 1}`,
    make: makes[idx],
    model: models[idx],
    year: 2016 + (i % 8),
    price: 8000 + (i * 2800) % 65000,
    currency: 'USD',
    mileage: 15000 + (i * 7500) % 180000,
    fuelType: fuelTypes[idx],
    transmission: transmissions[idx],
    bodyType: bodyTypes[idx],
    location: locations[idx],
    condition: conditions[idx],
    destinationCountry: destinationCountries[i % destinationCountries.length],
    isFeatured: i < 8,
    isReserved: i === 11 || i === 19,
    imageCount: 12 + (i % 14),
    stockId: `ZAF-${1000 + i}`,
    fobPrice: true,
    arrivalEstimate: i % 5 === 0 ? 'Mid August' : i % 5 === 1 ? 'Late August' : undefined,
    recentlyAdded: i >= 8 && i < 16,
  };
}

export const placeholderVehicles: VehicleCardData[] = Array.from({ length: 30 }, (_, i) => createVehicle(i));
