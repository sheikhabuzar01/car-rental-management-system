// mockDb.js - Dubai Luxury Car Rental data layer (localStorage backed)

const STORAGE_KEY = 'dubai_luxury_rental_db_v1';

const initialData = {
  vehicles: [
    { id: 'veh-1', name: 'Lamborghini Huracán EVO', brand: 'Lamborghini', model: 'Huracán EVO Spyder', category: 'Supercar', year: 2023, color: 'Verde Mantis', registration: 'Dubai O 55512', dailyRent: 4500, deposit: 5000, status: 'Available', image: '/2.jpg' },
    { id: 'veh-2', name: 'Ferrari 488 Spider', brand: 'Ferrari', model: '488 Spider', category: 'Convertible', year: 2022, color: 'Rosso Corsa', registration: 'Dubai K 11220', dailyRent: 5000, deposit: 6000, status: 'Available', image: '/3.jpg' },
    { id: 'veh-3', name: 'Rolls-Royce Cullinan', brand: 'Rolls-Royce', model: 'Cullinan', category: 'Luxury SUV', year: 2023, color: 'Arctic White', registration: 'Dubai A 9001', dailyRent: 6500, deposit: 10000, status: 'Rented', image: '/4.jpg' },
    { id: 'veh-4', name: 'Mercedes-Benz G63 AMG', brand: 'Mercedes-Benz', model: 'G63 AMG', category: 'Luxury SUV', year: 2023, color: 'Obsidian Black', registration: 'Dubai L 33440', dailyRent: 3000, deposit: 5000, status: 'Available', image: '/5.jpg' },
    { id: 'veh-5', name: 'Bentley Continental GT', brand: 'Bentley', model: 'Continental GT', category: 'Luxury Sedan', year: 2023, color: 'British Racing Green', registration: 'Dubai M 7788', dailyRent: 3500, deposit: 5000, status: 'Available', image: '/6.jpg' },
    { id: 'veh-6', name: 'Porsche 911 Carrera S', brand: 'Porsche', model: '911 Carrera S', category: 'Sports', year: 2023, color: 'GT Silver', registration: 'Dubai P 2024', dailyRent: 2500, deposit: 4000, status: 'Available', image: '/7.jpg' },
    { id: 'veh-7', name: 'McLaren 720S', brand: 'McLaren', model: '720S', category: 'Supercar', year: 2022, color: 'Papaya Orange', registration: 'Dubai S 7200', dailyRent: 5500, deposit: 7000, status: 'Maintenance', image: '/8.jpg' },
    { id: 'veh-8', name: 'Range Rover Vogue', brand: 'Land Rover', model: 'Range Rover Vogue', category: 'Luxury SUV', year: 2022, color: 'Santorini Black', registration: 'Dubai B 4510', dailyRent: 1500, deposit: 3000, status: 'Available', image: '/9.jpg' },
  ],
  customers: [
    { id: 'cus-1', fullName: 'Khalid Al Maktoum', phone: '+971 50 123 4567', email: 'khalid@example.ae', emiratesId: '784-1988-1234567-1', license: 'DXB-DL-99821', nationality: 'United Arab Emirates' },
    { id: 'cus-2', fullName: 'Sophia Williams', phone: '+971 55 987 6543', email: 'sophia.w@example.com', emiratesId: '784-1992-7654321-8', license: 'UK-DL-44120', nationality: 'United Kingdom' },
    { id: 'cus-3', fullName: 'Rajesh Mehta', phone: '+971 52 555 6677', email: 'rajesh.m@example.com', emiratesId: '784-1990-9988776-5', license: 'IN-DL-11003', nationality: 'India' },
  ],
  bookings: [
    {
      id: 'bk-1',
      vehicleId: 'veh-3',
      customerId: 'cus-1',
      pickupDate: '2026-05-28',
      returnDate: '2026-06-03',
      pickupLocation: 'Palm Jumeirah',
      withChauffeur: true,
      deposit: 10000,
      rentalAmount: 45500,
      status: 'Active',
    },
    {
      id: 'bk-2',
      vehicleId: 'veh-1',
      customerId: 'cus-2',
      pickupDate: '2026-05-10',
      returnDate: '2026-05-13',
      pickupLocation: 'Dubai Marina',
      withChauffeur: false,
      deposit: 5000,
      rentalAmount: 18000,
      status: 'Completed',
    },
  ],
};

