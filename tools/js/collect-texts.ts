import { writeFileSync } from 'node:fs';
import { englishTexts, tamilTexts } from '../../src/lib/speechTexts';

const out = process.argv[2] ?? 'texts.json';
writeFileSync(out, JSON.stringify({ ta: tamilTexts(), en: englishTexts() }, null, 1));
console.log('tamil', tamilTexts().length, 'english', englishTexts().length);
