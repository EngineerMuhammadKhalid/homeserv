import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const Process = () => {
  const [stages, setStages] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, 'settings', 'site');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data: any = snap.data();
          setStages(Array.isArray(data.timelineStages) && data.timelineStages.length ? data.timelineStages : ['Requested', 'Accepted', 'In Progress', 'Review', 'Completed']);
        } else {
          setStages(['Requested', 'Accepted', 'In Progress', 'Review', 'Completed']);
        }
      } catch (err) {
        console.error('Failed to load process stages', err);
        setStages(['Requested', 'Accepted', 'In Progress', 'Review', 'Completed']);
      }
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Service Timeline</h1>
      <p className="text-gray-600 mb-6">Typical stages a booking goes through on HomeServ. Admin can configure these stages in System Settings.</p>
      <div className="flex flex-col gap-4">
        {stages.map((s, i) => (
          <div key={s} className="p-4 rounded border bg-white flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">{i+1}</div>
            <div className="font-medium">{s}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Process;
