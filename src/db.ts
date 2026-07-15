import Dexie, { Table } from 'dexie';
import { auth, dbFirestore } from './firebase';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';

let syncTimeout: any = null;
function scheduleSync() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncToFirebase().catch(console.error);
  }, 2000);
}

export interface WordMeaning {
  targetText: string;
  transliteration?: string;
  nativeTransliteration?: string;
  sourceText2: string;
  sourceText1: string;
}

export interface LanguagePair {
  id?: string;
  firebaseId?: string;
  languagePairId?: string;
  targetLanguage: string;
  sourceLanguage1: string;
  sourceLanguage2?: string;
  description?: string;
  icon?: string;
}

export interface Sentence {
  id?: string | number;
  firebaseId?: string;
  languagePairId?: string;
  targetText: string;
  transliteration: string;
  nativeTransliteration?: string;
  sourceText1: string;
  sourceText2: string;
  wordMeanings?: WordMeaning[];
  learned: boolean;
  nextReviewDate?: Date;
  reviewCount: number;
}

export interface QuizStat {
  id?: string | number;
  firebaseId?: string;
  languagePairId?: string;
  date: Date;
  score: number;
  total: number;
}

export class LanguageDb extends Dexie {
  languagePairs!: Table<LanguagePair, string>;
  sentences!: Table<Sentence, string | number>;
  quizStats!: Table<QuizStat, string | number>;

  constructor() {
    super('LanguageDb');
    this.version(3).stores({
      languagePairs: 'id, firebaseId',
      sentences: '++id, firebaseId, languagePairId, learned, nextReviewDate',
      quizStats: '++id, firebaseId, languagePairId, date'
    });

    this.languagePairs.hook("creating", scheduleSync);
    this.languagePairs.hook("updating", scheduleSync);
    this.languagePairs.hook("deleting", scheduleSync);
    this.sentences.hook("creating", scheduleSync);
    this.sentences.hook('updating', scheduleSync);
    this.sentences.hook('deleting', scheduleSync);
    this.quizStats.hook('creating', scheduleSync);
    this.quizStats.hook('updating', scheduleSync);
    this.quizStats.hook('deleting', scheduleSync);
  }
}

export const db = new LanguageDb();

export const initialLanguagePairs: LanguagePair[] = [
  {
    id: 'hi-ta-en',
    targetLanguage: 'Hindi',
    sourceLanguage1: 'Tamil',
    sourceLanguage2: 'English',
    description: 'Learn spoken Hindi through Tamil and English.',
    icon: '🗣️'
  },
  {
    id: 'te-hi-en',
    targetLanguage: 'Telugu',
    sourceLanguage1: 'Hindi',
    sourceLanguage2: 'English',
    description: 'Learn spoken Telugu through Hindi and English.',
    icon: '🔤'
  },
  {
    id: 'kn-hi-en',
    targetLanguage: 'Kannada',
    sourceLanguage1: 'Hindi',
    sourceLanguage2: 'English',
    description: 'Learn spoken Kannada through Hindi and English.',
    icon: '📖'
  }
];

// Initial sentences to populate the DB if empty
export const initialSentences: Omit<Sentence, 'id'>[] = [
  { languagePairId: 'hi-ta-en', targetText: 'ये कितने का है?', transliteration: 'YE KITNE KA HEI?', nativeTransliteration: 'யே கித்னே கா ஹே?', sourceText1: 'இது எவ்வளவு?', sourceText2: 'How much is this?', learned: false, reviewCount: 0, wordMeanings: [{targetText: "ये", sourceText2: "this", sourceText1: "இது"}, {targetText: "कितने", sourceText2: "how much", sourceText1: "எவ்வளவு"}, {targetText: "का", sourceText2: "of", sourceText1: "உடைய"}, {targetText: "है", sourceText2: "is", sourceText1: "இருக்கிறது"}] },
  { languagePairId: 'hi-ta-en', targetText: 'आप कैसे हैं?', transliteration: 'AAP KAISE HAIN?', nativeTransliteration: 'ஆப் கைஸே ஹைன்?', sourceText1: 'நீங்கள் எப்படி இருக்கிறீர்கள்?', sourceText2: 'How are you?', learned: false, reviewCount: 0, wordMeanings: [{targetText: "आप", sourceText2: "you", sourceText1: "நீங்கள்"}, {targetText: "कैसे", sourceText2: "how", sourceText1: "எப்படி"}, {targetText: "हैं", sourceText2: "are", sourceText1: "இருக்கிறீர்கள்"}] },
  { languagePairId: 'hi-ta-en', targetText: 'मैं ठीक हूँ।', transliteration: 'MAIN THEEK HOON.', nativeTransliteration: 'மைன் டீக் ஹூன்.', sourceText1: 'நான் நலமாக இருக்கிறேன்.', sourceText2: 'I am fine.', learned: false, reviewCount: 0, wordMeanings: [{targetText: "मैं", sourceText2: "I", sourceText1: "நான்"}, {targetText: "ठीक", sourceText2: "fine", sourceText1: "நலமாக"}, {targetText: "हूँ", sourceText2: "am", sourceText1: "இருக்கிறேன்"}] },
  { languagePairId: 'hi-ta-en', targetText: 'आपका नाम क्या है?', transliteration: 'AAPKA NAAM KYA HAI?', nativeTransliteration: 'ஆப்கா நாம் க்யா ஹை?', sourceText1: 'உங்கள் பெயர் என்ன?', sourceText2: 'What is your name?', learned: false, reviewCount: 0, wordMeanings: [{targetText: "आपका", sourceText2: "your", sourceText1: "உங்கள்"}, {targetText: "नाम", sourceText2: "name", sourceText1: "பெயர்"}, {targetText: "क्या", sourceText2: "what", sourceText1: "என்ன"}, {targetText: "है", sourceText2: "is", sourceText1: "இருக்கிறது"}] },
  { languagePairId: 'hi-ta-en', targetText: 'मुझे समझ नहीं आया।', transliteration: 'MUJHE SAMAJH NAHIN AAYA.', nativeTransliteration: 'முஜே சமஜ் நஹிம் ஆயா.', sourceText1: 'எனக்கு புரியவில்லை.', sourceText2: 'I did not understand.', learned: false, reviewCount: 0, wordMeanings: [{targetText: "मुझे", sourceText2: "to me", sourceText1: "எனக்கு"}, {targetText: "समझ", sourceText2: "understand", sourceText1: "புரிய"}, {targetText: "नहीं", sourceText2: "not", sourceText1: "வில்லை"}, {targetText: "आया", sourceText2: "came", sourceText1: "வந்தது"}] }
];

