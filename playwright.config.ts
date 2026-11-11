import { defineConfig } from 'playwright/test'
const baseURL = process.env.TEST_APP_URL || 'http://127.0.0.1:3100'
if (!['localhost','127.0.0.1'].includes(new URL(baseURL).hostname)) throw new Error('E2E tests are local-only')
export default defineConfig({
  testDir:'./tests/e2e', fullyParallel:false, workers:1, timeout:45000,
  reporter:[['list'],['html',{open:'never'}]],
  use:{ baseURL,trace:'retain-on-failure',screenshot:'only-on-failure' },
  projects:[
    {name:'desktop',use:{viewport:{width:1440,height:1000}}},
    {name:'tablet',use:{viewport:{width:768,height:1024}}},
    {name:'mobile',use:{viewport:{width:375,height:812}}},
  ],
  webServer:{command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3100',url:baseURL,reuseExistingServer:false,timeout:60000},
})
