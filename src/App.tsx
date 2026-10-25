import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Droplets,
  ExternalLink,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Truck,
  User,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';

export type ServiceTitle =
  | 'Exterior Foam & High-Pressure Wash'
  | '9H Ceramic Coating & Paint Protection'
  | 'Deep Interior Detailing & AC Sanitization'
  | 'Full Body Rubbing, Polishing & Scratch Removal'
  | 'Headlight Restoration & Upholstery Cleaning';

export type ServiceMode =
  | 'Workshop Visit (Slot Reservation)'
  | 'Pick-up & Drop Request';

export type VehicleType = 'Hatchback' | 'Sedan' | 'SUV' | 'Luxury';

export type OwnerBookingStatus = 'pending' | 'in_progress' | 'completed';

export type OwnerBooking = {
  id: string;
  client_name: string;
  phone: string;
  car_number: string;
  vehicle_model: string;
  service: ServiceTitle | string;
  preferred_date: string;
  preferred_time: string;
  service_mode: ServiceMode;
  vehicle_type: VehicleType;
  pickup_address?: string;
  status: OwnerBookingStatus;
  created_at: string;
};

type BookingFormState = {
  client_name: string;
  phone: string;
  car_number: string;
  vehicle_model: string;
  vehicle_type: VehicleType;
  service: ServiceTitle;
  preferred_date: string;
  preferred_time: string;
  service_mode: ServiceMode;
  pickup_address: string;
};

type ReviewItem = {
  id: string;
  reviewer_name: string;
  badge: string;
  time_ago: string;
  rating: number;
  comment: string;
  car_model?: string;
  initials: string;
  avatarBg: string;
};

type SyncEventPayload =
  | {
      op: 'upsert';
      booking: OwnerBooking;
      ts: number;
    }
  | {
      op: 'status';
      id: string;
      status: OwnerBookingStatus;
      ts: number;
    }
  | {
      op: 'delete';
      id: string;
      ts: number;
    };

const STORAGE_BOOKINGS_KEY = 'avon_car_spa_live_bookings_v1';
const STORAGE_DELETED_IDS_KEY = 'avon_car_spa_deleted_ids_v1';
const STORAGE_REVIEWS_KEY = 'avon_car_spa_live_reviews_v1';
const STORAGE_ADMIN_UNLOCKED_KEY = 'avon_car_spa_admin_pin_unlocked';
const ADMIN_PIN = 'jeevan9002';
const SYNC_MARKER = '__AVON_SYNC_EVENT__';

const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb3J5bHB5dW93aWVxcGRnaHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3OTM0NDMsImV4cCI6MjEwODM2OTQ0M30.pskeXi6R9jVi4yu3QIo98QmYawdaw5NSNxFR70SbpZg';

const HERO_IMG_BMW = "https://images.pexels.com/photos/6872591/pexels-photo-6872591.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop";
const HERO_IMG_AMG = "https://images.pexels.com/photos/16511358/pexels-photo-16511358.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop";
const HERO_IMG_PORSCHE = "https://images.pexels.com/photos/14231701/pexels-photo-14231701.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop";
const HERO_IMG_AUDI = "https://images.pexels.com/photos/8376593/pexels-photo-8376593.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop";
const SERVICE_IMG_INTERIOR = "https://images.pexels.com/photos/6873185/pexels-photo-6873185.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop";
const SERVICE_IMG_HEADLIGHT = "https://images.pexels.com/photos/5233268/pexels-photo-5233268.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop";

const HERO_SLIDES = [
  {
    id: 'bmw-m',
    car: 'BMW M4 Competition',
    bayLabel: 'Bay 01 · High-Pressure Snow Foam & Decon',
    headline: 'Hand-finished car care in',
    accent: 'BTM Layout 4th Stage.',
    subtitle:
      'Two-bucket microfiber washes, deep cabin sanitization, and machine paint correction by Harish and our full-time studio technicians.',
    image: HERO_IMG_BMW,
  },
  {
    id: 'mercedes-amg',
    car: 'Mercedes-AMG GT',
    bayLabel: 'Bay 02 · 9H Ceramic & Paint Protection',
    headline: 'Honest prep work. Deep,',
    accent: 'lasting showroom gloss.',
    subtitle:
      'We spend hours on iron removal, clay-bar decontamination, and multi-stage polishing before a single drop of ceramic coating touches your paint.',
    image: HERO_IMG_AMG,
  },
  {
    id: 'porsche-911',
    car: 'Porsche 911 Carrera S',
    bayLabel: 'Bay 03 · Rotary & Dual-Action Polishing',
    headline: 'Every panel inspected',
    accent: 'under studio lighting.',
    subtitle:
      'From daily hatchbacks and family SUVs to weekend German sedans—every vehicle goes through a 14-point final inspection before handover.',
    image: HERO_IMG_PORSCHE,
  },
  {
    id: 'audi-rs',
    car: 'Audi RS7 Sportback',
    bayLabel: 'Doorstep Pick-up & Drop · South Bengaluru',
    headline: 'Book a workshop bay or',
    accent: 'request home pick-up.',
    subtitle:
      'Located on 5th Main Road, Krishna Layout, Devarachikkana Halli. Reserve a dedicated time slot online with zero waiting in line.',
    image: HERO_IMG_AUDI,
  },
];

const SERVICES_DATA: {
  id: string;
  number: string;
  title: ServiceTitle;
  tagline: string;
  description: string;
  features: string[];
  duration: string;
  priceLabel: string;
  badge: string;
  image: string;
  icon: typeof Droplets;
}[] = [
  {
    id: 'foam-wash',
    number: '01',
    title: 'Exterior Foam & High-Pressure Wash',
    tagline: 'Daily Road Grime & Monsoon Mud Reset',
    description:
      'Thick pH-neutral snow foam pre-soak, high-pressure underbody & wheel arch flush, 2-bucket grit-guard hand wash, blow-dry, and non-sling tyre dressing.',
    features: [
      'pH-Neutral Snow Foam & Underbody Rinse',
      'Alloy Wheel, Caliper & Arch Deep Clean',
      'Microfiber Blow-Dry, Glass & Tyre Dressing',
    ],
    duration: '45 – 60 Mins',
    priceLabel: '₹499 – ₹799',
    badge: 'Everyday Wash',
    image: HERO_IMG_BMW,
    icon: Droplets,
  },
  {
    id: 'ceramic-coating',
    number: '02',
    title: '9H Ceramic Coating & Paint Protection',
    tagline: '3-Year Hydrophobic Shield & UV Protection',
    description:
      'Full paint decontamination, 2-stage swirl correction, IPA panel wipe, and high-solids 9H nano-ceramic application for permanent candy gloss.',
    features: [
      'Clay Bar, Iron Decon & Swirl Correction',
      'Double-Layer 9H Ceramic Bonding',
      'Hydrophobic Water Beading & UV Guard',
    ],
    duration: '1 – 2 Days',
    priceLabel: '₹8,999 Onwards',
    badge: 'Paint Armor',
    image: HERO_IMG_AMG,
    icon: Shield,
  },
  {
    id: 'interior-detailing',
    number: '03',
    title: 'Deep Interior Detailing & AC Sanitization',
    tagline: 'Complete Cabin Shampoo & Steam Hygiene',
    description:
      'Seat & floor carpet wet-extraction, roof-liner cleaning, leather cleaning & matte conditioning, dashboard detailing, and antibacterial AC vent steam flush.',
    features: [
      'AC Vent Antibacterial Steam Sanitization',
      'Leather Conditioning & Fabric Extraction',
      'Roof-Liner, Door Pads & Boot Deep Clean',
    ],
    duration: '3 – 4 Hours',
    priceLabel: '₹1,499 – ₹2,499',
    badge: 'Cabin Hygiene',
    image: SERVICE_IMG_INTERIOR,
    icon: Sparkles,
  },
  {
    id: 'rubbing-polishing',
    number: '04',
    title: 'Full Body Rubbing, Polishing & Scratch Removal',
    tagline: 'Swirl Mark, Water-Spot & Oxidation Removal',
    description:
      '3-step rotary and dual-action machine compounding using German cutting and finishing pads to remove wash swirls, light scratches, and dullness.',
    features: [
      '3-Stage Machine Rubbing & Compounding',
      'Hard Water Spot & Minor Scratch Removal',
      'Carnauba / Polymer Paint Sealant Coat',
    ],
    duration: '5 – 6 Hours',
    priceLabel: '₹2,499 – ₹4,499',
    badge: 'Gloss Restoration',
    image: HERO_IMG_AUDI,
    icon: Wrench,
  },
  {
    id: 'headlight-upholstery',
    number: '05',
    title: 'Headlight Restoration & Upholstery Cleaning',
    tagline: 'Clear Night-Drive Optics & Stain Removal',
    description:
      'Multi-grit wet sanding and optical machine compounding for yellowed/oxidized headlights paired with targeted stain removal for seats and armrests.',
    features: [
      'Yellowed Headlight Lens Wet-Sand & Polish',
      'UV Clear-Coat Sealant on Both Headlamps',
      'Targeted Seat & Upholstery Stain Extraction',
    ],
    duration: '2 – 3 Hours',
    priceLabel: '₹1,199 – ₹1,999',
    badge: 'Targeted Care',
    image: SERVICE_IMG_HEADLIGHT,
    icon: Award,
  },
];

