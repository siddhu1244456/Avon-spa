import {
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  Sparkles,
  Trash2,
  Truck,
  User,
  Wrench,
} from 'lucide-react';

export type OwnerBookingStatus = 'pending' | 'in_progress' | 'completed';

export type OwnerBooking = {
  id: string;
  client_name: string;
  phone: string;
  car_number: string;
  vehicle_model: string;
  service: string;
  preferred_date: string;
  preferred_time: string;
  service_mode: 'Workshop Visit (Slot Reservation)' | 'Pick-up & Drop Request';
  vehicle_type: 'Hatchback' | 'Sedan' | 'SUV' | 'Luxury';
  pickup_address?: string;
  status: OwnerBookingStatus;
  created_at: string;
};

type OwnerDashboardProps = {
  bookings: OwnerBooking[];
  loading: boolean;
  onStatusChange: (id: string, status: OwnerBookingStatus) => void;
  onDelete: (id: string) => void;
};

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

export function buildWhatsAppUrl(booking: OwnerBooking): string {
  const cleanPhone = sanitizeIndianPhone(booking.phone);
  const statusLabel =
    booking.status === 'completed'
      ? 'COMPLETED & READY'
      : booking.status === 'in_progress'
      ? 'IN PROGRESS AT STUDIO'
      : 'CONFIRMED';

  const message = [
    `Hello ${booking.client_name},`,
    `Greetings from *Avon Car Spa* (BTM Layout 4th Stage, Bengaluru)!`,
    ``,
    `Your booking is *${statusLabel}*:`,
    `• *Service:* ${booking.service}`,
    `• *Car:* ${booking.car_number} (${booking.vehicle_type}${booking.vehicle_model ? ` - ${booking.vehicle_model}` : ''})`,
    `• *Date & Slot:* ${booking.preferred_date} | ${booking.preferred_time}`,
    `• *Mode:* ${booking.service_mode}`,
    booking.pickup_address ? `• *Pickup Location:* ${booking.pickup_address}` : '',
    ``,
    `📍 Studio: No 3/16/5, 5th Main Road, Krishna Layout, BTM Layout 4th Stage, Bengaluru - 560114`,
    `📞 Call us: 078991 38399`,
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function StatusBadge({ status }: { status: OwnerBookingStatus }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        Completed
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
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
    <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2.5">
      {/* Status Switcher Pills */}
      <div className="flex items-center justify-between gap-1 rounded-lg bg-slate-100 p-1">
        {statuses.map((st) => {
          const active = booking.status === st.value;
          return (
            <button
              key={st.value}
              type="button"
              onClick={() => onStatusChange(booking.id, st.value)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all ${
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

      {/* 1-Click WhatsApp Confirmation & Delete */}
      <div className="flex items-center gap-2">
        <a
          href={buildWhatsAppUrl(booking)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp Confirmation
        </a>
        <button
          type="button"
          onClick={() => onDelete(booking.id)}
          title="Delete Booking"
          aria-label={`Delete booking for ${booking.client_name}`}
          className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-2 text-xs font-semibold text-rose-700 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function OwnerDashboard({
  bookings,
  loading,
  onStatusChange,
  onDelete,
}: OwnerDashboardProps) {
  const slotReservations = bookings.filter(
    (b) => b.service_mode === 'Workshop Visit (Slot Reservation)'
  );
  const pickupRequests = bookings.filter(
    (b) => b.service_mode === 'Pick-up & Drop Request'
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* COLUMN 1: ONLINE BOOKINGS & ORDERS */}
      <section className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                1. Online Bookings &amp; Orders
              </h2>
              <p className="text-[11px] text-slate-500">
                All incoming car spa orders &amp; timestamps
              </p>
            </div>
          </div>
          <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
            {bookings.length}
          </span>
        </div>

        <div className="p-4 space-y-3.5 max-h-[720px] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Syncing live bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <Car className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                0 Active Online Bookings
              </p>
              <p className="text-xs text-slate-500 mt-1">
                New bookings submitted on the website will appear here in real time.
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <article
                key={`col1-${booking.id}`}
                className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {booking.service}
                    </span>
                  </div>
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
                      className="font-mono-code font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {booking.phone}
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="inline-flex items-center gap-1.5 font-mono-code font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      <Car className="h-3.5 w-3.5 text-slate-500" />
                      {booking.car_number}
                    </span>
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {booking.vehicle_type}
                      {booking.vehicle_model ? ` · ${booking.vehicle_model}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Mode: {booking.service_mode}</span>
                    <span>Booked: {formatTimestamp(booking.created_at)}</span>
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

      {/* COLUMN 2: SLOT RESERVATIONS (WORKSHOP VISIT) */}
      <section className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                2. Slot Reservations
              </h2>
              <p className="text-[11px] text-slate-500">
                Workshop visits by preferred date &amp; time slot
              </p>
            </div>
          </div>
          <span className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
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
              <Clock className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                0 Workshop Slot Reservations
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Clients choosing &ldquo;Workshop Visit (Slot Reservation)&rdquo; appear here.
              </p>
            </div>
          ) : (
            slotReservations.map((booking) => (
              <article
                key={`col2-${booking.id}`}
                className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm hover:border-indigo-300 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
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
                      className="font-mono-code font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {booking.phone}
                    </a>
                  </div>

                  <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 flex items-center justify-between">
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
                    <span className="font-semibold text-slate-700">
                      Vehicle: {booking.vehicle_type} ({booking.car_number})
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
      <section className="rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                3. Pick-up &amp; Drop Requests
              </h2>
              <p className="text-[11px] text-slate-500">
                Doorstep vehicle collection &amp; delivery status
              </p>
            </div>
          </div>
          <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
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
              <Truck className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                0 Pick-up &amp; Drop Requests
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Clients selecting &ldquo;Pick-up &amp; Drop Request&rdquo; appear here immediately.
              </p>
            </div>
          ) : (
            pickupRequests.map((booking) => {
              const pickupStateLabel =
                booking.status === 'completed'
                  ? 'Delivered Back to Client'
                  : booking.status === 'in_progress'
                  ? 'Vehicle Picked Up · In Studio'
                  : 'Awaiting Driver Dispatch';

              return (
                <article
                  key={`col3-${booking.id}`}
                  className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
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
                        className="font-mono-code font-semibold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {booking.phone}
                      </a>
                    </div>

                    <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono-code font-bold text-slate-900">
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
                        Requested Slot: {booking.preferred_date} ({booking.preferred_time})
                      </p>
                      {booking.pickup_address && (
                        <p className="text-[11px] text-emerald-800 bg-emerald-50/70 px-2 py-1 rounded mt-1 border border-emerald-100">
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
  );
}
