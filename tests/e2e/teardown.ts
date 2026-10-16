import {rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
export default async function teardown(){
  const dir=process.env.BETWEEN_E2E_DATA_DIR;
  if(dir&&dir.startsWith(path.join(tmpdir(),'between-e2e-')))await rm(dir,{recursive:true,force:true});
}
