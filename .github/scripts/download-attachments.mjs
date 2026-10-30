// Zet de foto's uit een issue in src/assets/images/, zodat Claude ze kan gebruiken.
// Gebruikt door .github/workflows/claude-nieuwsbericht.yml (ISSUE_NUMBER en ISSUE_BODY via env).
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const MAX_FILES = 10;
const MAX_BYTES = 15 * 1024 * 1024;
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Unieke bijlage-URL's van GitHub in de volgorde van het issue; andere URL's tellen niet mee. */
export const extractUrls = (body) => [
  ...new Set(body.match(/https:\/\/github\.com\/user-attachments\/(?:assets|files)\/[\w./-]+/g) ?? []),
];

export async function downloadAttachments(issueNumber, body, outDir) {
  const urls = extractUrls(body);
  if (urls.length > MAX_FILES) throw new Error(`Te veel bijlagen: ${urls.length} (maximaal ${MAX_FILES})`);

  await mkdir(outDir, { recursive: true });
  const saved = [];
  for (const [index, url] of urls.entries()) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download mislukt (${response.status}): ${url}`);

    const type = response.headers.get('content-type')?.split(';')[0].trim();
    const extension = EXTENSIONS[type];
    if (!extension) {
      console.warn(`Overgeslagen, geen jpg/png/webp (${type}): ${url}`);
      continue;
    }

    const data = Buffer.from(await response.arrayBuffer());
    if (data.length > MAX_BYTES) throw new Error(`Bijlage is groter dan 15 MB: ${url}`);

    const path = join(outDir, `issue-${issueNumber}-${saved.length + 1}.${extension}`);
    await writeFile(path, data);
    saved.push(path);
  }
  return saved;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { ISSUE_NUMBER, ISSUE_BODY = '' } = process.env;
  if (!/^\d+$/.test(ISSUE_NUMBER ?? '')) throw new Error('ISSUE_NUMBER ontbreekt');
  const saved = await downloadAttachments(ISSUE_NUMBER, ISSUE_BODY, 'src/assets/images');
  console.log(`${saved.length} foto('s) opgeslagen`, saved);
}
