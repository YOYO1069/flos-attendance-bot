import express from 'express';
import { middleware, WebhookEvent } from '@line/bot-sdk';
import { config } from './config.js';
import { handleWebhook } from './handlers/webhook.js';
import { sendBookingConfirmation } from './handlers/booking.js';

const app = express();
const PORT = config.port;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'FLOS Attendance Bot',
    timestamp: new Date().toISOString()
  });
});

// Booking confirmation webhook (called by dashboard after booking creation)
app.post('/api/booking-confirmation', express.json(), async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Validate required fields
    if (!bookingData.channelId || !bookingData.customerName || !bookingData.appointmentDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Send confirmation to LINE group
    await sendBookingConfirmation(bookingData);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Booking confirmation error:', error);
    res.status(500).json({ error: 'Failed to send confirmation' });
  }
});

// LINE webhook endpoint
app.post(
  '/webhook',
  middleware(config.line),
  async (req, res) => {
    try {
      const events: WebhookEvent[] = req.body.events;
      
      // Process events
      await Promise.all(
        events.map((event) => handleWebhook(event))
      );
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`✅ FLOS Attendance Bot running on port ${PORT}`);
  console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook`);
});
