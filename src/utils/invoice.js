// Invoice / receipt generator for bookings.
// Produces self-contained, print-ready HTML (black & white + gold) that is
// reused both for the in-app preview and the print / save-as-PDF output.

import { formatAED } from './constants';
import { CHAUFFEUR_DAILY_RATE } from '../db/mockDb';

const VAT_RATE = 0.05; // UAE standard VAT

const COMPANY = {
  name: 'TMT Car Rental',
  tagline: 'The Money Team',
  address: 'Dubai, United Arab Emirates',
  contact: '+971 4 000 0000  •  info@tmtcarrental.ae',
  trn: 'TRN 100 0000 0000 0003',
};

function inclusiveDays(pickup, ret) {
  const diff = Math.round((new Date(ret) - new Date(pickup)) / 86400000);
  return diff >= 0 ? diff + 1 : 0;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Build the computed figures + line items for a booking.
export function getInvoiceData(booking, vehicle, customer) {
  const days = inclusiveDays(booking.pickupDate, booking.returnDate);
  const dailyRent = vehicle ? Number(vehicle.dailyRent) || 0 : 0;
  const subtotal = Number(booking.rentalAmount) || 0;

  const vehicleCharge = dailyRent * days;
  const chauffeurCharge = booking.withChauffeur ? CHAUFFEUR_DAILY_RATE * days : 0;
  const reconciles = vehicleCharge + chauffeurCharge === subtotal;

  const lineItems = [];
  if (reconciles && vehicle) {
    lineItems.push({
      desc: `${vehicle.name} rental — ${days} day${days !== 1 ? 's' : ''} @ ${formatAED(dailyRent)}/day`,
      amount: vehicleCharge,
    });
    if (chauffeurCharge > 0) {
      lineItems.push({
        desc: `Professional chauffeur — ${days} day${days !== 1 ? 's' : ''} @ ${formatAED(CHAUFFEUR_DAILY_RATE)}/day`,
        amount: chauffeurCharge,
      });
    }
  } else {
    lineItems.push({
      desc: `${vehicle ? vehicle.name : 'Vehicle'} rental — ${days} day${days !== 1 ? 's' : ''}` +
        (booking.withChauffeur ? ' (incl. chauffeur)' : ''),
      amount: subtotal,
    });
  }

  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;
  const deposit = Number(booking.deposit) || 0;
  const totalCollected = total + deposit;

  const idDigits = (booking.id || '').replace(/\D/g, '');
  const seq = idDigits ? idDigits.slice(-5).padStart(5, '0') : '00001';

  return {
    invoiceNo: `INV-${seq}`,
    issueDate: new Date().toISOString().split('T')[0],
    days, lineItems, subtotal, vat, total, deposit, totalCollected,
  };
}

// Returns a styled HTML fragment (with scoped <style>) for the invoice.
export function invoiceHTML(booking, vehicle, customer) {
  const d = getInvoiceData(booking, vehicle, customer);

  const rows = d.lineItems.map(li => `
    <tr>
      <td>${escapeHTML(li.desc)}</td>
      <td class="num">${formatAED(li.amount)}</td>
    </tr>`).join('');

  return `
<style>
  .tmt-invoice { --g:#b08d3f; background:#fff; color:#1a1a1a; font-family:'Inter',Arial,sans-serif;
    width:100%; max-width:760px; margin:0 auto; padding:40px 44px; box-sizing:border-box; }
  .tmt-invoice * { box-sizing:border-box; }
  .tmt-invoice .head { display:flex; justify-content:space-between; align-items:flex-start;
    border-bottom:2px solid var(--g); padding-bottom:18px; margin-bottom:24px; }
  .tmt-invoice .brand { font-family:'Playfair Display',Georgia,serif; font-size:26px; font-weight:700;
    color:#111; line-height:1; }
  .tmt-invoice .brand span { color:var(--g); }
  .tmt-invoice .tagline { font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--g);
    margin-top:6px; font-weight:600; }
  .tmt-invoice .co-meta { font-size:11px; color:#555; margin-top:8px; line-height:1.6; }
  .tmt-invoice .inv-title { text-align:right; }
  .tmt-invoice .inv-title h1 { font-family:'Playfair Display',Georgia,serif; font-size:22px; margin:0; color:#111;
    letter-spacing:.04em; }
  .tmt-invoice .inv-title .meta { font-size:12px; color:#555; margin-top:6px; line-height:1.7; }
  .tmt-invoice .inv-title .meta b { color:#111; }
  .tmt-invoice .parties { display:flex; justify-content:space-between; gap:24px; margin-bottom:24px; }
  .tmt-invoice .box { flex:1; }
  .tmt-invoice .box h3 { font-size:10px; text-transform:uppercase; letter-spacing:.14em; color:var(--g);
    margin:0 0 8px; }
  .tmt-invoice .box p { margin:0; font-size:12.5px; line-height:1.7; color:#222; }
  .tmt-invoice .box p b { color:#111; }
  .tmt-invoice table.items { width:100%; border-collapse:collapse; margin-bottom:18px; }
  .tmt-invoice table.items th { text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:.1em;
    color:#666; border-bottom:1px solid #ddd; padding:0 0 8px; }
  .tmt-invoice table.items th.num, .tmt-invoice table.items td.num { text-align:right; }
  .tmt-invoice table.items td { font-size:13px; padding:11px 0; border-bottom:1px solid #eee; color:#222; }
  .tmt-invoice .totals { margin-left:auto; width:280px; font-size:13px; }
  .tmt-invoice .totals .row { display:flex; justify-content:space-between; padding:6px 0; color:#333; }
  .tmt-invoice .totals .row.grand { border-top:2px solid var(--g); margin-top:6px; padding-top:12px;
    font-weight:700; font-size:15px; color:#111; }
  .tmt-invoice .totals .row.deposit { color:#666; font-style:italic; }
  .tmt-invoice .badge { display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase;
    letter-spacing:.08em; padding:3px 10px; border-radius:999px; border:1px solid var(--g); color:var(--g); }
  .tmt-invoice .foot { margin-top:34px; border-top:1px solid #eee; padding-top:16px; font-size:11px;
    color:#777; text-align:center; line-height:1.7; }
  .tmt-invoice .foot b { color:var(--g); }
</style>
<div class="tmt-invoice">
  <div class="head">
    <div>
      <div class="brand">TMT <span>Car Rental</span></div>
      <div class="tagline">${escapeHTML(COMPANY.tagline)}</div>
      <div class="co-meta">${escapeHTML(COMPANY.address)}<br>${escapeHTML(COMPANY.contact)}<br>${escapeHTML(COMPANY.trn)}</div>
    </div>
    <div class="inv-title">
      <h1>INVOICE</h1>
      <div class="meta">
        <div><b>${escapeHTML(d.invoiceNo)}</b></div>
        <div>Issued: ${fmtDate(d.issueDate)}</div>
        <div><span class="badge">${escapeHTML(booking.status)}</span></div>
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="box">
      <h3>Billed To</h3>
      <p>
        <b>${escapeHTML(customer ? customer.fullName : 'Unknown customer')}</b><br>
        ${customer && customer.phone ? escapeHTML(customer.phone) + '<br>' : ''}
        ${customer && customer.email ? escapeHTML(customer.email) + '<br>' : ''}
        ${customer && customer.emiratesId ? 'Emirates ID: ' + escapeHTML(customer.emiratesId) + '<br>' : ''}
        ${customer && customer.license ? 'License: ' + escapeHTML(customer.license) : ''}
      </p>
    </div>
    <div class="box">
      <h3>Rental Details</h3>
      <p>
        <b>${escapeHTML(vehicle ? vehicle.name : 'Unknown vehicle')}</b><br>
        ${vehicle ? escapeHTML(`${vehicle.year} • ${vehicle.registration}`) + '<br>' : ''}
        Pickup: ${fmtDate(booking.pickupDate)}<br>
        Return: ${fmtDate(booking.returnDate)}<br>
        ${booking.pickupLocation ? 'Location: ' + escapeHTML(booking.pickupLocation) : ''}
      </p>
    </div>
  </div>

  <table class="items">
    <thead>
      <tr><th>Description</th><th class="num">Amount</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${formatAED(d.subtotal)}</span></div>
    <div class="row"><span>VAT (5%)</span><span>${formatAED(d.vat)}</span></div>
    <div class="row grand"><span>Total Due</span><span>${formatAED(d.total)}</span></div>
    <div class="row deposit"><span>Security deposit (refundable)</span><span>${formatAED(d.deposit)}</span></div>
    <div class="row grand"><span>Total Collected</span><span>${formatAED(d.totalCollected)}</span></div>
  </div>

  <div class="foot">
    Thank you for choosing <b>TMT Car Rental — The Money Team</b>.<br>
    The security deposit is fully refundable upon return of the vehicle in its original condition.
    This is a computer-generated invoice.
  </div>
</div>`;
}

// Open the invoice in a hidden iframe and trigger the print / save-as-PDF dialog.
export function printInvoice(booking, vehicle, customer) {
  const html = `<!doctype html><html><head><meta charset="utf-8">
    <title>${getInvoiceData(booking, vehicle, customer).invoiceNo} — TMT Car Rental</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
    </head><body style="margin:0">${invoiceHTML(booking, vehicle, customer)}</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    // Small delay lets web fonts settle before the print snapshot.
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };
}
