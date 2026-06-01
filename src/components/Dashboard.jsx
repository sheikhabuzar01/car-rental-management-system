import React from 'react';
import { Car, CheckCircle, CalendarCheck, Users, DollarSign, Gauge, ShieldCheck, Wrench, ArrowRight } from 'lucide-react';
import { formatAED } from '../utils/constants';

export default function Dashboard({ dbData, setActiveTab }) {
  const { vehicles, customers, bookings } = dbData;

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const rentedVehicles = vehicles.filter(v => v.status === 'Rented').length;
  const inMaintenance = vehicles.filter(v => v.status === 'Maintenance').length;
  const activeRentals = bookings.filter(b => b.status === 'Active').length;
  const totalCustomers = customers.length;

  const now = new Date();
  const monthlyRevenue = bookings
    .filter(b => b.status !== 'Cancelled')
    .filter(b => {
      const d = new Date(b.pickupDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, b) => sum + (Number(b.rentalAmount) || 0), 0);

  // Security deposits currently held against active rentals
  const depositsHeld = bookings
    .filter(b => b.status === 'Active')
    .reduce((sum, b) => sum + (Number(b.deposit) || 0), 0);

  // Fleet utilization = rented / total
  const utilization = totalVehicles ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

  const customerName = (id) => customers.find(c => c.id === id)?.fullName || 'Unknown';
  const vehicle = (id) => vehicles.find(v => v.id === id);

  const recentBookings = [...bookings].sort((a, b) => new Date(b.pickupDate) - new Date(a.pickupDate)).slice(0, 5);

  const stats = [
    { label: 'Total Vehicles', value: totalVehicles, icon: Car, color: 'var(--primary)', bg: 'var(--primary-light)', tab: 'vehicles' },
    { label: 'Available Vehicles', value: availableVehicles, icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-light)', tab: 'vehicles' },
    { label: 'Active Rentals', value: activeRentals, icon: CalendarCheck, color: 'var(--warning)', bg: 'var(--warning-light)', tab: 'bookings' },
    { label: 'Total Customers', value: totalCustomers, icon: Users, color: 'var(--danger)', bg: 'var(--danger-light)', tab: 'customers' },
    { label: 'Monthly Revenue', value: formatAED(monthlyRevenue), icon: DollarSign, color: 'var(--success)', bg: 'var(--success-light)', tab: 'bookings' },
    { label: 'Fleet Utilization', value: `${utilization}%`, icon: Gauge, color: 'var(--primary)', bg: 'var(--primary-light)', tab: 'vehicles' },
    { label: 'Deposits Held', value: formatAED(depositsHeld), icon: ShieldCheck, color: 'var(--warning)', bg: 'var(--warning-light)', tab: 'bookings' },
    { label: 'In Maintenance', value: inMaintenance, icon: Wrench, color: 'var(--danger)', bg: 'var(--danger-light)', tab: 'vehicles' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="stats-grid">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card" onClick={() => setActiveTab(s.tab)} style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ backgroundColor: s.bg, color: s.color }}>
                <Icon size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">{s.label}</span>
                <span className="stat-value">{s.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <CalendarCheck size={18} />
            Recent Bookings
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('bookings')}>
            View All <ArrowRight size={14} />
          </button>
        </div>

        <div className="custom-table-wrapper">
          {recentBookings.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>No bookings yet.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Pickup</th>
                  <th>Return</th>
                  <th>Chauffeur</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => {
                  const v = vehicle(b.vehicleId);
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{customerName(b.customerId)}</td>
                      <td>{v ? v.name : 'Unknown'}</td>
                      <td>{b.pickupDate}</td>
                      <td>{b.returnDate}</td>
                      <td>{b.withChauffeur ? 'Yes' : 'Self-drive'}</td>
                      <td>{formatAED(b.rentalAmount)}</td>
                      <td><span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
