import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from 'firebase-admin';

// Try to initialize Firebase Admin if credentials are available. If not,
// the API endpoints will respond with a helpful 501 until credentials are
// provided in production (service account JSON or ADC).
let hasAdmin = false;
try {
  const svcPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (svcPath) {
    // load service account JSON when path provided
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require(svcPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    hasAdmin = true;
    console.log('Firebase Admin initialized using service account.');
  } else {
    // Try Application Default Credentials
    try {
      admin.initializeApp();
      hasAdmin = true;
      console.log('Firebase Admin initialized using application default credentials.');
    } catch (e) {
      console.warn('Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS to enable server Firestore access.');
    }
  }
} catch (err) {
  console.warn('Failed to initialize Firebase Admin:', err.message || err);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper: respond when admin SDK isn't configured
  const requireAdmin = (res: any) => res.status(501).json({ error: 'Server missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS.' });

  // Providers
  app.get('/api/providers', async (req, res) => {
    if (!hasAdmin) return requireAdmin(res);
    try {
      const db = admin.firestore();
      const snap = await db.collection('service_providers').limit(100).get();
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to list providers' });
    }
  });

  app.get('/api/providers/:id', async (req, res) => {
    if (!hasAdmin) return requireAdmin(res);
    try {
      const db = admin.firestore();
      const doc = await db.collection('service_providers').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Provider not found' });
      res.json({ id: doc.id, ...doc.data() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch provider' });
    }
  });

  // Bookings
  app.post('/api/bookings', async (req, res) => {
    if (!hasAdmin) return requireAdmin(res);
    try {
      const db = admin.firestore();
      const payload = req.body;
      payload.createdAt = new Date().toISOString();
      const ref = await db.collection('bookings').add(payload);
      res.status(201).json({ id: ref.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  });

  app.get('/api/bookings/:userId', async (req, res) => {
    if (!hasAdmin) return requireAdmin(res);
    try {
      const db = admin.firestore();
      const q = db.collection('bookings').where('customerId', '==', req.params.userId).orderBy('createdAt', 'desc').limit(200);
      const snap = await q.get();
      res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });

  // Verifications
  app.post('/api/verifications', async (req, res) => {
    if (!hasAdmin) return requireAdmin(res);
    try {
      const db = admin.firestore();
      const payload = { ...req.body, submittedAt: new Date().toISOString(), status: 'pending' };
      const ref = await db.collection('verifications').add(payload);
      res.status(201).json({ id: ref.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to submit verification' });
    }
  });

  app.get('/api/verifications/:id', async (req, res) => {
    if (!hasAdmin) return requireAdmin(res);
    try {
      const db = admin.firestore();
      const doc = await db.collection('verifications').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Verification not found' });
      res.json({ id: doc.id, ...doc.data() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch verification' });
    }
  });

  // Disputes, Reports, Complaints
  app.post('/api/disputes', async (req, res) => {
    if (!hasAdmin) return requireAdmin(res);
    try {
      const db = admin.firestore();
      const payload = { ...req.body, createdAt: new Date().toISOString(), status: 'open' };
      const ref = await db.collection('disputes').add(payload);
      res.status(201).json({ id: ref.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create dispute' });
    }
  });

  app.post('/api/reports', async (req, res) => {
    if (!hasAdmin) return requireAdmin(res);
    try {
      const db = admin.firestore();
      const payload = { ...req.body, createdAt: new Date().toISOString(), status: 'pending' };
      const ref = await db.collection('reports').add(payload);
      res.status(201).json({ id: ref.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create report' });
    }
  });

  app.post('/api/complaints', async (req, res) => {
    if (!hasAdmin) return requireAdmin(res);
    try {
      const db = admin.firestore();
      const payload = { ...req.body, createdAt: new Date().toISOString(), status: 'received' };
      const ref = await db.collection('complaints').add(payload);
      res.status(201).json({ id: ref.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create complaint' });
    }
  });

  // Payments (webhook stub)
  app.post('/api/payments/webhook', async (req, res) => {
    // Note: integrate provider-specific signature verification (Stripe, PayPal) here.
    console.log('Payment webhook received', req.headers['stripe-signature'] || 'no-signature');
    // For now accept and respond 200
    res.status(200).json({ received: true });
  });

  // Process a payment server-side (centralized flow). This endpoint will create
  // a payment record, update invoice status, booking, and provider wallet.
  app.post('/api/payments/process', async (req, res) => {
    if (!hasAdmin) return requireAdmin(res);
    try {
      const { invoiceId, paymentMethod, invoice } = req.body;
      const db = admin.firestore();

      // Basic validation
      if (!invoiceId || !paymentMethod) return res.status(400).json({ error: 'invoiceId and paymentMethod are required' });

      // Create payment record
      const paymentData = {
        invoiceId,
        customerId: invoice?.customerId || null,
        providerId: invoice?.providerId || null,
        amount: invoice?.amount || 0,
        method: paymentMethod,
        transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'success',
        createdAt: new Date().toISOString()
      };

      const pRef = await db.collection('payments').add(paymentData);

      // Update invoice
      if (invoiceId) {
        await db.collection('invoices').doc(invoiceId).set({ status: 'paid', updatedAt: new Date().toISOString() }, { merge: true });
      }

      // Update booking if present
      if (invoice?.bookingId) {
        await db.collection('bookings').doc(invoice.bookingId).set({ paymentStatus: 'paid', escrowStatus: 'held', updatedAt: new Date().toISOString() }, { merge: true });
      }

      // Update provider wallet
      if (invoice?.providerId) {
        const wRef = db.collection('wallets').doc(invoice.providerId);
        const wSnap = await wRef.get();
        if (wSnap.exists) {
          const w = wSnap.data() || {};
          await wRef.set({ pendingBalance: (w.pendingBalance || 0) + (invoice.amount || 0), updatedAt: new Date().toISOString() }, { merge: true });
        } else {
          await wRef.set({ userId: invoice.providerId, balance: 0, pendingBalance: invoice.amount || 0, totalEarned: 0, createdAt: new Date().toISOString() });
        }
      }

      res.status(201).json({ id: pRef.id, status: 'success' });
    } catch (err) {
      console.error('Payment processing error', err);
      res.status(500).json({ error: 'Failed to process payment' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