const BOOKING_STATUSES = ['Active', 'Completed', 'Cancelled'];

// Statuses that occupy a vehicle for availability purposes.
const BLOCKING_STATUSES = ['Active'];

// Per-day surcharge when a professional chauffeur is requested (AED).
const CHAUFFEUR_DAILY_RATE = 500;

class CarRentalDb {
  constructor() {
    this.data = this._load();
  }

  _load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    let data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (e) {
        data = null;
      }
    }
    if (!data) {
      this._save(initialData);
      return JSON.parse(JSON.stringify(initialData));
    }
    if (!Array.isArray(data.vehicles)) data.vehicles = [];
    if (!Array.isArray(data.customers)) data.customers = [];
    if (!Array.isArray(data.bookings)) data.bookings = [];

    // Backfill seed vehicle images for data persisted before images existed.
    // Only fills empty image fields, so user edits/additions are untouched.
    const seedImages = Object.fromEntries(initialData.vehicles.map(v => [v.id, v.image]));
    let imagesChanged = false;
    data.vehicles = data.vehicles.map(v => {
      let image = v.image;
      if ((!image || image === '') && seedImages[v.id]) image = seedImages[v.id];
      // Migrate the original heavy PNGs to the optimized JPEG versions.
      if (image && /^\/[2-9]\.png$/.test(image)) image = image.replace('.png', '.jpg');
      if (image !== v.image) {
        imagesChanged = true;
        return { ...v, image };
      }
      return v;
    });
    if (imagesChanged) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    return data;
  }

  _save(newData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    this.data = newData;
    window.dispatchEvent(new CustomEvent('db-update', { detail: newData }));
  }

  getData() {
    return this.data;
  }

  // --- VEHICLES ---
  addVehicle(v) {
    const data = this._load();
    const newVehicle = {
      id: `veh-${Date.now()}`,
      name: v.name,
      brand: v.brand || '',
      model: v.model || '',
      category: v.category || 'Luxury Sedan',
      year: Number(v.year) || new Date().getFullYear(),
      color: v.color || '',
      registration: v.registration || '',
      dailyRent: Number(v.dailyRent) || 0,
      deposit: Number(v.deposit) || 0,
      status: v.status || 'Available',
      image: v.image || '',
    };
    data.vehicles.push(newVehicle);
    this._save(data);
    return newVehicle;
  }

  updateVehicle(id, fields) {
    const data = this._load();
    data.vehicles = data.vehicles.map(v => {
      if (v.id !== id) return v;
      const merged = { ...v, ...fields };
      merged.dailyRent = fields.dailyRent !== undefined ? Number(fields.dailyRent) : v.dailyRent;
      merged.deposit = fields.deposit !== undefined ? Number(fields.deposit) : v.deposit;
      merged.year = fields.year !== undefined ? Number(fields.year) : v.year;
      return merged;
    });
    this._save(data);
    return data.vehicles.find(v => v.id === id);
  }

  deleteVehicle(id) {
    const data = this._load();
    data.vehicles = data.vehicles.filter(v => v.id !== id);
    data.bookings = data.bookings.filter(b => b.vehicleId !== id);
    this._save(data);
  }

  // --- CUSTOMERS ---
  addCustomer(c) {
    const data = this._load();
    const newCustomer = {
      id: `cus-${Date.now()}`,
      fullName: c.fullName,
      phone: c.phone || '',
      email: c.email || '',
      emiratesId: c.emiratesId || '',
      license: c.license || '',
      nationality: c.nationality || '',
    };
    data.customers.push(newCustomer);
    this._save(data);
    return newCustomer;
  }

  updateCustomer(id, fields) {
    const data = this._load();
    data.customers = data.customers.map(c => c.id === id ? { ...c, ...fields } : c);
    this._save(data);
    return data.customers.find(c => c.id === id);
  }

  deleteCustomer(id) {
    const data = this._load();
    data.customers = data.customers.filter(c => c.id !== id);
    data.bookings = data.bookings.filter(b => b.customerId !== id);
    this._save(data);
  }

  // --- BOOKINGS ---

  /**
   * Core business logic: check whether a vehicle is free for a date range.
   * Returns { available: boolean, conflicts: Booking[] }.
   * Two ranges overlap when start_A <= end_B AND start_B <= end_A.
   * Only bookings in a BLOCKING status (Active) occupy the vehicle.
   * Pass `ignoreBookingId` when editing so a booking doesn't conflict with itself.
   */
  checkAvailability(vehicleId, pickupDate, returnDate, ignoreBookingId = null) {
    const data = this._load();
    const start = new Date(pickupDate);
    const end = new Date(returnDate);

    const conflicts = data.bookings.filter(b => {
      if (b.vehicleId !== vehicleId) return false;
      if (b.id === ignoreBookingId) return false;
      if (!BLOCKING_STATUSES.includes(b.status)) return false;
      const bStart = new Date(b.pickupDate);
      const bEnd = new Date(b.returnDate);
      return start <= bEnd && bStart <= end;
    });

    return { available: conflicts.length === 0, conflicts };
  }

  /**
   * Create a booking only if the vehicle is free for the requested dates.
   * Throws an Error with a readable message on invalid input or double-booking.
   */
  addBooking(b) {
    const data = this._load();

    if (!b.vehicleId) throw new Error('Please select a vehicle.');
    if (!b.customerId) throw new Error('Please select a customer.');
    if (!b.pickupDate || !b.returnDate) throw new Error('Pickup and return dates are required.');
    if (new Date(b.returnDate) < new Date(b.pickupDate)) {
      throw new Error('Return date cannot be before the pickup date.');
    }

    const vehicle = data.vehicles.find(v => v.id === b.vehicleId);
    if (vehicle && vehicle.status === 'Maintenance') {
      throw new Error('This vehicle is under maintenance and cannot be booked.');
    }

    const status = BOOKING_STATUSES.includes(b.status) ? b.status : 'Active';

    if (BLOCKING_STATUSES.includes(status)) {
      const { available, conflicts } = this.checkAvailability(b.vehicleId, b.pickupDate, b.returnDate);
      if (!available) {
        const c = conflicts[0];
        throw new Error(
          `Vehicle is already booked from ${c.pickupDate} to ${c.returnDate}. Choose different dates or another vehicle.`
        );
      }
    }

    const newBooking = {
      id: `bk-${Date.now()}`,
      vehicleId: b.vehicleId,
      customerId: b.customerId,
      pickupDate: b.pickupDate,
      returnDate: b.returnDate,
      pickupLocation: b.pickupLocation || '',
      withChauffeur: !!b.withChauffeur,
      deposit: Number(b.deposit) || (vehicle ? vehicle.deposit : 0),
      rentalAmount: Number(b.rentalAmount) || 0,
      status,
    };
    data.bookings.push(newBooking);

    if (BLOCKING_STATUSES.includes(status)) {
      data.vehicles = data.vehicles.map(v => v.id === b.vehicleId ? { ...v, status: 'Rented' } : v);
    }

    this._save(data);
    return newBooking;
  }

  updateBookingStatus(id, status) {
    const data = this._load();
    const booking = data.bookings.find(b => b.id === id);
    if (!booking) return null;

    data.bookings = data.bookings.map(b => b.id === id ? { ...b, status } : b);

    if (!BLOCKING_STATUSES.includes(status)) {
      const stillActive = data.bookings.some(
        b => b.vehicleId === booking.vehicleId && b.id !== id && BLOCKING_STATUSES.includes(b.status)
      );
      if (!stillActive) {
        // Don't override a manually-set Maintenance status.
        data.vehicles = data.vehicles.map(v =>
          v.id === booking.vehicleId && v.status === 'Rented' ? { ...v, status: 'Available' } : v
        );
      }
    } else {
      data.vehicles = data.vehicles.map(v => v.id === booking.vehicleId ? { ...v, status: 'Rented' } : v);
    }

    this._save(data);
    return data.bookings.find(b => b.id === id);
  }

  deleteBooking(id) {
    const data = this._load();
    const booking = data.bookings.find(b => b.id === id);
    data.bookings = data.bookings.filter(b => b.id !== id);

    if (booking) {
      const stillActive = data.bookings.some(
        b => b.vehicleId === booking.vehicleId && BLOCKING_STATUSES.includes(b.status)
      );
      if (!stillActive) {
        data.vehicles = data.vehicles.map(v =>
          v.id === booking.vehicleId && v.status === 'Rented' ? { ...v, status: 'Available' } : v
        );
      }
    }

    this._save(data);
  }
}

export const db = new CarRentalDb();
export { BOOKING_STATUSES, BLOCKING_STATUSES, CHAUFFEUR_DAILY_RATE };
