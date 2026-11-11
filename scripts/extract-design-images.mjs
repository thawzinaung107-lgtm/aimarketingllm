import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
const html = await readFile('design-reference/option2-v3.html', 'utf8')
const images = [...new Set(html.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g))]
await mkdir('public/images/design', { recursive: true })
const manifest = []
for (const [i, uri] of images.entries()) {
  const input = Buffer.from(uri.split(',')[1], 'base64')
  const file = `reference-${i + 1}.webp`
  const output = await sharp(input).rotate().resize({ width: 1440, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
  await writeFile(`public/images/design/${file}`, output)
  manifest.push({ file, originalSha256: createHash('sha256').update(input).digest('hex'), originalBytes: input.length, optimizedBytes: output.length })
}
await writeFile('design-reference/images.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(manifest)
