const mongoose = require('mongoose');
const Order = require('../models/order.model');
const shiprocketService = require('./shiprocket.service');

const syncActiveShipments = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('[Shipment Sync] Database is not connected. Skipping shipment sync.');
    return;
  }
  console.log('[Shipment Sync] Starting shipment status sync...');
  try {
    // Find active orders with shipment created and AWB code assigned
    const activeOrders = await Order.find({
      shipmentCreated: true,
      awbCode: { $ne: '' },
      status: { $nin: ['Cancelled'] },
      deliveryStatus: { $nin: ['Delivered', 'delivered', 'DELIVERED'] }
    });

    console.log(`[Shipment Sync] Found ${activeOrders.length} active shipments to update.`);

    for (const order of activeOrders) {
      try {
        console.log(`[Shipment Sync] Syncing status for order: ${order.orderNumber} (AWB: ${order.awbCode})`);
        const response = await shiprocketService.trackShipment(order.awbCode);
        const trackingInfo = response.tracking_data || {};
        const trackStatus = trackingInfo.track_status || trackingInfo.shipment_status;

        if (trackStatus) {
          console.log(`[Shipment Sync] Order ${order.orderNumber}: status in Shiprocket is '${trackStatus}'`);
          order.deliveryStatus = String(trackStatus);
          order.updatedShipmentAt = new Date();

          const lowerStatus = String(trackStatus).toLowerCase();
          if (lowerStatus.includes('deliver')) {
            order.status = 'Confirmed';
            if (order.payment && order.payment.status !== 'Paid') {
              order.payment.status = 'Paid';
              order.payment.paidAt = new Date();
            }
          } else if (lowerStatus.includes('cancel')) {
            order.status = 'Cancelled';
          } else if (
            lowerStatus.includes('transit') ||
            lowerStatus.includes('shipped') ||
            lowerStatus.includes('out for delivery') ||
            lowerStatus.includes('pickup')
          ) {
            order.status = 'Confirmed';
          }

          await order.save();
          console.log(`[Shipment Sync] Order ${order.orderNumber} successfully updated.`);
        }
      } catch (orderError) {
        console.error(`[Shipment Sync] Error syncing order ${order.orderNumber}:`, orderError.message);
      }
    }
  } catch (error) {
    console.error('[Shipment Sync] Error during batch sync:', error.message);
  }
};

const startShipmentStatusSync = () => {
  const intervalHours = Number(process.env.SHIPMENT_SYNC_INTERVAL_HOURS) || 6;
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  console.log(`[Shipment Sync] Scheduler initialized. Interval: every ${intervalHours} hours.`);
  
  // Run sync shortly after server starts up
  setTimeout(() => {
    syncActiveShipments();
  }, 10000); // 10-second delay
  
  setInterval(syncActiveShipments, intervalMs);
};

module.exports = {
  syncActiveShipments,
  startShipmentStatusSync
};
