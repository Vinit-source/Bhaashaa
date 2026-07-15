import Dexie, { Table } from 'dexie';
import { auth, dbFirestore } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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

export async function initDb() {
  // Empty implementation as requested
}

function mapLanguagePairToShort(lp: LanguagePair) {
  return {
    i: lp.id,
    tl: lp.targetLanguage,
    s1: lp.sourceLanguage1,
    s2: lp.sourceLanguage2,
    d: lp.description,
    ic: lp.icon
  };
}

function mapShortToLanguagePair(lp: any): LanguagePair {
  return {
    id: lp.i,
    targetLanguage: lp.tl,
    sourceLanguage1: lp.s1,
    sourceLanguage2: lp.s2,
    description: lp.d,
    icon: lp.ic
  };
}

function mapWordMeaningToShort(wm: WordMeaning) {
  return {
    tt: wm.targetText,
    tr: wm.transliteration,
    ntr: wm.nativeTransliteration,
    s1: wm.sourceText1,
    s2: wm.sourceText2
  };
}

function mapShortToWordMeaning(wm: any): WordMeaning {
  return {
    targetText: wm.tt,
    transliteration: wm.tr,
    nativeTransliteration: wm.ntr,
    sourceText1: wm.s1,
    sourceText2: wm.s2
  };
}

function mapSentenceToShort(s: Sentence) {
  return {
    i: s.id,
    lp: s.languagePairId,
    tt: s.targetText,
    tr: s.transliteration,
    ntr: s.nativeTransliteration,
    s1: s.sourceText1,
    s2: s.sourceText2,
    wm: s.wordMeanings?.map(mapWordMeaningToShort),
    l: s.learned,
    nrd: s.nextReviewDate ? s.nextReviewDate.getTime() : undefined,
    rc: s.reviewCount
  };
}

function mapShortToSentence(s: any): Sentence {
  return {
    id: s.i,
    languagePairId: s.lp,
    targetText: s.tt,
    transliteration: s.tr,
    nativeTransliteration: s.ntr,
    sourceText1: s.s1,
    sourceText2: s.s2,
    wordMeanings: s.wm?.map(mapShortToWordMeaning),
    learned: s.l,
    nextReviewDate: s.nrd ? new Date(s.nrd) : undefined,
    reviewCount: s.rc
  };
}

function mapQuizStatToShort(qs: QuizStat) {
  return {
    i: qs.id,
    lp: qs.languagePairId,
    d: qs.date.getTime(),
    sc: qs.score,
    t: qs.total
  };
}

function mapShortToQuizStat(qs: any): QuizStat {
  return {
    id: qs.i,
    languagePairId: qs.lp,
    date: new Date(qs.d),
    score: qs.sc,
    total: qs.t
  };
}

export async function syncToFirebase() {
  const user = auth.currentUser;
  if (!user) return;

  const languagePairs = await db.languagePairs.toArray();
  const sentences = await db.sentences.toArray();
  const quizStats = await db.quizStats.toArray();

  const docRef = doc(dbFirestore, `users/${user.uid}`);
  await setDoc(docRef, {
    lp: languagePairs.map(mapLanguagePairToShort),
    s: sentences.map(mapSentenceToShort),
    qs: quizStats.map(mapQuizStatToShort)
  }, { merge: true });
}

export async function syncFromFirebase() {
  const user = auth.currentUser;
  if (!user) return;

  const docRef = doc(dbFirestore, `users/${user.uid}`);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) return;

  const data = snap.data();

  const fbLanguagePairs = (data.lp || []).map(mapShortToLanguagePair);
  const fbSentences = (data.s || []).map(mapShortToSentence);
  const fbStats = (data.qs || []).map(mapShortToQuizStat);

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
