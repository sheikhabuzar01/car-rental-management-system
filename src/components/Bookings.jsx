import React, { useState, useMemo, useEffect } from 'react';
import { CalendarCheck, Plus, Trash2, X, AlertTriangle, CheckCircle2, Search, User, Download, FileText, Printer } from 'lucide-react';
import { db, CHAUFFEUR_DAILY_RATE } from '../db/mockDb';
import { formatAED, DUBAI_LOCATIONS } from '../utils/constants';
import { toCSV, downloadCSV, datedFilename } from '../utils/csv';
import { invoiceHTML, printInvoice } from '../utils/invoice';

const BOOKING_CSV_COLUMNS = [
  { key: 'customer', label: 'Customer' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'registration', label: 'Registration' },
  { key: 'pickupDate', label: 'Pickup Date' },
  { key: 'returnDate', label: 'Return Date' },
  { key: 'pickupLocation', label: 'Location' },
  { key: 'chauffeur', label: 'Chauffeur' },
  { key: 'deposit', label: 'Deposit (AED)' },
  { key: 'rentalAmount', label: 'Amount (AED)' },
  { key: 'status', label: 'Status' },
];

const today = () => new Date().toISOString().split('T')[0];

const emptyForm = {
  vehicleId: '', customerId: '', pickupDate: today(), returnDate: today(),
  pickupLocation: 'Dubai Marina', withChauffeur: false, deposit: '', rentalAmount: '', status: 'Active',
};

// Whole days, inclusive of the pickup day (min 1 day).
function rentalDays(pickup, ret) {
  const start = new Date(pickup);
  const end = new Date(ret);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff + 1 : 0;
}

