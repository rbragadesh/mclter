"""Pre-generate speech for every text the app speaks (public/audio/*.mp3 + manifest.json).

    node <bundle of tools/js/collect-texts.ts> texts.json
    python3 tools/gen_audio.py texts.json

Uses Microsoft's neural voices through the `edge-tts` package (ta-IN Pallavi
for Tamil, en-IN Neerja for English prompts). Existing files are kept, so the
script only fetches new or changed texts. Replace any clip with your own
recording by keeping the same file name.
"""
import asyncio
import hashlib
import json
import os
import sys

import certifi

# Use the system CA bundle when one is configured (e.g. behind a TLS proxy).
_ca = os.environ.get('SSL_CERT_FILE') or os.environ.get('REQUESTS_CA_BUNDLE')
if _ca:
    certifi.where = lambda: _ca

import edge_tts  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'public', 'audio')
VOICES = {'ta': ('ta-IN-PallaviNeural', '-12%'), 'en': ('en-IN-NeerjaNeural', '-5%')}


def name_for(lang, text):
    voice, rate = VOICES[lang]
    return hashlib.sha1(f'{voice}|{rate}|{text}'.encode()).hexdigest()[:12] + '.mp3'


async def one(sem, lang, text, path, stats):
    voice, rate = VOICES[lang]
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(text, voice, rate=rate).save(path + '.tmp')
                if os.path.getsize(path + '.tmp') < 800:
                    raise RuntimeError('empty audio')
                os.replace(path + '.tmp', path)
                stats['made'] += 1
                return
            except Exception as e:  # network hiccup: retry with backoff
                err = e
                await asyncio.sleep(2 ** attempt)
        stats['failed'].append((text, repr(err)))


async def main(texts_file):
    data = json.load(open(texts_file, encoding='utf-8'))
    os.makedirs(OUT, exist_ok=True)
    manifest = {'ta': {}, 'en': {}}
    jobs = []
    stats = {'made': 0, 'failed': []}
    sem = asyncio.Semaphore(6)
    for lang in ('ta', 'en'):
        for text in data[lang]:
            fn = name_for(lang, text)
            manifest[lang][text] = fn
            path = os.path.join(OUT, fn)
            if not os.path.exists(path):
                jobs.append(one(sem, lang, text, path, stats))
    print('to generate:', len(jobs), flush=True)
    for i in range(0, len(jobs), 60):
        await asyncio.gather(*jobs[i:i + 60])
        print('done', min(i + 60, len(jobs)), '/', len(jobs), flush=True)
    for text, err in stats['failed']:
        for lang in ('ta', 'en'):
            manifest[lang].pop(text, None)
    # drop clips that are no longer used
    used = {fn for m in manifest.values() for fn in m.values()}
    for fn in os.listdir(OUT):
        if fn.endswith('.mp3') and fn not in used:
            os.remove(os.path.join(OUT, fn))
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(',', ':'))
    print('generated', stats['made'], 'failed', len(stats['failed']), stats['failed'][:5])


if __name__ == '__main__':
    asyncio.run(main(sys.argv[1]))
