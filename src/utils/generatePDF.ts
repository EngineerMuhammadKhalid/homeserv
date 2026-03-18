// Simple PDF generation using canvas and file download
export const generateInvoicePDF = (booking: any, invoice: any) => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 800, 1000);

  // Header
  ctx.fillStyle = '#059669';
  ctx.fillRect(0, 0, 800, 100);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('HomeServ', 50, 60);
  ctx.font = '12px Arial';
  ctx.fillText('Invoice', 50, 85);

  // Invoice details
  ctx.fillStyle = '#000000';
  let y = 130;
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Invoice Details', 50, y);
  
  ctx.font = '12px Arial';
  y += 30;
  ctx.fillText(`Invoice ID: ${invoice.id}`, 50, y);
  y += 25;
  ctx.fillText(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 50, y);
  y += 25;
  ctx.fillText(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, y);
  y += 25;
  ctx.fillText(`Amount: Rs. ${invoice.amount}`, 50, y);
  y += 25;
  ctx.fillText(`Status: ${invoice.status}`, 50, y);

  // Service details
  y += 40;
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Service Details', 50, y);
  
  ctx.font = '12px Arial';
  y += 30;
  ctx.fillText(`Service: ${booking.serviceCategory || booking.serviceId}`, 50, y);
  y += 25;
  ctx.fillText(`Booking Date: ${new Date(booking.bookingDate).toLocaleDateString()}`, 50, y);
  y += 25;
  ctx.fillText(`Address: ${booking.address}`, 50, y);

  // Summary
  y += 40;
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Summary', 50, y);
  
  ctx.font = '12px Arial';
  y += 30;
  ctx.fillText(`Subtotal: Rs. ${invoice.amount}`, 50, y);
  y += 25;
  ctx.fillText(`Tax (0%): Rs. 0`, 50, y);
  y += 25;
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(`Total: Rs. ${invoice.amount}`, 50, y);

  // Footer
  y = 950;
  ctx.fillStyle = '#666666';
  ctx.font = '10px Arial';
  ctx.fillText('© 2026 HomeServ. All rights reserved.', 50, y);
  ctx.fillText('Thank you for using HomeServ', 50, y + 15);

  // Download
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `Invoice-${invoice.id}.png`;
  link.click();
};
