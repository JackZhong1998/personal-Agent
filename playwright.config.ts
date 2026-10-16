import {defineConfig,devices} from '@playwright/test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
const data=process.env.BETWEEN_E2E_DATA_DIR||mkdtempSync(path.join(tmpdir(),'between-e2e-'));
process.env.BETWEEN_E2E_DATA_DIR=data;
export default defineConfig({
  globalTeardown:'./tests/e2e/teardown.ts',
  testDir:'./tests/e2e',fullyParallel:false,workers:1,
  use:{baseURL:'http://127.0.0.1:3000',trace:'retain-on-failure',launchOptions:{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']},permissions:['microphone']},
  projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
  webServer:{command:'npm run dev',url:'http://127.0.0.1:3000',reuseExistingServer:false,timeout:90000,env:{DATA_DIR:data,CARTESIA_API_KEY:'',SUPABASE_URL:'',SUPABASE_SERVICE_ROLE_KEY:'',SESSION_SECRET:''}}
});
