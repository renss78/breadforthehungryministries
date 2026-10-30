// Zet de foto's en video's uit een issue in de repo, zodat Claude ze kan gebruiken.
// Bijlagen komen uit het formulier (GitHub-URL's) of uit de Telegram-bot (regels `telegram-file: <id>`).
// Gebruikt door .github/workflows/claude-nieuwsbericht.yml (ISSUE_NUMBER, ISSUE_BODY, GITHUB_TOKEN en TELEGRAM_BOT_TOKEN via env).
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const MAX_FILES = 12;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // limiet van Cloudflare Pages
const IMAGE_EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const VIDEO_EXTENSIONS = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
// Telegram levert vaak geen bruikbaar content-type; daar bepaalt de bestandsnaam het type.
const TELEGRAM_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

/** Unieke bijlage-URL's van GitHub in de volgorde van het issue; andere URL's tellen niet mee. */
export const extractUrls = (body) => [
  ...new Set(body.match(/https:\/\/github\.com\/user-attachments\/(?:assets|files)\/[\w./-]+/g) ?? []),
];

/** Telegram-bestands-ID's in de volgorde van het issue. */
export const extractTelegramIds = (body) => [...body.matchAll(/^telegram-file: ([\w-]+)$/gm)].map((match) => match[1]);

async function fetchTelegramFile(fileId, botToken) {
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN ontbreekt');
  const info = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
  if (!info.ok) throw new Error(`Telegram kan bestand niet vinden (${info.status}): ${fileId}`);
  const { result } = await info.json();

  const response = await fetch(`https://api.telegram.org/file/bot${botToken}/${result.file_path}`);
  if (!response.ok) throw new Error(`Download mislukt (${response.status}): ${fileId}`);
  const type = TELEGRAM_TYPES[result.file_path.split('.').pop().toLowerCase()] ?? 'application/octet-stream';
  return new Response(response.body, { headers: { 'content-type': type } });
}

/** Video's zijn zonder inloggen vaak niet bereikbaar; probeer het dan met het token van de workflow. */
async function fetchAttachment(url, token) {
  const response = await fetch(url);
  if (response.status !== 404 || !token) return response;
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
}

export async function downloadAttachments(issueNumber, body, { imageDir, videoDir, token, telegramToken }) {
  const sources = [
    ...extractUrls(body).map((url) => ({ label: url, load: () => fetchAttachment(url, token) })),
    ...extractTelegramIds(body).map((id) => ({ label: id, load: () => fetchTelegramFile(id, telegramToken) })),
  ];
  if (sources.length > MAX_FILES) throw new Error(`Te veel bijlagen: ${sources.length} (maximaal ${MAX_FILES})`);

  await mkdir(imageDir, { recursive: true });
  await mkdir(videoDir, { recursive: true });
  const images = [];
  const videos = [];
  for (const { label, load } of sources) {
    const response = await load();
    // Een onbereikbare bijlage hoeft het bericht niet tegen te houden; Claude meldt die op het issue.
    if (response.status === 404) {
      console.warn(`Overgeslagen, niet gevonden: ${label}`);
      continue;
    }
    if (!response.ok) throw new Error(`Download mislukt (${response.status}): ${label}`);

    const type = response.headers.get('content-type')?.split(';')[0].trim();
    const isVideo = type in VIDEO_EXTENSIONS;
    const extension = isVideo ? VIDEO_EXTENSIONS[type] : IMAGE_EXTENSIONS[type];
    if (!extension) {
      console.warn(`Overgeslagen, geen foto of video (${type}): ${label}`);
      continue;
    }

    const data = Buffer.from(await response.arrayBuffer());
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (data.length > maxBytes) throw new Error(`Bijlage is groter dan ${maxBytes / 1024 / 1024} MB: ${label}`);

    const path = isVideo
      ? join(videoDir, `issue-${issueNumber}-video-${videos.length + 1}.${extension}`)
      : join(imageDir, `issue-${issueNumber}-${images.length + 1}.${extension}`);
    await writeFile(path, data);
    (isVideo ? videos : images).push(path);
  }
  return [...images, ...videos];
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { ISSUE_NUMBER, ISSUE_BODY = '', GITHUB_TOKEN, TELEGRAM_BOT_TOKEN } = process.env;
  if (!/^\d+$/.test(ISSUE_NUMBER ?? '')) throw new Error('ISSUE_NUMBER ontbreekt');
  const saved = await downloadAttachments(ISSUE_NUMBER, ISSUE_BODY, {
    imageDir: 'src/assets/images',
    videoDir: 'public/media/video',
    token: GITHUB_TOKEN,
    telegramToken: TELEGRAM_BOT_TOKEN,
  });
  console.log(`${saved.length} bestand(en) opgeslagen`, saved);
}
