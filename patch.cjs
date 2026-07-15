const fs = require('fs');
let code = fs.readFileSync('src/db.ts', 'utf8');

code = code.replace(/export class LanguageDb extends Dexie {/g, 'export class LanguageDb extends Dexie {\n  languagePairs!: Table<LanguagePair, string>;');
code = code.replace(/sentences: \'\+\+id, firebaseId, learned, nextReviewDate\',/g, 'languagePairs: \'id, firebaseId\',\n      sentences: \'++id, firebaseId, languagePairId, learned, nextReviewDate\',');
code = code.replace(/quizStats: \'\+\+id, firebaseId, date\'/g, 'quizStats: \'++id, firebaseId, languagePairId, date\'');
code = code.replace(/this\.version\(2\)\.stores\(\{/g, 'this.version(3).stores({');
code = code.replace(/this\.sentences\.hook\('creating', scheduleSync\);/g, 'this.languagePairs.hook("creating", scheduleSync);\n    this.languagePairs.hook("updating", scheduleSync);\n    this.languagePairs.hook("deleting", scheduleSync);\n    this.sentences.hook("creating", scheduleSync);');

fs.writeFileSync('src/db.ts', code);
