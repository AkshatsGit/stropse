import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

let tracked = false;

export async function trackVisit() {
  if (tracked) return;
  tracked = true;
  
  try {
    let visitData = {
      timestamp: serverTimestamp(),
      date: new Date().toISOString().split('T')[0],
      userAgent: navigator.userAgent,
      page: window.location.pathname,
      referrer: document.referrer || 'direct'
    };

    // Try to get IP + Basic Geo (Non-blocking)
    try {
      const geoRes = await fetch('https://ipapi.co/json/').catch(() => null);
      if (geoRes) {
        const geo = await geoRes.json();
        visitData = {
          ...visitData,
          ip: geo.ip || 'unknown',
          city: geo.city || '',
          country: geo.country_name || '',
          org: geo.org || ''
        };
      }
    } catch (e) {
      console.warn('Geo tracking skipped:', e);
    }

    await addDoc(collection(db, 'siteVisits'), visitData);
  } catch (err) {
    console.error('Visit tracking failed:', err);
  }
}