export async function initDb() {
  const lpCount = await db.languagePairs.count();
  if (lpCount === 0) {
    await db.languagePairs.bulkAdd(initialLanguagePairs);
  }

  const count = await db.sentences.count();
  if (count === 0) {
    await db.sentences.bulkAdd(initialSentences);
  } else {
    // Migrate old sentences that might be missing wordMeanings or languagePairId
    const existing = await db.sentences.toArray();
    const toUpdate: any[] = [];
    
    for (const sentence of existing) {
      let needsUpdate = false;
      let updatedSentence = { ...sentence };

      if (!sentence.languagePairId) {
        updatedSentence.languagePairId = 'hi-ta-en';
        needsUpdate = true;
      }

      if (!sentence.wordMeanings || sentence.wordMeanings.length === 0) {
        const match = initialSentences.find(s => s.targetText === sentence.targetText);
        if (match && match.wordMeanings) {
          updatedSentence.wordMeanings = match.wordMeanings;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        toUpdate.push(updatedSentence);
      }
    }
    
    if (toUpdate.length > 0) {
      await db.sentences.bulkPut(toUpdate);
    }
  }
}

export async function syncToFirebase() {
  const user = auth.currentUser;
  if (!user) return;

  const languagePairs = await db.languagePairs.toArray();
  const sentences = await db.sentences.toArray();
  const quizStats = await db.quizStats.toArray();

  const batch = writeBatch(dbFirestore);

  for (const lp of languagePairs) {
    const docRef = doc(dbFirestore, `users/${user.uid}/languagePairs`, String(lp.id));
    batch.set(docRef, { ...lp, id: String(lp.id) }, { merge: true });
  }

  for (const s of sentences) {
    const docRef = doc(dbFirestore, `users/${user.uid}/sentences`, String(s.id));
    batch.set(docRef, { ...s, id: String(s.id) }, { merge: true });
  }

  for (const q of quizStats) {
    const docRef = doc(dbFirestore, `users/${user.uid}/quizStats`, String(q.id));
    batch.set(docRef, { ...q, id: String(q.id) }, { merge: true });
  }

  await batch.commit();
}

export async function syncFromFirebase() {
  const user = auth.currentUser;
  if (!user) return;

  const languagePairsRef = collection(dbFirestore, `users/${user.uid}/languagePairs`);
  const languagePairsSnap = await getDocs(languagePairsRef);
  const fbLanguagePairs: any[] = [];
  languagePairsSnap.forEach(doc => fbLanguagePairs.push(doc.data()));

  const sentencesRef = collection(dbFirestore, `users/${user.uid}/sentences`);
  const sentencesSnap = await getDocs(sentencesRef);
  const fbSentences: any[] = [];
  sentencesSnap.forEach(doc => fbSentences.push(doc.data()));

  const statsRef = collection(dbFirestore, `users/${user.uid}/quizStats`);
  const statsSnap = await getDocs(statsRef);
  const fbStats: any[] = [];
  statsSnap.forEach(doc => fbStats.push({
    ...doc.data(),
    date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
  }));

  if (fbLanguagePairs.length > 0) {
    await db.languagePairs.clear();
    await db.languagePairs.bulkAdd(fbLanguagePairs);
  }
  if (fbSentences.length > 0) {
    await db.sentences.clear();
    await db.sentences.bulkAdd(fbSentences);
  }
  if (fbStats.length > 0) {
    await db.quizStats.clear();
    await db.quizStats.bulkAdd(fbStats);
  }
}
