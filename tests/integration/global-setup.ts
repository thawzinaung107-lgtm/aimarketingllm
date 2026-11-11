/**
 * Starts `next start` (production build must exist) against the LOCAL
 * Supabase stack, waits for it, and tears it down afterwards.
 */
import { spawn, type ChildProcess } from 'node:child_process'

let server: ChildProcess | undefined

export async function setup() {
  for (const k of ['TEST_SUPABASE_PUBLISHABLE_KEY', 'TEST_SUPABASE_SECRET_KEY']) {
    if (!process.env[k]) throw new Error(`${k} is required (see scripts/test-integration.sh)`)
  }
  if (process.env.TEST_APP_URL) return // externally managed server

  const port = '3100'
  process.env.TEST_APP_URL = `http://localhost:${port}`
  // Run the Next binary directly (not via npx) so `server` is the server
  // process itself and teardown's kill() actually stops it.
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', port], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.TEST_SUPABASE_PUBLISHABLE_KEY,
      NEXT_PUBLIC_APP_URL: `http://localhost:${port}`,
      SUPABASE_SECRET_KEY: process.env.TEST_SUPABASE_SECRET_KEY,
    },
  })
  let log = ''
  server.stdout?.on('data', (d) => (log += d))
  server.stderr?.on('data', (d) => (log += d))

  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://localhost:${port}/login`, { redirect: 'manual' })
      if (r.status < 500) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  server.kill()
  throw new Error(`Next server did not start:\n${log}`)
}

export async function teardown() {
  if (!server || server.exitCode !== null) return
  const exited = new Promise((r) => server!.once('exit', r))
  server.kill('SIGTERM')
  await Promise.race([exited, new Promise((r) => setTimeout(r, 5000))])
  if (server.exitCode === null) server.kill('SIGKILL')
}
