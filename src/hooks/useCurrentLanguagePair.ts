import { useLiveQuery } from 'dexie-react-hooks';
import { db, LanguagePair } from '../db';
import { useEffect, useState } from 'react';

export function useCurrentLanguagePair(): LanguagePair | undefined {
  const [pairId, setPairId] = useState<string | null>(null);

  useEffect(() => {
    // Read from localStorage
    const currentId = localStorage.getItem('currentLanguagePairId');
    if (currentId) {
      setPairId(currentId);
    }
  }, []);

  const languagePairs = useLiveQuery(() => db.languagePairs.toArray()) || [];
  
  if (!pairId && languagePairs.length > 0) {
    // fallback to first
    return languagePairs[0];
  }

  return languagePairs.find(lp => lp.id === pairId);
}
