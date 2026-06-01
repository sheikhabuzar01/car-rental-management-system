import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit3, X, Search, Download } from 'lucide-react';
import { db } from '../db/mockDb';
import { NATIONALITIES } from '../utils/constants';
import { toCSV, downloadCSV, datedFilename } from '../utils/csv';

const CUSTOMER_CSV_COLUMNS = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'emiratesId', label: 'Emirates ID / Passport' },
  { key: 'license', label: 'License Number' },
  { key: 'nationality', label: 'Nationality' },
];

const emptyForm = { fullName: '', phone: '', email: '', emiratesId: '', license: '', nationality: 'United Arab Emirates' };

export default function Customers({ dbData, refreshDb }) {
  const { customers, bookings } = dbData;
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.emiratesId || '').toLowerCase().includes(q)
    );
  });

  const bookingCount = (id) => bookings.filter(b => b.customerId === id).length;

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => {
    setEditId(c.id);
    setForm({
      fullName: c.fullName, phone: c.phone || '', email: c.email || '',
      emiratesId: c.emiratesId || '', license: c.license || '', nationality: c.nationality || 'United Arab Emirates',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    if (editId) db.updateCustomer(editId, form);
    else db.addCustomer(form);
    setShowModal(false);
    setForm(emptyForm);
    setEditId(null);
    refreshDb();
  };

  const handleDelete = (c) => {
    if (window.confirm(`Delete customer "${c.fullName}"? Their bookings will also be removed.`)) {
      db.deleteCustomer(c.id);
      refreshDb();
    }
  };

  // Export the currently filtered customers to CSV.
  const handleExport = () => {
    if (filtered.length === 0) return;
    downloadCSV(datedFilename('customers'), toCSV(filtered, CUSTOMER_CSV_COLUMNS));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search by name, phone, email or Emirates ID…"
            value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={filtered.length === 0} title="Export current list to CSV">
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="custom-table-wrapper">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
              <Users size={40} style={{ strokeWidth: 1.5, marginBottom: '0.75rem', color: 'var(--text-muted)' }} />
              <p>No customers found. Add your first customer to get started.</p>
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Emirates ID / Passport</th>
                  <th>License #</th>
                  <th>Nationality</th>
                  <th>Bookings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.fullName}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.emiratesId || '—'}</td>
                    <td>{c.license || '—'}</td>
                    <td>{c.nationality || '—'}</td>
                    <td>{bookingCount(c.id)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)} title="Edit">
                          <Edit3 size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Customer' : 'Add Customer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" required className="form-control" value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Khalid Al Maktoum" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="text" className="form-control" value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +971 50 123 4567" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. guest@example.ae" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Emirates ID / Passport</label>
                    <input type="text" className="form-control" value={form.emiratesId}
                      onChange={(e) => setForm({ ...form, emiratesId: e.target.value })} placeholder="e.g. 784-1988-1234567-1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Driving License Number</label>
                    <input type="text" className="form-control" value={form.license}
                      onChange={(e) => setForm({ ...form, license: e.target.value })} placeholder="e.g. DXB-DL-99821" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nationality</label>
                  <select className="form-control" value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}>
                    {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Save Changes' : 'Add Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
