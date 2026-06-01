import React, { useState } from 'react';
import { Car, Plus, Trash2, Edit3, X, Search, Gauge, ShieldCheck, Download } from 'lucide-react';
import { db } from '../db/mockDb';
import { formatAED, VEHICLE_CATEGORIES, VEHICLE_STATUSES, CATEGORY_GRADIENT } from '../utils/constants';
import { toCSV, downloadCSV, datedFilename } from '../utils/csv';

const VEHICLE_CSV_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'brand', label: 'Brand' },
  { key: 'model', label: 'Model' },
  { key: 'category', label: 'Category' },
  { key: 'year', label: 'Year' },
  { key: 'color', label: 'Color' },
  { key: 'registration', label: 'Registration' },
  { key: 'dailyRent', label: 'Daily Rent (AED)' },
  { key: 'deposit', label: 'Deposit (AED)' },
  { key: 'status', label: 'Status' },
  { key: 'image', label: 'Image' },
];

const currentYear = new Date().getFullYear();
const emptyForm = {
  name: '', brand: '', model: '', category: 'Supercar', year: currentYear,
  color: '', registration: '', dailyRent: '', deposit: '', status: 'Available', image: '',
};

export default function Vehicles({ dbData, refreshDb }) {
  const { vehicles } = dbData;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    const matchesSearch =
      v.name.toLowerCase().includes(q) ||
      (v.brand || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q) ||
      (v.registration || '').toLowerCase().includes(q);
    const matchesCat = categoryFilter === 'All' || v.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (v) => {
    setEditId(v.id);
    setForm({
      name: v.name, brand: v.brand || '', model: v.model || '', category: v.category || 'Supercar',
      year: v.year || currentYear, color: v.color || '', registration: v.registration || '',
      dailyRent: v.dailyRent, deposit: v.deposit, status: v.status, image: v.image || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editId) db.updateVehicle(editId, form);
    else db.addVehicle(form);
    setShowModal(false);
    setForm(emptyForm);
    setEditId(null);
    refreshDb();
  };

  const handleDelete = (v) => {
    if (window.confirm(`Delete "${v.name} (${v.registration})"? Any bookings for this vehicle will also be removed.`)) {
      db.deleteVehicle(v.id);
      refreshDb();
    }
  };

  // Export the currently filtered vehicles to CSV.
  const handleExport = () => {
    if (filtered.length === 0) return;
    downloadCSV(datedFilename('vehicles'), toCSV(filtered, VEHICLE_CSV_COLUMNS));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '220px', flex: 1, maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="form-control" placeholder="Search make, model, plate…"
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
          </div>
          <select className="form-control" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ maxWidth: '170px' }}>
            <option value="All">All Categories</option>
            {VEHICLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '150px' }}>
            <option value="All">All Statuses</option>
            {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={filtered.length === 0} title="Export current list to CSV">
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Fleet grid */}
      {filtered.length === 0 ? (
        <div className="dashboard-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <Car size={40} style={{ strokeWidth: 1.5, marginBottom: '0.75rem', color: 'var(--text-muted)' }} />
          <p>No vehicles match your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((v) => (
            <div key={v.id} className="dashboard-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Header / image */}
              <div style={{
                position: 'relative', height: '140px',
                background: CATEGORY_GRADIENT[v.category] || CATEGORY_GRADIENT.Supercar,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {v.image ? (
                  <img src={v.image} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <Car size={56} style={{ color: 'rgba(255,255,255,0.25)' }} />
                )}
                <span className={`badge badge-${v.status.toLowerCase()}`} style={{ position: 'absolute', top: '0.6rem', right: '0.6rem' }}>
                  {v.status}
                </span>
                <span style={{ position: 'absolute', bottom: '0.6rem', left: '0.75rem', color: '#fff', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                  {v.category}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '1rem 1.1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{v.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {v.year} • {v.color || '—'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  <span>Plate</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{v.registration || '—'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.25rem' }}>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gold)' }}>{formatAED(v.dailyRent)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>per day</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <ShieldCheck size={12} /> {formatAED(v.deposit)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>deposit</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(v)}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Vehicle Name</label>
                    <input type="text" required className="form-control" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lamborghini Huracán EVO" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input type="text" className="form-control" value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Lamborghini" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input type="text" className="form-control" value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. Huracán EVO Spyder" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {VEHICLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input type="number" min="1990" max={currentYear + 1} className="form-control" value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="e.g. 2023" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <input type="text" className="form-control" value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="e.g. Rosso Corsa" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Registration / Plate Number</label>
                  <input type="text" className="form-control" value={form.registration}
                    onChange={(e) => setForm({ ...form, registration: e.target.value })} placeholder="e.g. Dubai O 55512" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Daily Rent (AED)</label>
                    <input type="number" min="0" required className="form-control" value={form.dailyRent}
                      onChange={(e) => setForm({ ...form, dailyRent: e.target.value })} placeholder="e.g. 4500" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Security Deposit (AED)</label>
                    <input type="number" min="0" className="form-control" value={form.deposit}
                      onChange={(e) => setForm({ ...form, deposit: e.target.value })} placeholder="e.g. 5000" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Image URL (optional)</label>
                    <input type="url" className="form-control" value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Add Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