const VERIFIED_GOOGLE_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-sudeep',
    reviewer_name: 'Sudeep Bhaskar',
    badge: '5/5 Stars',
    time_ago: 'a day ago',
    rating: 5,
    comment: 'Good service and neat cleaning',
    car_model: 'Verified Google Review · 4 reviews',
    initials: 'SB',
    avatarBg: 'bg-stone-900 text-amber-300',
  },
  {
    id: 'rev-manoja',
    reviewer_name: 'Manoja Sahoo',
    badge: 'Local Guide · 5/5 Stars',
    time_ago: '5 days ago',
    rating: 5,
    comment:
      'Amazing car wash, the team is very professional in their work and take care of every detail',
    car_model: 'Local Guide · 5 reviews',
    initials: 'MS',
    avatarBg: 'bg-emerald-900 text-emerald-200',
  },
  {
    id: 'rev-bapun',
    reviewer_name: 'Bapun Mahapatra',
    badge: '5/5 Stars',
    time_ago: 'a week ago',
    rating: 5,
    comment: 'Excellent and good water wash',
    car_model: 'Verified Google Review',
    initials: 'BM',
    avatarBg: 'bg-amber-800 text-amber-100',
  },
  {
    id: 'rev-samartha',
    reviewer_name: 'F46 SAMARTHA S SHETTY',
    badge: '5/5 Stars',
    time_ago: 'a week ago',
    rating: 5,
    comment: 'Good service provided by Harish thank you. Reasonable price.',
    car_model: 'Verified Google Review',
    initials: 'SS',
    avatarBg: 'bg-slate-800 text-sky-200',
  },
];

const TIME_SLOTS = [
  '09:00 AM – 11:00 AM',
  '11:00 AM – 01:00 PM',
  '02:00 PM – 04:00 PM',
  '04:00 PM – 06:00 PM',
  '06:00 PM – 08:00 PM',
];

const VEHICLE_TYPES: VehicleType[] = ['Hatchback', 'Sedan', 'SUV', 'Luxury'];

function toDbServiceName(service: string): string {
  if (service === 'Exterior Foam & High-Pressure Wash') {
    return 'Exterior Foam & Pressure Wash';
  }
  if (service === 'Deep Interior Detailing & AC Sanitization') {
    return 'Deep Interior Detailing & AC Disinfectant';
  }
  return service;
}

function fromDbServiceName(dbService?: string): ServiceTitle {
  if (!dbService || dbService === 'Exterior Foam & Pressure Wash' || dbService === 'Foam Wash') {
    return 'Exterior Foam & High-Pressure Wash';
  }
  if (dbService === 'Deep Interior Detailing & AC Disinfectant' || dbService === 'Interior Detailing') {
    return 'Deep Interior Detailing & AC Sanitization';
  }
  if (dbService === '9H Ceramic Coating & Paint Protection' || dbService === 'Ceramic Coating') {
    return '9H Ceramic Coating & Paint Protection';
  }
  if (dbService === 'Full Body Rubbing, Polishing & Scratch Removal' || dbService === 'Paint Protection') {
    return 'Full Body Rubbing, Polishing & Scratch Removal';
  }
  if (dbService === 'Headlight Restoration & Upholstery Cleaning') {
    return 'Headlight Restoration & Upholstery Cleaning';
  }
  return 'Exterior Foam & High-Pressure Wash';
}

function detectStandaloneAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env;
    const envMode = metaEnv?.VITE_APP_MODE;

    return (
      hostname.includes('admin') ||
      envMode === 'admin' ||
      pathname === '/admin' ||
      pathname.startsWith('/admin/') ||
      searchParams.get('admin') === 'true'
    );
  } catch {
    return false;
  }
}

function readLocalBookings(): OwnerBooking[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_BOOKINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalBookings(items: OwnerBooking[]): void {
  try {
    window.localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('avon-bookings-updated'));
  } catch {
    // Ignore storage errors
  }
}

function readDeletedIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_DELETED_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeDeletedIds(ids: Set<string>): void {
  try {
    window.localStorage.setItem(STORAGE_DELETED_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore
  }
}

function readLocalReviews(): ReviewItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_REVIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalReviews(items: ReviewItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

function normalizeServiceMode(raw?: string): ServiceMode {
  if (raw === 'Pick-up & Drop Request') return 'Pick-up & Drop Request';
  return 'Workshop Visit (Slot Reservation)';
}

function normalizeStatus(raw?: string): OwnerBookingStatus {
  if (raw === 'in_progress') return 'in_progress';
  if (raw === 'completed') return 'completed';
  return 'pending';
}

function sanitizeIndianPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

function buildWhatsAppUrl(booking: OwnerBooking): string {
  const cleanPhone = sanitizeIndianPhone(booking.phone);
  const statusLabel =
    booking.status === 'completed'
      ? 'READY FOR HANDOVER'
      : booking.status === 'in_progress'
      ? 'WORK IN PROGRESS AT BAY'
      : 'SLOT CONFIRMED';

  const message = [
    `Namaste ${booking.client_name},`,
    `This is *Avon Car Spa* (BTM Layout 4th Stage, Bengaluru).`,
    ``,
    `Your vehicle booking status is *${statusLabel}*:`,
    `• *Vehicle:* ${booking.car_number} (${booking.vehicle_type}${booking.vehicle_model ? ` · ${booking.vehicle_model}` : ''})`,
    `• *Service:* ${booking.service}`,
    `• *Date & Slot:* ${booking.preferred_date} | ${booking.preferred_time}`,
    `• *Mode:* ${booking.service_mode}`,
    booking.pickup_address ? `• *Pickup Location:* ${booking.pickup_address}` : '',
    ``,
    `📍 Workshop: No 3/16/5, 5th Main Road, Krishna Layout, BTM Layout 4th Stage, Devarachikkana Halli, Bengaluru - 560114`,
    `📞 Harish / Desk: 078991 38399`,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function buildCustomerToStudioWhatsAppUrl(booking: OwnerBooking): string {
  const message = [
    `Hello Avon Car Spa (Harish),`,
    `I have just booked a slot on your website:`,
    `• *Name:* ${booking.client_name}`,
    `• *Phone:* ${booking.phone}`,
    `• *Car:* ${booking.car_number} (${booking.vehicle_type}${booking.vehicle_model ? ` - ${booking.vehicle_model}` : ''})`,
    `• *Package:* ${booking.service}`,
    `• *Slot:* ${booking.preferred_date} (${booking.preferred_time})`,
    `• *Mode:* ${booking.service_mode}`,
    booking.pickup_address ? `• *Pickup Address:* ${booking.pickup_address}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/917899138399?text=${encodeURIComponent(message)}`;
}

function formatTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return 'Just now';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Just now';
  }
}

async function publishCloudSyncEvent(eventPayload: SyncEventPayload): Promise<void> {
  try {
    const serialized = JSON.stringify(eventPayload);
    if (serialized.length > 495) return;
    await fetch('https://prorylpyuowieqpdghql.supabase.co/rest/v1/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        reviewer_name: SYNC_MARKER,
        rating: 5,
        comment: serialized,
        car_serviced: 'sync_v1',
      }),
    });
  } catch {
    // Ignore offline errors
  }
}

