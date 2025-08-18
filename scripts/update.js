/**
 * Update script: fetch recent AI-internal adoption headlines from RSS feeds
 * and write data/posts.json in the repo. Intended to run in GitHub Actions.
 *
 * Note: This produces a concise, link-only roundup (no LLM). You can tune
 * feeds, keyword filters, and sentence trimming below.
 */
const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const parser = new Parser();

// Curated feeds (add/remove as needed)
const feeds = [
  'https://www.techradar.com/feeds/tag/ai',
  'https://www.wsj.com/news/technology?mod=rsswn',
  'https://www.ft.com/technology?format=rss',
  'https://www.businessinsider.com/sai?op=1&format=rss',
  'https://www.cio.com/index.rss',
  'https://www.theregister.com/headlines.atom',
  'https://venturebeat.com/category/ai/feed/'
];

// Simple keyword filter for internal/enterprise AI topics
const KEYWORDS = [
  'enterprise', 'employee', 'workforce', 'HR', 'IT', 'governance',
  'operations', 'internal', 'copilot', 'productivity', 'security',
  'moderation', 'rollout', 'compliance', 'shadow ai', 'automation',
  'ticket', 'support', 'service', 'back-office', 'policy', 'workflow'
];

function withinLastNDays(dateStr, days=7) {
  const d = new Date(dateStr || Date.now());
  const now = new Date();
  const diff = (now - d) / (1000*60*60*24);
  return diff <= days;
}

function matchesKeywords(text) {
  const t = (text || '').toLowerCase();
  return KEYWORDS.some(k => t.includes(k.toLowerCase())) || (text || '').toLowerCase().includes('ai');
}

function oneSentence(s='') {
  // Extract first sentence-ish up to ~180 chars
  const trimmed = s.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= 180) return trimmed;
  const cut = trimmed.slice(0, 180);
  const end = cut.lastIndexOf('. ');
  return (end > 60 ? cut.slice(0, end+1) : cut) + '…';
}

(async () => {
  const all = [];
  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items || []) {
        const date = item.isoDate || item.pubDate || new Date().toISOString();
        const text = `${item.title || ''} ${item.contentSnippet || ''}`;
        if (withinLastNDays(date, 7) && matchesKeywords(text)) {
          all.push({
            date,
            title: item.title || 'Untitled',
            url: item.link,
            snippet: item.contentSnippet || ''
          });
        }
      }
    } catch (e) {
      console.error('Feed error', url, e.message);
    }
  }

  // Deduplicate by URL and keep top 6 by date
  const seen = new Set();
  const deduped = all.filter(i => (seen.has(i.url) ? false : (seen.add(i.url), true)))
                     .sort((a,b) => new Date(b.date) - new Date(a.date))
                     .slice(0, 6);

  const today = new Date().toISOString().slice(0,10);
  const newPost = {
    date: today,
    subject: "Weekly: AI Inside Organizations — Headlines & Signals",
    intro: "A concise weekly on how companies use AI behind the scenes: governance, workflows, and measurable value.",
    items: deduped.map(i => ({
      headline: i.title,
      summary: oneSentence(i.snippet || i.title),
      url: i.url
    })),
    metrics: [
      "Track org-level KPIs: time-to-resolution (IT), content cycle time, policy exceptions, % tasks automated.",
      "Adoption metric: % of target roles using approved AI tools weekly (active users / eligible users).",
      "Risk metric: # of shadow-AI incidents per week and mean time to containment."
    ],
    takeaway: "Focus on 2–3 processes where AI can remove toil quickly. Pair enablement with clear guardrails to convert usage into impact."
  };

  // Load existing posts if present
  const dataPath = path.join(__dirname, '..', 'data', 'posts.json');
  let posts = { posts: [] };
  if (fs.existsSync(dataPath)) {
    posts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  }

  // Insert new post at the top
  posts.posts = [newPost, ...(posts.posts || [])];

  // Write back
  fs.writeFileSync(dataPath, JSON.stringify(posts, null, 2));
  console.log(`Wrote ${dataPath} with ${posts.posts.length} post(s).`);
})();