export default function Bookings({ dbData, refreshDb }) {
  const { vehicles, customers, bookings } = dbData;
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [rentEditedManually, setRentEditedManually] = useState(false);
  const [invoiceBooking, setInvoiceBooking] = useState(null); // booking shown in invoice modal

  const vehicleById = (id) => vehicles.find(v => v.id === id);
  const customerById = (id) => customers.find(c => c.id === id);

  const days = rentalDays(form.pickupDate, form.returnDate);

  // Live availability feedback for the chosen vehicle/dates.
  const availability = useMemo(() => {
    if (!form.vehicleId || !form.pickupDate || !form.returnDate) return null;
    const v = vehicleById(form.vehicleId);
    if (v && v.status === 'Maintenance') return { available: false, reason: 'Vehicle is under maintenance.' };
    if (new Date(form.returnDate) < new Date(form.pickupDate)) {
      return { available: false, reason: 'Return date is before pickup date.' };
    }
    const { available, conflicts } = db.checkAvailability(form.vehicleId, form.pickupDate, form.returnDate);
    if (available) return { available: true };
    const c = conflicts[0];
    return { available: false, reason: `Already booked ${c.pickupDate} → ${c.returnDate}.` };
  }, [form.vehicleId, form.pickupDate, form.returnDate, bookings]);

  // Auto-suggest rental amount = (daily rent + chauffeur surcharge) × days, until edited.
  useEffect(() => {
    if (rentEditedManually) return;
    const v = vehicleById(form.vehicleId);
    if (v && days > 0) {
      const perDay = v.dailyRent + (form.withChauffeur ? CHAUFFEUR_DAILY_RATE : 0);
      setForm(f => ({ ...f, rentalAmount: perDay * days, deposit: f.deposit === '' ? v.deposit : f.deposit }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.vehicleId, form.pickupDate, form.returnDate, form.withChauffeur, rentEditedManually]);

  const openCreate = () => {
    setForm(emptyForm);
    setError('');
    setRentEditedManually(false);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    try {
      db.addBooking(form);
      setShowModal(false);
      setForm(emptyForm);
      refreshDb();
    } catch (err) {
      setError(err.message);
    }
  };

  // Export the currently filtered bookings to CSV with readable names.
  const handleExport = () => {
    if (filtered.length === 0) return;
    const rows = filtered.map(b => ({
      customer: customerById(b.customerId)?.fullName || 'Unknown',
      vehicle: vehicleById(b.vehicleId)?.name || 'Unknown',
      registration: vehicleById(b.vehicleId)?.registration || '',
      pickupDate: b.pickupDate,
      returnDate: b.returnDate,
      pickupLocation: b.pickupLocation || '',
      chauffeur: b.withChauffeur ? 'Yes' : 'Self-drive',
      deposit: b.deposit,
      rentalAmount: b.rentalAmount,
      status: b.status,
    }));
    downloadCSV(datedFilename('bookings'), toCSV(rows, BOOKING_CSV_COLUMNS));
  };

  const handleStatusChange = (id, status) => { db.updateBookingStatus(id, status); refreshDb(); };
  const handleDelete = (b) => {
    if (window.confirm('Delete this booking? This cannot be undone.')) {
      db.deleteBooking(b.id);
      refreshDb();
    }
  };

  const filtered = bookings
    .filter(b => statusFilter === 'All' || b.status === statusFilter)
    .filter(b => {
      const cust = customerById(b.customerId)?.fullName || '';
      const veh = vehicleById(b.vehicleId)?.name || '';
      const q = search.toLowerCase();
      return cust.toLowerCase().includes(q) || veh.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate));

  const selectedVehicle = vehicleById(form.vehicleId);
  const blockActive = availability && !availability.available && (form.status || 'Active') === 'Active';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '220px', flex: 1, maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="form-control" placeholder="Search customer or vehicle…"
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
          </div>
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '180px' }}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={filtered.length === 0} title="Export current list to CSV">
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Create Booking
          </button>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="custom-table-wrapper">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
              <CalendarCheck size={40} style={{ strokeWidth: 1.5, marginBottom: '0.75rem', color: 'var(--text-muted)' }} />
              <p>No bookings found. Create your first booking.</p>
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Pickup</th>
                  <th>Return</th>
                  <th>Location</th>
                  <th>Chauffeur</th>
                  <th>Deposit</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const v = vehicleById(b.vehicleId);
                  const c = customerById(b.customerId);
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{c ? c.fullName : 'Unknown'}</td>
                      <td>
                        <div>{v ? v.name : 'Unknown'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v ? v.registration : ''}</div>
                      </td>
                      <td>{b.pickupDate}</td>
                      <td>{b.returnDate}</td>
                      <td style={{ fontSize: '0.8rem' }}>{b.pickupLocation || '—'}</td>
                      <td>{b.withChauffeur ? 'Yes' : 'Self-drive'}</td>
                      <td>{formatAED(b.deposit)}</td>
                      <td style={{ fontWeight: 600 }}>{formatAED(b.rentalAmount)}</td>
                      <td>
                        <select
                          className={`badge badge-${b.status.toLowerCase()}`}
                          value={b.status}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          style={{ border: 'none', cursor: 'pointer', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)' }}
                        >
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setInvoiceBooking(b)} title="View receipt / invoice">
                            <FileText size={14} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Create Booking</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer</label>
                    <select required className="form-control" value={form.customerId}
                      onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                      <option value="">Select customer…</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.fullName} — {c.phone}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle</label>
                    <select required className="form-control" value={form.vehicleId}
                      onChange={(e) => { setForm({ ...form, vehicleId: e.target.value, deposit: '' }); setRentEditedManually(false); }}>
                      <option value="">Select vehicle…</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id} disabled={v.status === 'Maintenance'}>
                          {v.name} ({v.registration}) — {formatAED(v.dailyRent)}/day{v.status === 'Maintenance' ? ' — Maintenance' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Pickup Date</label>
                    <input type="date" required className="form-control" value={form.pickupDate}
                      onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Return Date</label>
                    <input type="date" required className="form-control" value={form.returnDate}
                      min={form.pickupDate}
                      onChange={(e) => setForm({ ...form, returnDate: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Pickup / Drop-off Location</label>
                    <select className="form-control" value={form.pickupLocation}
                      onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}>
                      {DUBAI_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Booking Status</label>
                    <select className="form-control" value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Chauffeur toggle */}
                <label className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.6rem 0.85rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <input type="checkbox" checked={form.withChauffeur} style={{ width: '18px', height: '18px' }}
                    onChange={(e) => { setForm({ ...form, withChauffeur: e.target.checked }); setRentEditedManually(false); }} />
                  <User size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    Add professional chauffeur <span style={{ color: 'var(--text-muted)' }}>(+{formatAED(CHAUFFEUR_DAILY_RATE)}/day)</span>
                  </span>
                </label>

                {/* Live availability indicator */}
                {form.vehicleId && availability && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 500,
                    backgroundColor: availability.available ? 'var(--success-light)' : 'var(--danger-light)',
                    color: availability.available ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {availability.available
                      ? <><CheckCircle2 size={16} /> Available for these dates ({days} day{days !== 1 ? 's' : ''}).</>
                      : <><AlertTriangle size={16} /> {availability.reason}</>}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Rental Amount (AED)</label>
                    <input type="number" min="0" required className="form-control" value={form.rentalAmount}
                      onChange={(e) => { setForm({ ...form, rentalAmount: e.target.value }); setRentEditedManually(true); }}
                      placeholder="Auto-calculated" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Security Deposit (AED)</label>
                    <input type="number" min="0" className="form-control" value={form.deposit}
                      onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                      placeholder={selectedVehicle ? String(selectedVehicle.deposit) : '0'} />
                  </div>
                </div>

                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 500,
                    backgroundColor: 'var(--danger-light)', color: 'var(--danger)',
                  }}>
                    <AlertTriangle size={16} /> {error}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={blockActive}>Create Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice / receipt preview */}
      {invoiceBooking && (
        <div className="modal-overlay" onClick={() => setInvoiceBooking(null)}>
          <div className="modal-container" style={{ maxWidth: '820px', width: '92vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Receipt / Invoice</h3>
              <button className="modal-close" onClick={() => setInvoiceBooking(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ background: '#525659', padding: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div
                style={{ background: '#fff', borderRadius: '6px', boxShadow: '0 6px 24px rgba(0,0,0,0.4)' }}
                dangerouslySetInnerHTML={{
                  __html: invoiceHTML(
                    invoiceBooking,
                    vehicleById(invoiceBooking.vehicleId),
                    customerById(invoiceBooking.customerId)
                  ),
                }}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setInvoiceBooking(null)}>Close</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => printInvoice(
                  invoiceBooking,
                  vehicleById(invoiceBooking.vehicleId),
                  customerById(invoiceBooking.customerId)
                )}
              >
                <Printer size={16} /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