export default function App() {
  const [isStandaloneAdmin, setIsStandaloneAdmin] = useState<boolean>(() =>
    detectStandaloneAdminRoute()
  );
  const [activeView, setActiveView] = useState<'website' | 'admin'>(() =>
    detectStandaloneAdminRoute() ? 'admin' : 'website'
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // 6-Second Hero Slider State
  const [heroSlide, setHeroSlide] = useState(0);

  // Live Bookings State (Starts with ZERO fake bookings)
  const [bookings, setBookings] = useState<OwnerBooking[]>(() => readLocalBookings());
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Centered Booking Form State
  const todayIso = new Date().toISOString().split('T')[0];
  const [bookingForm, setBookingForm] = useState<BookingFormState>({
    client_name: '',
    phone: '',
    car_number: '',
    vehicle_model: '',
    vehicle_type: 'Sedan',
    service: 'Exterior Foam & High-Pressure Wash',
    preferred_date: todayIso,
    preferred_time: '11:00 AM – 01:00 PM',
    service_mode: 'Workshop Visit (Slot Reservation)',
    pickup_address: '',
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<OwnerBooking | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [serviceFlash, setServiceFlash] = useState(false);

  // Customer Reviews & Interactive "Rate Us" State
  const [customReviews, setCustomReviews] = useState<ReviewItem[]>(() => readLocalReviews());
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    hoverRating: 0,
    reviewer_name: '',
    car_model: '',
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const reviewInputRef = useRef<HTMLInputElement | null>(null);

  // Automatic 6.5-Second (6500ms) Hero Car Slider
  useEffect(() => {
    if (activeView !== 'website' && !isStandaloneAdmin) return;
    const timer = window.setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [activeView, isStandaloneAdmin]);

  // Real-Time Cloud + Local Sync Engine (Polls every 3.5 seconds so multi-device stays in sync)
  const syncBookingsFromSources = useCallback(async (silent = false) => {
    if (!silent) setLoadingBookings(true);
    const localItems = readLocalBookings();
    const deletedIds = readDeletedIds();
    const bookingMap = new Map<string, OwnerBooking>();

    for (const item of localItems) {
      if (item && item.id && !deletedIds.has(item.id)) {
        bookingMap.set(item.id, item);
      }
    }

    try {
      // 1. Pull from public.bookings if accessible
      const resBookings = await fetch(
        'https://prorylpyuowieqpdghql.supabase.co/rest/v1/bookings?select=*&order=created_at.desc&limit=100',
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (resBookings.ok) {
        const rows = await resBookings.json();
        if (Array.isArray(rows)) {
          for (const row of rows) {
            const id = String(row.id ?? '');
            if (!id || deletedIds.has(id)) continue;
            bookingMap.set(id, {
              id,
              client_name: String(row.client_name ?? ''),
              phone: String(row.phone ?? ''),
              car_number: String(row.car_number ?? ''),
              vehicle_model: String(row.vehicle_model ?? ''),
              service: fromDbServiceName(row.service ? String(row.service) : undefined),
              preferred_date: String(row.preferred_date ?? ''),
              preferred_time: String(row.preferred_time ?? ''),
              service_mode: normalizeServiceMode(
                row.service_mode ? String(row.service_mode) : undefined
              ),
              vehicle_type: (row.vehicle_type as VehicleType) || 'Sedan',
              status: normalizeStatus(row.status ? String(row.status) : undefined),
              created_at: String(row.created_at ?? new Date().toISOString()),
            });
          }
        }
      }

      // 2. Pull real-time sync stream + public customer reviews from public.reviews
      const resReviews = await fetch(
        'https://prorylpyuowieqpdghql.supabase.co/rest/v1/reviews?select=*&order=created_at.asc&limit=200',
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (resReviews.ok) {
        const revRows = await resReviews.json();
        if (Array.isArray(revRows)) {
          const publicCustomerReviews: ReviewItem[] = [];

          for (const r of revRows) {
            const rName = String(r.reviewer_name ?? '');
            const rComment = String(r.comment ?? '');

            if (rName === SYNC_MARKER) {
              try {
                const ev = JSON.parse(rComment) as SyncEventPayload;
                if (ev.op === 'upsert' && ev.booking && ev.booking.id) {
                  if (!deletedIds.has(ev.booking.id)) {
                    bookingMap.set(ev.booking.id, ev.booking);
                  }
                } else if (ev.op === 'status' && ev.id) {
                  const existing = bookingMap.get(ev.id);
                  if (existing) {
                    bookingMap.set(ev.id, { ...existing, status: ev.status });
                  }
                } else if (ev.op === 'delete' && ev.id) {
                  deletedIds.add(ev.id);
                  bookingMap.delete(ev.id);
                }
              } catch {
                // Ignore malformed sync row
              }
            } else if (rName.trim().length > 0) {
              const parts = rName.trim().split(/\s+/);
              const initials =
                parts.length >= 2
                  ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                  : rName.slice(0, 2).toUpperCase();
              publicCustomerReviews.unshift({
                id: String(r.id),
                reviewer_name: rName,
                badge: `${Number(r.rating ?? 5)}/5 Stars`,
                time_ago: 'Verified Client',
                rating: Number(r.rating ?? 5),
                comment: rComment,
                car_model: String(r.car_serviced ?? 'Car Detailing'),
                initials,
                avatarBg: 'bg-stone-900 text-amber-300',
              });
            }
          }

          writeDeletedIds(deletedIds);

          if (publicCustomerReviews.length > 0) {
            setCustomReviews((prev) => {
              const seen = new Set<string>();
              const combined: ReviewItem[] = [];
              for (const item of [...publicCustomerReviews, ...prev]) {
                if (!seen.has(item.id) && item.reviewer_name !== SYNC_MARKER) {
                  seen.add(item.id);
                  combined.push(item);
                }
              }
              writeLocalReviews(combined);
              return combined;
            });
          }
        }
      }
    } catch {
      // Offline fallback uses localItems
    } finally {
      const mergedList = Array.from(bookingMap.values())
        .filter((b) => !deletedIds.has(b.id))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setBookings(mergedList);
      writeLocalBookings(mergedList);
      setLastSyncedAt(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      if (!silent) setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    syncBookingsFromSources(false);

    // Poll every 3.5 seconds for real-time cross-device updates
    const pollInterval = window.setInterval(() => {
      syncBookingsFromSources(true);
    }, 3500);

    const onStorage = () => {
      setBookings(readLocalBookings());
      setCustomReviews(readLocalReviews());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('avon-bookings-updated', onStorage);

    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('avon_car_spa_sync');
        channel.onmessage = () => {
          setBookings(readLocalBookings());
          setCustomReviews(readLocalReviews());
        };
      }
    } catch {
      // Ignore
    }

    return () => {
      window.clearInterval(pollInterval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('avon-bookings-updated', onStorage);
      if (channel) channel.close();
    };
  }, [syncBookingsFromSources]);

  const notifyCrossTabSync = () => {
    try {
      if ('BroadcastChannel' in window) {
        const ch = new BroadcastChannel('avon_car_spa_sync');
        ch.postMessage({ updatedAt: Date.now() });
        ch.close();
      }
    } catch {
      // Ignore
    }
  };

  // Smooth scroll helper
  const scrollToBookingForm = (selectedService?: ServiceTitle) => {
    if (selectedService) {
      setBookingForm((prev) => ({ ...prev, service: selectedService }));
      setBookingConfirmed(null);
      setServiceFlash(true);
      window.setTimeout(() => setServiceFlash(false), 1400);
    }
    const el = document.getElementById('booking-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Create Booking Handler (Used by Customer Booking Form & Admin Quick-Add)
  const createLiveBooking = async (bookingInput: BookingFormState): Promise<OwnerBooking> => {
    const newBooking: OwnerBooking = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `avon-${Date.now()}`,
      client_name: bookingInput.client_name.trim(),
      phone: bookingInput.phone.trim(),
      car_number: bookingInput.car_number.trim().toUpperCase(),
      vehicle_model: bookingInput.vehicle_model.trim() || bookingInput.vehicle_type,
      vehicle_type: bookingInput.vehicle_type,
      service: bookingInput.service,
      preferred_date: bookingInput.preferred_date || todayIso,
      preferred_time: bookingInput.preferred_time,
      service_mode: bookingInput.service_mode,
      pickup_address:
        bookingInput.service_mode === 'Pick-up & Drop Request'
          ? bookingInput.pickup_address.trim()
          : undefined,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // 1. Instant local & cross-tab update
    const updatedBookings = [newBooking, ...readLocalBookings()];
    setBookings(updatedBookings);
    writeLocalBookings(updatedBookings);
    notifyCrossTabSync();

    // 2. Persist to Supabase bookings table (using exact DB constraint strings)
    try {
      await fetch('https://prorylpyuowieqpdghql.supabase.co/rest/v1/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: newBooking.id,
          client_name: newBooking.client_name,
          phone: newBooking.phone,
          car_number: newBooking.car_number,
          vehicle_model: newBooking.vehicle_model,
          service: toDbServiceName(newBooking.service),
          preferred_date: newBooking.preferred_date,
          preferred_time: newBooking.preferred_time,
          service_mode:
            newBooking.service_mode === 'Pick-up & Drop Request'
              ? 'Pick-up & Drop Request'
              : 'Workshop Visit',
          vehicle_type: newBooking.vehicle_type,
          status: 'pending',
        }),
      });
    } catch {
      // Handled by cloud sync event below
    }

    // 3. Broadcast to real-time cloud sync stream so all devices see it within 3 seconds
    await publishCloudSyncEvent({
      op: 'upsert',
      booking: newBooking,
      ts: Date.now(),
    });

    return newBooking;
  };

  // Handle Customer Booking Form Submission
  const handleBookingSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBookingError('');

    if (
      !bookingForm.client_name.trim() ||
      !bookingForm.phone.trim() ||
      !bookingForm.car_number.trim()
    ) {
      setBookingError('Please enter your name, 10-digit phone number, and vehicle registration number.');
      return;
    }

    setSubmittingBooking(true);
    const created = await createLiveBooking(bookingForm);
    setSubmittingBooking(false);
    setBookingConfirmed(created);
  };

  // Owner Admin Actions: Update Status & Delete Booking
  const handleStatusChange = async (id: string, status: OwnerBookingStatus) => {
    const nextList = bookings.map((item) =>
      item.id === id ? { ...item, status } : item
    );
    setBookings(nextList);
    writeLocalBookings(nextList);
    notifyCrossTabSync();

    try {
      await fetch(
        `https://prorylpyuowieqpdghql.supabase.co/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ status }),
        }
      );
    } catch {
      // Synced via cloud event below
    }

    await publishCloudSyncEvent({
      op: 'status',
      id,
      status,
      ts: Date.now(),
    });
  };

  const handleDeleteBooking = async (id: string) => {
    const deletedSet = readDeletedIds();
    deletedSet.add(id);
    writeDeletedIds(deletedSet);

    const nextList = bookings.filter((item) => item.id !== id);
    setBookings(nextList);
    writeLocalBookings(nextList);
    notifyCrossTabSync();

    try {
      await fetch(
        `https://prorylpyuowieqpdghql.supabase.co/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
    } catch {
      // Synced via cloud event below
    }

    await publishCloudSyncEvent({
      op: 'delete',
      id,
      ts: Date.now(),
    });
  };

  // Handle Customer Review Submission
  const handleReviewSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reviewForm.reviewer_name.trim() || !reviewForm.comment.trim()) return;

    setSubmittingReview(true);
    const cleanName = reviewForm.reviewer_name.trim();
    const parts = cleanName.split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : cleanName.slice(0, 2).toUpperCase();

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      reviewer_name: cleanName,
      badge: `${reviewForm.rating}/5 Stars`,
      time_ago: 'Just now',
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
      car_model: reviewForm.car_model.trim() || 'Verified Customer',
      initials,
      avatarBg: 'bg-stone-900 text-amber-300',
    };

    const nextCustom = [newReview, ...customReviews];
    setCustomReviews(nextCustom);
    writeLocalReviews(nextCustom);
    notifyCrossTabSync();

    try {
      await fetch('https://prorylpyuowieqpdghql.supabase.co/rest/v1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          reviewer_name: newReview.reviewer_name,
          rating: newReview.rating,
          comment: newReview.comment,
          car_serviced: newReview.car_model || 'Car Detailing',
        }),
      });
    } catch {
      // Local sync is already complete
    }

    setSubmittingReview(false);
    setReviewForm({
      rating: 5,
      hoverRating: 0,
      reviewer_name: '',
      car_model: '',
      comment: '',
    });
    setReviewSuccess('Thank you! Your review has been posted to our wall.');
    window.setTimeout(() => setReviewSuccess(''), 5000);
  };

  // Render Standalone Light-Theme Admin Portal if on admin route or toggled
  if (isStandaloneAdmin || activeView === 'admin') {
    return (
      <StandaloneLightAdminPortal
        bookings={bookings}
        loading={loadingBookings}
        lastSyncedAt={lastSyncedAt}
        onRefresh={() => syncBookingsFromSources(false)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteBooking}
        onQuickCreateBooking={createLiveBooking}
        hideBackToWebsite={isStandaloneAdmin}
        onToggleStandaloneSimulation={() => setIsStandaloneAdmin((prev) => !prev)}
        onBackToWebsite={() => {
          setIsStandaloneAdmin(false);
          setActiveView('website');
        }}
      />
    );
  }

  const allDisplayedReviews = [...customReviews, ...VERIFIED_GOOGLE_REVIEWS];
  const totalReviewCount = 49 + customReviews.length;
  const liveConfirmedBooking = bookingConfirmed
    ? bookings.find((b) => b.id === bookingConfirmed.id) || bookingConfirmed
    : null;

  return (
    <div className="min-h-screen bg-[#111210] text-stone-100 selection:bg-amber-500 selection:text-stone-950 font-sans">
      {/* TOP UTILITY STRIP */}
      <div className="bg-[#0B0C0A] border-b border-stone-800/80 text-[11px] text-stone-400">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-stone-300 font-medium">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              No 3/16/5, 5th Main Rd, Krishna Layout, BTM 4th Stage, Bengaluru – 560114
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Open Today · 9:00 AM – 8:00 PM
            </span>
            <span className="hidden sm:inline text-stone-700">|</span>
            <a
              href="tel:07899138399"
              className="hidden sm:inline-flex items-center gap-1 font-mono font-semibold text-stone-200 hover:text-amber-400"
            >
              <Phone className="h-3 w-3 text-amber-500" />
              078991 38399
            </a>
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <header className="sticky top-0 z-50 border-b border-stone-800 bg-[#111210]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-stone-950 font-black text-lg tracking-tighter">
              A
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  AVON CAR SPA
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded bg-stone-800 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-stone-700">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  5.0 ({totalReviewCount})
                </span>
              </div>
              <p className="text-[11px] text-stone-400 tracking-wide">
                 automotive detailing &amp; foam wash studio · btm 4th stage
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-300">
            <a href="#services-section" className="hover:text-amber-400 transition-colors">
              Services &amp; Tariff
            </a>
            <a href="#booking-section" className="hover:text-amber-400 transition-colors">
              Reserve a Bay
            </a>
            <a href="#reviews-section" className="hover:text-amber-400 transition-colors">
              Customer Reviews
            </a>
            <a href="#location-section" className="hover:text-amber-400 transition-colors">
              Workshop Map
            </a>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            <a
              href="tel:07899138399"
              className="inline-flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-900 hover:border-stone-500 px-3.5 py-2.5 text-xs font-mono font-semibold text-stone-200 transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-amber-500" />
              078991 38399
            </a>
            <button
              type="button"
              onClick={() => scrollToBookingForm()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-stone-950 transition-colors"
            >
              Book Now
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle Menu"
            className="md:hidden inline-flex items-center justify-center rounded-lg border border-stone-700 bg-stone-900 p-2.5 text-stone-200"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-stone-800 bg-[#161714] px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              <a
                href="#services-section"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg bg-stone-900 border border-stone-800 px-3 py-2.5 text-stone-200"
              >
                Services
              </a>
              <a
                href="#booking-section"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg bg-stone-900 border border-stone-800 px-3 py-2.5 text-stone-200"
              >
                Book Slot
              </a>
              <a
                href="#reviews-section"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg bg-stone-900 border border-stone-800 px-3 py-2.5 text-stone-200"
              >
                5.0★ Reviews
              </a>
              <a
                href="#location-section"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg bg-stone-900 border border-stone-800 px-3 py-2.5 text-stone-200"
              >
                Location
              </a>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-stone-800">
              <a
                href="tel:07899138399"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-700 bg-stone-900 py-2.5 text-xs font-mono font-semibold text-white"
              >
                <Phone className="h-4 w-4 text-amber-500" />
                Call 078991 38399
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  setActiveView('admin');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-700 bg-stone-950 py-2.5 text-xs font-semibold text-stone-300"
              >
                <LayoutDashboard className="h-4 w-4" />
                Open Admin Portal (Light Theme)
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          1. HERO SECTION WITH 6-SECOND (6000ms) LUXURY CAR SLIDER
         ===================================================================== */}
      <section id="top" className="relative min-h-[600px] lg:min-h-[660px] flex items-center overflow-hidden border-b border-stone-800">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === heroSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
              }`}
            >
              <img
                src={slide.image}
                alt={`${slide.car} at Avon Car Spa Bengaluru`}
                className={`h-full w-full object-cover object-center transition-transform duration-1000 ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0E0F0D]/95 via-[#0E0F0D]/80 to-[#0E0F0D]/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111210] via-transparent to-black/40" />
            </div>
          );
        })}

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 rounded border border-stone-700/90 bg-stone-950/85 px-3 py-1.5 text-xs text-stone-300 backdrop-blur-sm mb-6">
              <span className="font-mono font-bold text-amber-400">
                {HERO_SLIDES[heroSlide].car}
              </span>
              <span className="text-stone-600">·</span>
              <span className="text-stone-300">{HERO_SLIDES[heroSlide].bayLabel}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight text-white leading-[1.06]">
              {HERO_SLIDES[heroSlide].headline}{' '}
              <span className="text-amber-400">
                {HERO_SLIDES[heroSlide].accent}
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-stone-300 leading-relaxed max-w-xl font-normal">
              {HERO_SLIDES[heroSlide].subtitle}
            </p>

            {/* Primary CTA Button */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => scrollToBookingForm()}
                className="inline-flex items-center gap-3 rounded-xl bg-amber-500 hover:bg-amber-400 px-7 py-4 text-sm sm:text-base font-extrabold text-stone-950 shadow-lg transition-all"
              >
                Book Your Car Spa Now
                <ArrowRight className="h-5 w-5" />
              </button>

              <a
                href="#services-section"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-600 bg-stone-900/80 hover:bg-stone-800 px-6 py-4 text-sm font-semibold text-stone-100 backdrop-blur-sm transition-colors"
              >
                Explore 5 Detailing Packages
              </a>
            </div>

            {/* Grounded Studio Facts */}
            <div className="mt-12 pt-7 border-t border-stone-800/90 grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  5.0 ★ Google Rating
                </div>
                <p className="text-stone-400 mt-0.5">{totalReviewCount} verified local customer reviews</p>
              </div>

              <div>
                <div className="font-bold text-white">BTM Layout 4th Stage</div>
                <p className="text-stone-400 mt-0.5">5th Main Rd, Krishna Layout · 560114</p>
              </div>

              <div>
                <div className="font-bold text-white">Workshop &amp; Home Pick-up</div>
                <p className="text-stone-400 mt-0.5">Dedicated bay slots · Open till 8 PM</p>
              </div>
            </div>
          </div>

          {/* 6-Second Car Switcher Strip */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {HERO_SLIDES.map((s, idx) => {
                const active = idx === heroSlide;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setHeroSlide(idx)}
                    className={`rounded-lg border px-3.5 py-2 text-left transition-all ${
                      active
                        ? 'border-amber-400 bg-stone-900 text-white'
                        : 'border-stone-800 bg-stone-950/70 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="font-mono text-amber-400">0{idx + 1}</span>
                      <span>{s.car}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setHeroSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
                }
                aria-label="Previous luxury car slide"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-700 bg-stone-900/90 hover:bg-stone-800 text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)
                }
                aria-label="Next luxury car slide"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-700 bg-stone-900/90 hover:bg-stone-800 text-white transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. VISUAL SERVICE SELECTION ("WHAT DO YOU WANT DONE TO YOUR CAR?")
         ===================================================================== */}
      <section id="services-section" className="py-20 bg-[#F5F3EE] text-stone-900 border-b border-stone-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-stone-300">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-amber-800">
                STUDIO MENU &amp; TARIFF GUIDE
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-stone-950 tracking-tight">
                What Do You Want Done To Your Car?
              </h2>
            </div>
            <p className="text-sm text-stone-600 max-w-md">
              Select any treatment below to pre-fill your service package in the booking sheet right below this section.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES_DATA.map((service) => {
              const IconComponent = service.icon;
              const isSelected = bookingForm.service === service.title;

              return (
                <article
                  key={service.id}
                  className={`group flex flex-col rounded-2xl bg-white border transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'border-stone-950 ring-2 ring-stone-950 shadow-lg'
                      : 'border-stone-200/90 hover:border-stone-400 shadow-sm'
                  }`}
                >
                  <div className="relative h-48 w-full overflow-hidden bg-stone-900">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="rounded bg-stone-950/90 px-2 py-0.5 font-mono text-xs font-bold text-amber-400">
                        {service.number}
                      </span>
                      <span className="rounded bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-stone-900">
                        {service.badge}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        Selected
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded bg-black/75 px-2.5 py-1 font-medium text-stone-100">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        {service.duration}
                      </span>
                      <span className="rounded bg-amber-400 px-2.5 py-1 font-mono font-extrabold text-stone-950">
                        {service.priceLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-1.5">
                      <IconComponent className="h-4 w-4" />
                      <span>{service.tagline}</span>
                    </div>

                    <h3 className="text-xl font-extrabold text-stone-950 leading-snug">
                      {service.title}
                    </h3>

                    <p className="mt-2.5 text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {service.description}
                    </p>

                    <ul className="mt-4 space-y-1.5 pt-4 border-t border-stone-200 text-xs text-stone-700 font-medium">
                      {service.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0 stroke-[2.5]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-6">
                      <button
                        type="button"
                        onClick={() => scrollToBookingForm(service.title)}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                          isSelected
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            : 'bg-stone-950 hover:bg-stone-800 text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-4 w-4 stroke-[2.5]" />
                            Selected · Proceed to Booking
                          </>
                        ) : (
                          <>
                            Select Service
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. CENTERED RESERVATION & BOOKING SECTION (RIGHT IN THE MIDDLE)
         ===================================================================== */}
      <section
        id="booking-section"
        className="relative py-20 bg-[#141513] border-b border-stone-800"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 rounded border border-stone-700 bg-stone-900 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
              <Calendar className="h-3.5 w-3.5" />
              Direct Workshop Job Sheet · Real-Time Sync
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Book Your Appointment / Slot Reservation
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-stone-400">
              Reserve your bay slot at BTM Layout 4th Stage or request vehicle Pick-up &amp; Drop. Goes straight to our live workshop board.
            </p>
          </div>

          {/* CENTERED CONTAINER max-w-2xl mx-auto */}
          <div
            className={`max-w-2xl mx-auto rounded-2xl border bg-[#1C1D1A] p-6 sm:p-10 shadow-2xl transition-all duration-300 ${
              serviceFlash
                ? 'border-amber-400 ring-2 ring-amber-400/40'
                : 'border-stone-700/90'
            }`}
          >
            {liveConfirmedBooking ? (
              <div className="py-4 space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                        Job Card Registered · Live Sync Active
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                        Slot Reserved for {liveConfirmedBooking.car_number}
                      </h3>
                    </div>
                  </div>
                  <StatusBadge status={liveConfirmedBooking.status} />
                </div>

                <div className="rounded-xl border border-stone-800 bg-[#121311] p-5 text-xs sm:text-sm space-y-3">
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Client Name &amp; Phone:</span>
                    <span className="font-semibold text-white">
                      {liveConfirmedBooking.client_name} ({liveConfirmedBooking.phone})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Vehicle Registration:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {liveConfirmedBooking.car_number} · {liveConfirmedBooking.vehicle_type}
                      {liveConfirmedBooking.vehicle_model
                        ? ` (${liveConfirmedBooking.vehicle_model})`
                        : ''}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Selected Treatment:</span>
                    <span className="font-bold text-white">{liveConfirmedBooking.service}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/80">
                    <span className="text-stone-400">Date &amp; Time Slot:</span>
                    <span className="font-semibold text-white">
                      {liveConfirmedBooking.preferred_date} · {liveConfirmedBooking.preferred_time}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-400">Service Mode:</span>
                    <span className="font-bold text-emerald-400">
                      {liveConfirmedBooking.service_mode}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <a
                    href={buildCustomerToStudioWhatsAppUrl(liveConfirmedBooking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 text-xs sm:text-sm font-bold text-white transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Send Slot Details on WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingConfirmed(null);
                      setBookingForm((prev) => ({
                        ...prev,
                        client_name: '',
                        phone: '',
                        car_number: '',
                        vehicle_model: '',
                        pickup_address: '',
                      }));
                    }}
                    className="w-full sm:w-auto rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 px-5 py-3.5 text-xs sm:text-sm font-bold text-stone-200 transition-colors"
                  >
                    Book Another Car
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                {bookingError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-xs font-semibold text-rose-200">
                    {bookingError}
                  </div>
                )}

                {/* Selected Service Dropdown + Interactive Pills */}
                <div>
                  <label
                    htmlFor="booking-service-select"
                    className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2"
                  >
                    1. Selected Car Spa Service
                  </label>
                  <select
                    id="booking-service-select"
                    value={bookingForm.service}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        service: e.target.value as ServiceTitle,
                      }))
                    }
                    className="w-full rounded-xl border border-stone-700 bg-[#111210] px-4 py-3.5 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
                  >
                    {SERVICES_DATA.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title} ({s.priceLabel})
                      </option>
                    ))}
                  </select>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {SERVICES_DATA.map((s) => {
                      const active = bookingForm.service === s.title;
                      return (
                        <button
                          key={`pill-${s.id}`}
                          type="button"
                          onClick={() =>
                            setBookingForm((prev) => ({ ...prev, service: s.title }))
                          }
                          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                            active
                              ? 'bg-amber-500 text-stone-950 font-bold'
                              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                          }`}
                        >
                          {s.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Client Full Name & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="client-name-input"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2"
                    >
                      Client Full Name *
                    </label>
                    <input
                      id="client-name-input"
                      type="text"
                      required
                      value={bookingForm.client_name}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, client_name: e.target.value }))
                      }
                      placeholder="e.g., Pradeep Shetty"
                      className="w-full rounded-xl border border-stone-700 bg-[#111210] px-4 py-3 text-sm text-white placeholder-stone-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="client-phone-input"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2"
                    >
                      Phone Number (WhatsApp) *
                    </label>
                    <input
                      id="client-phone-input"
                      type="tel"
                      required
                      value={bookingForm.phone}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="e.g., 98450 12345"
                      className="w-full rounded-xl border border-stone-700 bg-[#111210] px-4 py-3 font-mono text-sm text-white placeholder-stone-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Car Registration Number, Vehicle Type & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="car-reg-input"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2"
                    >
                      Car Reg Number *
                    </label>
                    <input
                      id="car-reg-input"
                      type="text"
                      required
                      value={bookingForm.car_number}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          car_number: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="KA 05 MN 4512"
                      className="w-full rounded-xl border border-stone-700 bg-[#111210] px-4 py-3 font-mono text-sm uppercase text-white placeholder-stone-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vehicle-type-select"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2"
                    >
                      Vehicle Type *
                    </label>
                    <select
                      id="vehicle-type-select"
                      value={bookingForm.vehicle_type}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          vehicle_type: e.target.value as VehicleType,
                        }))
                      }
                      className="w-full rounded-xl border border-stone-700 bg-[#111210] px-4 py-3 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none"
                    >
                      {VEHICLE_TYPES.map((vt) => (
                        <option key={vt} value={vt}>
                          {vt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="vehicle-model-input"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2"
                    >
                      Car Make / Model
                    </label>
                    <input
                      id="vehicle-model-input"
                      type="text"
                      value={bookingForm.vehicle_model}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, vehicle_model: e.target.value }))
                      }
                      placeholder="e.g., Innova Hycross / Polo"
                      className="w-full rounded-xl border border-stone-700 bg-[#111210] px-4 py-3 text-sm text-white placeholder-stone-500 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Preferred Date & Time Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="preferred-date-input"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2"
                    >
                      Preferred Date *
                    </label>
                    <input
                      id="preferred-date-input"
                      type="date"
                      required
                      min={todayIso}
                      value={bookingForm.preferred_date}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, preferred_date: e.target.value }))
                      }
                      className="w-full rounded-xl border border-stone-700 bg-[#111210] px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="preferred-time-select"
                      className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2"
                    >
                      Preferred Time Slot *
                    </label>
                    <select
                      id="preferred-time-select"
                      value={bookingForm.preferred_time}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, preferred_time: e.target.value }))
                      }
                      className="w-full rounded-xl border border-stone-700 bg-[#111210] px-4 py-3 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Service Mode Radio Buttons */}
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2.5">
                    Service Mode *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                        bookingForm.service_mode === 'Workshop Visit (Slot Reservation)'
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-stone-700 bg-[#111210] hover:border-stone-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="service_mode"
                        value="Workshop Visit (Slot Reservation)"
                        checked={bookingForm.service_mode === 'Workshop Visit (Slot Reservation)'}
                        onChange={() =>
                          setBookingForm((prev) => ({
                            ...prev,
                            service_mode: 'Workshop Visit (Slot Reservation)',
                          }))
                        }
                        className="mt-1 h-4 w-4 accent-amber-500"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                          <Wrench className="h-4 w-4 text-amber-400" />
                          Workshop Visit (Slot Reservation)
                        </div>
                        <p className="mt-1 text-xs text-stone-400">
                          Bring your vehicle to our 5th Main Rd, BTM 4th Stage bay at your chosen slot.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                        bookingForm.service_mode === 'Pick-up & Drop Request'
                          ? 'border-emerald-400 bg-emerald-500/10'
                          : 'border-stone-700 bg-[#111210] hover:border-stone-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="service_mode"
                        value="Pick-up & Drop Request"
                        checked={bookingForm.service_mode === 'Pick-up & Drop Request'}
                        onChange={() =>
                          setBookingForm((prev) => ({
                            ...prev,
                            service_mode: 'Pick-up & Drop Request',
                          }))
                        }
                        className="mt-1 h-4 w-4 accent-emerald-500"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                          <Truck className="h-4 w-4 text-emerald-400" />
                          Pick-up &amp; Drop Request
                        </div>
                        <p className="mt-1 text-xs text-stone-400">
                          Our driver collects and drops your car across BTM Layout, HSR &amp; Bannerghatta Rd.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {bookingForm.service_mode === 'Pick-up & Drop Request' && (
                  <div>
                    <label
                      htmlFor="pickup-address-input"
                      className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2"
                    >
                      Pick-up Address / Landmark in Bengaluru
                    </label>
                    <input
                      id="pickup-address-input"
                      type="text"
                      value={bookingForm.pickup_address}
                      onChange={(e) =>
                        setBookingForm((prev) => ({ ...prev, pickup_address: e.target.value }))
                      }
                      placeholder="e.g., Apartment / House No, BTM 4th Stage, near Devarachikkana Halli"
                      className="w-full rounded-xl border border-emerald-500/40 bg-[#111210] px-4 py-3 text-sm text-white placeholder-stone-500 focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-4 text-base font-extrabold text-stone-950 shadow-lg transition-all disabled:opacity-60"
                >
                  {submittingBooking
                    ? 'Registering Slot on Workshop Board...'
                    : 'Confirm Booking & Reserve Slot'}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. HIGH-VISIBILITY CUSTOMER REVIEWS & INTERACTIVE "RATE US" SECTION
         ===================================================================== */}
      <section id="reviews-section" className="py-20 bg-[#F5F3EE] text-stone-900 border-b border-stone-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Verified 5.0 Rating (49 Reviews) Summary Header */}
          <div className="rounded-2xl bg-white border border-stone-300 p-6 sm:p-8 shadow-sm mb-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-stone-950 text-white">
                <span className="font-mono text-3xl font-extrabold text-amber-400 leading-none">
                  5.0
                </span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-stone-300">
                  Google
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <Star key={st} className="h-5 w-5 fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <span className="rounded bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-900 border border-emerald-300">
                    5.0 Rating ({totalReviewCount} Reviews)
                  </span>
                </div>
                <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-stone-950">
                  What Regulars Say About Avon Car Spa
                </h2>
                <p className="mt-1 text-sm text-stone-600">
                  Unfiltered feedback from car owners across BTM Layout, Devarachikkana Halli, and South Bengaluru.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => reviewInputRef.current?.focus()}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-950 hover:bg-stone-800 px-5 py-3 text-xs sm:text-sm font-bold text-white transition-colors shrink-0"
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Rate Us / Write a Review
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Customer Review Cards Grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {allDisplayedReviews.map((rev) => (
                <article
                  key={rev.id}
                  className="flex flex-col justify-between rounded-2xl bg-white border border-stone-300 p-6 shadow-sm hover:border-stone-500 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${rev.avatarBg} font-mono text-sm font-extrabold`}
                        >
                          {rev.initials}
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-stone-950">
                            {rev.reviewer_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-stone-500">
                            <span>{rev.badge}</span>
                            <span>·</span>
                            <span>{rev.time_ago}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star
                          key={st}
                          className={`h-4 w-4 ${
                            st <= rev.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'fill-stone-200 text-stone-200'
                          }`}
                        />
                      ))}
                      <span className="ml-1.5 font-mono text-xs font-bold text-stone-700">
                        {rev.rating}.0 / 5.0
                      </span>
                    </div>

                    <blockquote className="mt-3 text-base font-medium text-stone-900 leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </blockquote>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                      <UserCheck className="h-3.5 w-3.5" />
                      Verified Customer
                    </span>
                    {rev.car_model && (
                      <span className="text-stone-500 font-medium">{rev.car_model}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Interactive "Rate Us / Write a Review" Card */}
            <div className="lg:col-span-5 rounded-2xl bg-white border-2 border-stone-900 p-6 sm:p-8 shadow-lg">
              <div className="inline-flex items-center gap-1.5 rounded bg-amber-100 px-2.5 py-1 font-mono text-xs font-bold text-amber-900">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
                PUBLIC CUSTOMER LOGBOOK
              </div>
              <h3 className="mt-3 text-2xl font-extrabold text-stone-950">
                Rate Us / Write a Review
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-stone-600">
                Had your car washed or detailed at our BTM 4th Stage studio? Leave your rating below—it publishes straight to our live customer wall.
              </p>

              {reviewSuccess && (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-300 p-3.5 text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                    Tap Your Star Rating *
                  </span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const active =
                        starValue <= (reviewForm.hoverRating || reviewForm.rating);
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() =>
                            setReviewForm((prev) => ({ ...prev, rating: starValue }))
                          }
                          onMouseEnter={() =>
                            setReviewForm((prev) => ({ ...prev, hoverRating: starValue }))
                          }
                          onMouseLeave={() =>
                            setReviewForm((prev) => ({ ...prev, hoverRating: 0 }))
                          }
                          aria-label={`Rate ${starValue} out of 5 stars`}
                          className="rounded-lg border border-stone-300 bg-stone-50 hover:bg-amber-50 p-2.5 transition-transform hover:scale-105"
                        >
                          <Star
                            className={`h-6 w-6 transition-colors ${
                              active
                                ? 'fill-amber-400 text-amber-500'
                                : 'fill-stone-200 text-stone-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 font-mono text-sm font-extrabold text-stone-900">
                      {reviewForm.rating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reviewer-name-input"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                  >
                    Your Name *
                  </label>
                  <input
                    ref={reviewInputRef}
                    id="reviewer-name-input"
                    type="text"
                    required
                    value={reviewForm.reviewer_name}
                    onChange={(e) =>
                      setReviewForm((prev) => ({ ...prev, reviewer_name: e.target.value }))
                    }
                    placeholder="e.g., Karthik Gowda"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reviewer-car-input"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                  >
                    Car Model *
                  </label>
                  <input
                    id="reviewer-car-input"
                    type="text"
                    required
                    value={reviewForm.car_model}
                    onChange={(e) =>
                      setReviewForm((prev) => ({ ...prev, car_model: e.target.value }))
                    }
                    placeholder="e.g., Skoda Kushaq / Swift"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reviewer-comment-input"
                    className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
                  >
                    Your Review *
                  </label>
                  <textarea
                    id="reviewer-comment-input"
                    rows={3}
                    required
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
                    }
                    placeholder="How was the wash quality, attention to detail, and pricing?"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-stone-950 hover:bg-stone-800 px-5 py-3.5 text-sm font-extrabold text-white transition-colors disabled:opacity-60"
                >
                  {submittingReview ? 'Posting Review...' : 'Post Verified Review Live'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. LOCATION & CONTACT SECTION
         ===================================================================== */}
      <section id="location-section" className="py-20 bg-[#111210]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-stone-800 bg-[#181916] p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <span className="inline-flex items-center gap-2 rounded border border-stone-700 bg-stone-900 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
                  <MapPin className="h-3.5 w-3.5" />
                  BTM LAYOUT 4TH STAGE · BENGALURU
                </span>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Visit Avon Car Spa Workshop
                </h2>

                <div className="space-y-3 text-sm sm:text-base text-stone-300">
                  <p className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white block">Workshop Address:</strong>
                      No 3/16/5, 5th Main Road, Krishna Layout, BTM Layout 4th Stage, Devarachikkana Halli, Bengaluru - 560114
                    </span>
                  </p>

                  <p className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>
                      <strong className="text-emerald-400">Open · Closes 8 PM</strong> (All 7 Days · 9:00 AM – 8:00 PM)
                    </span>
                  </p>

                  <p className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-amber-400 shrink-0" />
                    <span>
                      Direct Workshop Desk:{' '}
                      <a
                        href="tel:07899138399"
                        className="font-mono font-bold text-white underline decoration-amber-400"
                      >
                        078991 38399
                      </a>
                    </span>
                  </p>
                </div>

                <div className="pt-3 flex flex-wrap items-center gap-4">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Avon+Car+Spa+No+3%2F16%2F5+5th+Main+Road+Krishna+Layout+BTM+Layout+4th+Stage+Devarachikkana+Halli+Bengaluru+560114"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-4 text-sm font-extrabold text-stone-950 transition-all"
                  >
                    <Navigation className="h-4 w-4" />
                    Google Maps Directions
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </a>

                  <a
                    href="tel:07899138399"
                    className="inline-flex items-center gap-2.5 rounded-xl border border-stone-600 bg-stone-900 hover:bg-stone-800 px-6 py-4 font-mono text-sm font-bold text-white transition-all"
                  >
                    <Phone className="h-4 w-4 text-amber-400" />
                    Call 078991 38399
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-xl border border-stone-800 bg-[#111210] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-stone-400">
                      SERVICE BAY DETAILS
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      Krishna Layout, Devarachikkana Halli
                    </h3>
                  </div>
                  <span className="rounded bg-emerald-950 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-800">
                    Open · Closes 8 PM
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-stone-900/90 p-3.5 border border-stone-800">
                    <div className="text-stone-400">Working Hours</div>
                    <div className="font-bold text-white mt-1">9:00 AM – 8:00 PM</div>
                  </div>
                  <div className="rounded-lg bg-stone-900/90 p-3.5 border border-stone-800">
                    <div className="text-stone-400">Postal Code</div>
                    <div className="font-mono font-bold text-white mt-1">560114</div>
                  </div>
                  <div className="rounded-lg bg-stone-900/90 p-3.5 border border-stone-800">
                    <div className="text-stone-400">Home Pick-up</div>
                    <div className="font-bold text-emerald-400 mt-1">BTM &amp; Nearby</div>
                  </div>
                  <div className="rounded-lg bg-stone-900/90 p-3.5 border border-stone-800">
                    <div className="text-stone-400">Google Rating</div>
                    <div className="font-bold text-amber-400 mt-1">5.0 ★ ({totalReviewCount})</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => scrollToBookingForm()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-900 hover:bg-stone-800 py-3 text-xs font-bold text-white transition-colors"
                >
                  Reserve a Studio Slot Now
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-stone-800 bg-[#0B0C0A] py-10 text-xs text-stone-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500 text-stone-950 font-black">
              A
            </div>
            <div>
              <span className="font-bold text-white">AVON CAR SPA</span> · No 3/16/5, 5th Main Road, Krishna Layout, BTM Layout 4th Stage, Devarachikkana Halli, Bengaluru - 560114
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a href="tel:07899138399" className="font-mono hover:text-white transition-colors">
              078991 38399
            </a>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="inline-flex items-center gap-1.5 font-semibold text-stone-300 hover:text-amber-400"
            >
              <Lock className="h-3.5 w-3.5" />
              Admin Portal (/admin)
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setIsStandaloneAdmin(true);
                setActiveView('admin');
              }}
              className="inline-flex items-center gap-1.5 font-semibold text-stone-400 hover:text-white"
            >
              <Globe className="h-3.5 w-3.5" />
              Standalone Admin Domain Mode
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================================
   6. STANDALONE LIGHT-THEME ADMIN PORTAL
   - Clean white cards (#FFFFFF) on a soft cool-slate background (#F8FAFC)
   - Deep slate typography & royal blue/emerald status badges (NO dark mode)
   - Secured with permanent confidential PIN `jeevan9002`
   - Real-Time Sync + Search Filter + Walk-in Quick Add + CSV Export
   ============================================================================ */
function StandaloneLightAdminPortal({
  bookings,
  loading,
  lastSyncedAt,
  onRefresh,
  onStatusChange,
  onDelete,
  onQuickCreateBooking,
  hideBackToWebsite,
  onToggleStandaloneSimulation,
  onBackToWebsite,
}: {
  bookings: OwnerBooking[];
  loading: boolean;
  lastSyncedAt: string;
  onRefresh: () => void;
  onStatusChange: (id: string, status: OwnerBookingStatus) => void;
  onDelete: (id: string) => void;
  onQuickCreateBooking: (input: BookingFormState) => Promise<OwnerBooking>;
  hideBackToWebsite: boolean;
  onToggleStandaloneSimulation: () => void;
  onBackToWebsite: () => void;
}) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return window.sessionStorage.getItem(STORAGE_ADMIN_UNLOCKED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Live Operational Filters & Walk-In Modal
  const [searchQuery, setSearchQuery] = useState('');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const todayIso = new Date().toISOString().split('T')[0];
  const [walkInForm, setWalkInForm] = useState<BookingFormState>({
    client_name: '',
    phone: '',
    car_number: '',
    vehicle_model: '',
    vehicle_type: 'Sedan',
    service: 'Exterior Foam & High-Pressure Wash',
    preferred_date: todayIso,
    preferred_time: '11:00 AM – 01:00 PM',
    service_mode: 'Workshop Visit (Slot Reservation)',
    pickup_address: '',
  });
  const [savingWalkIn, setSavingWalkIn] = useState(false);

  const handlePinSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setUnlocked(true);
      setPinError('');
      try {
        window.sessionStorage.setItem(STORAGE_ADMIN_UNLOCKED_KEY, 'true');
      } catch {
        // Ignore
      }
    } else {
      setPinError('Invalid Owner Security PIN. Access denied.');
    }
  };

  const handleLockPortal = () => {
    setUnlocked(false);
    setPinInput('');
    try {
      window.sessionStorage.removeItem(STORAGE_ADMIN_UNLOCKED_KEY);
    } catch {
      // Ignore
    }
  };

  const handleWalkInSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!walkInForm.client_name.trim() || !walkInForm.phone.trim() || !walkInForm.car_number.trim()) {
      return;
    }
    setSavingWalkIn(true);
    await onQuickCreateBooking(walkInForm);
    setSavingWalkIn(false);
    setShowWalkInModal(false);
    setWalkInForm({
      client_name: '',
      phone: '',
      car_number: '',
      vehicle_model: '',
      vehicle_type: 'Sedan',
      service: 'Exterior Foam & High-Pressure Wash',
      preferred_date: todayIso,
      preferred_time: '11:00 AM – 01:00 PM',
      service_mode: 'Workshop Visit (Slot Reservation)',
      pickup_address: '',
    });
  };

  const exportBookingsCsv = () => {
    if (bookings.length === 0) return;
    const headers = [
      'Client Name',
      'Phone',
      'Car Reg No',
      'Vehicle Type',
      'Car Model',
      'Service Package',
      'Preferred Date',
      'Preferred Time',
      'Service Mode',
      'Status',
      'Booked At',
    ];
    const rows = bookings.map((b) => [
      `"${b.client_name.replace(/"/g, '""')}"`,
      `"${b.phone}"`,
      `"${b.car_number}"`,
      `"${b.vehicle_type}"`,
      `"${(b.vehicle_model || '').replace(/"/g, '""')}"`,
      `"${b.service}"`,
      `"${b.preferred_date}"`,
      `"${b.preferred_time}"`,
      `"${b.service_mode}"`,
      `"${b.status}"`,
      `"${b.created_at}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `avon-car-spa-bookings-${todayIso}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center items-center px-4 py-12 font-sans">
        <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  AVON CAR SPA
                </h1>
                <p className="text-xs font-medium text-slate-500">
                  BTM 4th Stage · Workshop Dispatch Desk
                </p>
              </div>
            </div>
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
              Staff Only
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900">
            Owner Security Access
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            Authorized staff only. Enter your confidential owner security PIN to unlock live bookings, slot reservations, and pick-up requests.
          </p>

          {pinError && (
            <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-bold text-rose-700">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-pin-field"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2"
              >
                Security PIN
              </label>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-pin-field"
                  type="password"
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter confidential owner PIN..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-colors"
            >
              <Lock className="h-4 w-4" />
              Unlock Owner Dashboard
            </button>
          </form>

          {!hideBackToWebsite && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onBackToWebsite}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Return to Customer Website
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.client_name.toLowerCase().includes(q) ||
      b.phone.toLowerCase().includes(q) ||
      b.car_number.toLowerCase().includes(q) ||
      b.service.toLowerCase().includes(q)
    );
  });

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const inProgressCount = bookings.filter((b) => b.status === 'in_progress').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  const slotReservations = filteredBookings.filter(
    (b) => b.service_mode === 'Workshop Visit (Slot Reservation)'
  );
  const pickupRequests = filteredBookings.filter(
    (b) => b.service_mode === 'Pick-up & Drop Request'
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Top Light-Theme Operations Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white font-extrabold">
              A
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Avon Car Spa · Workshop Dispatch Board
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Auto-Syncing ({lastSyncedAt})
                </span>
              </div>
              <p className="text-xs text-slate-500">
                No 3/16/5, 5th Main Rd, Krishna Layout, BTM 4th Stage · Desk: 078991 38399
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWalkInModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Walk-In / Call Booking
            </button>

            <button
              type="button"
              onClick={exportBookingsCsv}
              disabled={bookings.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 text-slate-600" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              Sync Now
            </button>

            <button
              type="button"
              onClick={onToggleStandaloneSimulation}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-2 text-[11px] font-semibold text-slate-600 transition-colors"
              title="Toggle standalone domain view"
            >
              <Globe className="h-3.5 w-3.5 text-blue-600" />
              {hideBackToWebsite ? 'Standalone: ON' : 'Standalone: OFF'}
            </button>

            {!hideBackToWebsite && (
              <button
                type="button"
                onClick={onBackToWebsite}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 text-xs font-bold text-blue-700 transition-colors"
              >
                <Car className="h-3.5 w-3.5" />
                Back to Website
              </button>
            )}

            <button
              type="button"
              onClick={handleLockPortal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Lock Portal
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Walk-In / Phone Booking Quick-Add Modal */}
        {showWalkInModal && (
          <section className="rounded-2xl bg-white border-2 border-blue-600/30 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Log New Walk-In / Phone Booking
                </h2>
                <p className="text-xs text-slate-500">
                  Add a vehicle directly to the live workshop board.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWalkInModal(false)}
                aria-label="Close walk-in form"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={walkInForm.client_name}
                  onChange={(e) => setWalkInForm((p) => ({ ...p, client_name: e.target.value }))}
                  placeholder="Client Name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={walkInForm.phone}
                  onChange={(e) => setWalkInForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="10-digit mobile"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Car Reg No *</label>
                <input
                  type="text"
                  required
                  value={walkInForm.car_number}
                  onChange={(e) =>
                    setWalkInForm((p) => ({ ...p, car_number: e.target.value.toUpperCase() }))
                  }
                  placeholder="KA 05 AB 1234"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vehicle Type</label>
                <select
                  value={walkInForm.vehicle_type}
                  onChange={(e) =>
                    setWalkInForm((p) => ({ ...p, vehicle_type: e.target.value as VehicleType }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-900"
                >
                  {VEHICLE_TYPES.map((vt) => (
                    <option key={vt} value={vt}>
                      {vt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Service Package</label>
                <select
                  value={walkInForm.service}
                  onChange={(e) =>
                    setWalkInForm((p) => ({ ...p, service: e.target.value as ServiceTitle }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-900"
                >
                  {SERVICES_DATA.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                <select
                  value={walkInForm.preferred_time}
                  onChange={(e) => setWalkInForm((p) => ({ ...p, preferred_time: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-900"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mode</label>
                <select
                  value={walkInForm.service_mode}
                  onChange={(e) =>
                    setWalkInForm((p) => ({ ...p, service_mode: e.target.value as ServiceMode }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-900"
                >
                  <option value="Workshop Visit (Slot Reservation)">
                    Workshop Visit (Slot Reservation)
                  </option>
                  <option value="Pick-up & Drop Request">Pick-up &amp; Drop Request</option>
                </select>
              </div>
              <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWalkIn}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 font-bold text-white"
                >
                  {savingWalkIn ? 'Saving...' : 'Add to Live Board'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* KPI Summary & Search Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Active Queue
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <strong className="font-mono text-2xl font-extrabold text-slate-900">
                  {bookings.length}
                </strong>
                <span className="text-[11px] font-semibold text-emerald-600">Live</span>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                New / Pending
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <strong className="font-mono text-2xl font-extrabold text-amber-600">
                  {pendingCount}
                </strong>
                <span className="text-[11px] text-slate-500">To Confirm</span>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                In Wash / Bay
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <strong className="font-mono text-2xl font-extrabold text-blue-600">
                  {inProgressCount}
                </strong>
                <span className="text-[11px] text-slate-500">Working</span>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Completed
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <strong className="font-mono text-2xl font-extrabold text-emerald-600">
                  {completedCount}
                </strong>
                <span className="text-[11px] text-slate-500">Handed Over</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Car No (KA 05...), Name or Phone..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs font-medium text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3-COLUMN LIVE MANAGEMENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* COLUMN 1: ONLINE BOOKINGS & ORDERS */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Online Bookings &amp; Orders
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    All incoming job cards with timestamp
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center justify-center rounded-md bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-700 border border-blue-200">
                {filteredBookings.length}
              </span>
            </div>

            <div className="p-4 space-y-3.5 max-h-[720px] overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Syncing live bookings...
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <Car className="mx-auto h-7 w-7 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    No Active Bookings in Queue
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    New customer bookings from the website appear here automatically every 3 seconds.
                  </p>
                </div>
              ) : (
                filteredBookings.map((booking) => (
                  <article
                    key={`col1-${booking.id}`}
                    className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <span className="inline-block text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {booking.service}
                      </span>
                      <StatusBadge status={booking.status} />
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {booking.client_name}
                        </span>
                        <a
                          href={`tel:${booking.phone}`}
                          className="font-mono font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {booking.phone}
                        </a>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Car className="h-3.5 w-3.5 text-slate-500" />
                          {booking.car_number}
                        </span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {booking.vehicle_type}
                          {booking.vehicle_model ? ` · ${booking.vehicle_model}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>{booking.service_mode}</span>
                        <span>{formatTimestamp(booking.created_at)}</span>
                      </div>
                    </div>

                    <OwnerCardControls
                      booking={booking}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                    />
                  </article>
                ))
              )}
            </div>
          </section>

          {/* COLUMN 2: SLOT RESERVATIONS */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Slot Reservations
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Workshop bay visits by date &amp; time slot
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center justify-center rounded-md bg-indigo-50 px-2.5 py-0.5 font-mono text-xs font-bold text-indigo-700 border border-indigo-200">
                {slotReservations.length}
              </span>
            </div>

            <div className="p-4 space-y-3.5 max-h-[720px] overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Syncing slot reservations...
                </div>
              ) : slotReservations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <Clock className="mx-auto h-7 w-7 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    No Workshop Bay Reservations
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Customers selecting &ldquo;Workshop Visit (Slot Reservation)&rdquo; appear here.
                  </p>
                </div>
              ) : (
                slotReservations.map((booking) => (
                  <article
                    key={`col2-${booking.id}`}
                    className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                        <Wrench className="h-3.5 w-3.5" />
                        Workshop Bay Slot
                      </span>
                      <StatusBadge status={booking.status} />
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <strong className="text-sm text-slate-900">
                          {booking.client_name}
                        </strong>
                        <a
                          href={`tel:${booking.phone}`}
                          className="font-mono font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {booking.phone}
                        </a>
                      </div>

                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                          <span>{booking.preferred_date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{booking.preferred_time}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <span className="font-mono font-bold text-slate-800">
                          {booking.car_number} ({booking.vehicle_type})
                        </span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                          {booking.service}
                        </span>
                      </div>
                    </div>

                    <OwnerCardControls
                      booking={booking}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                    />
                  </article>
                ))
              )}
            </div>
          </section>

          {/* COLUMN 3: PICK-UP & DROP REQUESTS */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Pick-up &amp; Drop Requests
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Doorstep collection &amp; driver dispatch status
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center justify-center rounded-md bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700 border border-emerald-200">
                {pickupRequests.length}
              </span>
            </div>

            <div className="p-4 space-y-3.5 max-h-[720px] overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Syncing pick-up requests...
                </div>
              ) : pickupRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <Truck className="mx-auto h-7 w-7 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    No Pick-up &amp; Drop Requests
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Customers requesting doorstep Pick-up &amp; Drop appear here.
                  </p>
                </div>
              ) : (
                pickupRequests.map((booking) => {
                  const pickupStateLabel =
                    booking.status === 'completed'
                      ? 'Delivered Back to Client'
                      : booking.status === 'in_progress'
                      ? 'Vehicle Picked Up · In Bay'
                      : 'Awaiting Driver Dispatch';

                  return (
                    <article
                      key={`col3-${booking.id}`}
                      className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm hover:border-emerald-300 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {pickupStateLabel}
                        </span>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <strong className="text-sm text-slate-900">
                            {booking.client_name}
                          </strong>
                          <a
                            href={`tel:${booking.phone}`}
                            className="font-mono font-semibold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            {booking.phone}
                          </a>
                        </div>

                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900">
                              {booking.car_number}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {booking.vehicle_type}
                              {booking.vehicle_model ? ` · ${booking.vehicle_model}` : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium">
                            Service: {booking.service}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Slot: {booking.preferred_date} ({booking.preferred_time})
                          </p>
                          {booking.pickup_address && (
                            <p className="text-[11px] text-emerald-900 bg-emerald-50 px-2 py-1 rounded mt-1 border border-emerald-200">
                              📍 Pickup: {booking.pickup_address}
                            </p>
                          )}
                        </div>
                      </div>

                      <OwnerCardControls
                        booking={booking}
                        onStatusChange={onStatusChange}
                        onDelete={onDelete}
                      />
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: OwnerBookingStatus }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        Completed
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
}

function OwnerCardControls({
  booking,
  onStatusChange,
  onDelete,
}: {
  booking: OwnerBooking;
  onStatusChange: (id: string, status: OwnerBookingStatus) => void;
  onDelete: (id: string) => void;
}) {
  const statuses: { value: OwnerBookingStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
      <div className="flex items-center justify-between gap-1 rounded-lg bg-slate-100 p-1">
        {statuses.map((st) => {
          const active = booking.status === st.value;
          return (
            <button
              key={st.value}
              type="button"
              onClick={() => onStatusChange(booking.id, st.value)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-bold transition-all ${
                active
                  ? st.value === 'completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : st.value === 'in_progress'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <a
          href={buildWhatsAppUrl(booking)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp Confirmation
        </a>
        <button
          type="button"
          onClick={() => onDelete(booking.id)}
          title="Delete Booking"
          aria-label={`Delete booking for ${booking.client_name}`}
          className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-2 text-xs font-bold text-rose-700 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
