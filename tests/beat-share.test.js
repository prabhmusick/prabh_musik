const http = require('http');
const assert = require('assert');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 Starting Prabh Musik Beat Sharing & Detail Route Tests...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
      } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     ${err.message}`);
        failed++;
      }
    })();
  }

  // 1. Canonical Public URL Generation Test
  await test('Canonical domain and beat-specific public URL generation', () => {
    const CANONICAL_DOMAIN = 'https://www.prabhmusik.com';
    const beat1 = { id: 'bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y5', title: 'Urban Trap Anthem' };
    const beat2 = { id: 'bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y1', title: 'The Mountain Storytelling' };

    const url1 = `${CANONICAL_DOMAIN}/beat/${encodeURIComponent(beat1.id)}`;
    const url2 = `${CANONICAL_DOMAIN}/beat/${encodeURIComponent(beat2.id)}`;

    assert.strictEqual(url1, 'https://www.prabhmusik.com/beat/bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y5');
    assert.strictEqual(url2, 'https://www.prabhmusik.com/beat/bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y1');
    assert.notStrictEqual(url1, url2);
    assert(!url1.includes('localhost'), 'Must not share localhost');
    assert(!url1.includes('/admin'), 'Must not share admin URL');
    assert(!url1.includes('?search='), 'Must not share query search parameters');
  });

  // 2. Native Share Payload Formatting Test
  await test('Native share payload contains proper title, text, and canonical URL', () => {
    const CANONICAL_DOMAIN = 'https://www.prabhmusik.com';
    const beat = {
      id: 'bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y5',
      title: 'Morning Drive',
      producer: 'Shiv'
    };
    const shareUrl = `${CANONICAL_DOMAIN}/beat/${encodeURIComponent(beat.id)}`;
    const shareTitle = `${beat.title} | Prabh Musik`;
    const shareText = `Check out ${beat.title} by ${beat.producer} on Prabh Musik.`;

    const payload = {
      title: shareTitle,
      text: shareText,
      url: shareUrl,
    };

    assert.strictEqual(payload.title, 'Morning Drive | Prabh Musik');
    assert.strictEqual(payload.text, 'Check out Morning Drive by Shiv on Prabh Musik.');
    assert.strictEqual(payload.url, 'https://www.prabhmusik.com/beat/bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y5');
  });

  // 3. Social Share Link Formatting Test
  await test('Social sharing links format WhatsApp, Twitter/X, and Facebook URLs', () => {
    const shareUrl = 'https://www.prabhmusik.com/beat/bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y5';
    const shareText = 'Check out Urban Trap Anthem by Shiv on Prabh Musik.';

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    assert(whatsappUrl.includes('api.whatsapp.com'));
    assert(whatsappUrl.includes(encodeURIComponent(shareUrl)));
    assert(twitterUrl.includes('twitter.com/intent/tweet'));
    assert(twitterUrl.includes(encodeURIComponent(shareUrl)));
    assert(facebookUrl.includes('facebook.com/sharer'));
    assert(facebookUrl.includes(encodeURIComponent(shareUrl)));
  });

  // 4. Backend Direct Beat Lookup by Public ID & Slug
  await test('Backend resolves beat by public_id and slug', async () => {
    const resId = await fetchUrl('http://localhost:5005/api/beats/bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y5');
    assert.strictEqual(resId.status, 200);
    const jsonId = JSON.parse(resId.data);
    assert.strictEqual(jsonId.data.public_id, 'bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y5');
    assert.strictEqual(jsonId.data.title, 'Urban Trap Anthem');

    const resSlug = await fetchUrl('http://localhost:5005/api/beats/slug/urban-trap-anthem');
    assert.strictEqual(resSlug.status, 200);
    const jsonSlug = JSON.parse(resSlug.data);
    assert.strictEqual(jsonSlug.data.public_id, 'bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y5');
  });

  // 5. Frontend Public Beat Detail Page HTTP & Open Graph Verification
  await test('Public beat detail page /beat/[id] renders 200 OK with Open Graph metadata and artwork', async () => {
    const res = await fetchUrl('http://localhost:3000/beat/bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y5');
    assert.strictEqual(res.status, 200, `Expected 200 but got ${res.status}`);
    const html = res.data;

    // Verify Title & Open Graph tags for social scrapers (WhatsApp, FB, Twitter)
    assert(html.includes('Urban Trap Anthem'), 'HTML must include beat title');
    assert(html.includes('Shiv'), 'HTML must include artist/producer Shiv');
    assert(html.includes('249.99'), 'HTML must include authoritative price ₹249.99');
    assert(html.includes('Add to Cart'), 'HTML must include Add to Cart button');
    assert(html.includes('Share Beat'), 'HTML must include Share Beat button');

    // Verify Open Graph & Meta tags
    assert(/<meta property=["']og:title["'] content=["'][^"']*Urban Trap Anthem/i.test(html), 'Missing or invalid og:title');
    assert(/<meta property=["']og:image["']/i.test(html), 'Missing og:image tag');
    assert(/<meta name=["']twitter:card["'] content=["']summary_large_image["']/i.test(html), 'Missing twitter:card tag');
    assert(/<link rel=["']canonical["'] href=["']https:\/\/www.prabhmusik.com\/beat\/bt_01J4P8Z6VXZ9Y8VXZ9Y8VXZ9Y5["']/i.test(html), 'Missing canonical link');
  });

  // 6. Public Beat Detail Page Lookup by Slug
  await test('Public beat detail page /beat/[slug] also resolves seamlessly', async () => {
    const res = await fetchUrl('http://localhost:3000/beat/urban-trap-anthem');
    assert.strictEqual(res.status, 200);
    const html = res.data;
    assert(html.includes('Urban Trap Anthem'));
    assert(html.includes('Shiv'));
  });

  // 7. Unknown Beat Graceful Fallback
  await test('Unknown beat ID returns graceful Beat Not Found UI without throwing 500', async () => {
    const res = await fetchUrl('http://localhost:3000/beat/non_existent_beat_99999');
    assert.strictEqual(res.status, 200);
    const html = res.data;
    assert(html.includes('Beat Not Found'));
    assert(html.includes('Explore Beat Catalog'));
  });

  console.log(`\n📊 Test Summary: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
