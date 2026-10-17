import { AppError, getRecord, hash, locked, putAudio, putRecord, required } from './server';
async function guideFailure(response:Response):Promise<never>{
  const body=await response.json().catch(()=>null);
  // Only accept known codes; never echo provider bodies, signed URLs or tokens.
  const messages:Record<string,string>={
    upstream_rejected:'读音上游拒绝连接',
    upstream_timeout:'读音生成超时',
    upstream_http_error:'读音上游返回异常',
    upstream_unavailable:'读音上游连接失败',
    empty_audio:'读音服务未返回音频'
  };
  const code=typeof body?.code==='string'&&Object.hasOwn(messages,body.code)?body.code:'gateway_error';
  console.warn('guide request failed:',response.status,code);
  if(response.status===401||response.status===403)throw new AppError(503,'读音服务访问凭证不匹配','guide_auth');
  if(response.status===404)throw new AppError(503,'读音服务地址未找到','guide_endpoint');
  if(response.status===429)throw new AppError(429,'读音请求过多，请稍后重试','guide_rate_limit');
  throw new AppError(502,(messages[code]||'读音服务暂时无法连接')+'，可重试或使用系统朗读','guide_'+code);
}
export async function speech(text:string, kind:'role'|'guide', owner?:string) {
  const model=process.env.CARTESIA_MODEL||'sonic-3.6';
  const voice=process.env.CARTESIA_VOICE_ID||'afb402ce-7a39-49cf-acb5-3ff42e4e224f';
  const version=process.env.CARTESIA_VERSION||'2026-08-14';
  const key=(owner?owner+'/speech/':'public/')+hash(JSON.stringify({text,kind,model:kind==='role'?model:'edge-tts',voice:kind==='role'?voice:'en-US-AriaNeural',version:kind==='role'?version:'7.2.7',format:'mp3-44100-128000'}))+'.mp3';
  const cached=await getRecord<{mime:string}>('audio-meta/'+key);
  if(cached) return {key,cached:true};
  return locked('speech-'+hash(key),async()=>{
    if(await getRecord('audio-meta/'+key)) return {key,cached:true};
    let response:Response;
    if(kind==='role') {
      response=await fetch('https://api.cartesia.ai/tts/bytes',{
        method:'POST',signal:AbortSignal.timeout(45000),
        headers:{'X-API-Key':required('CARTESIA_API_KEY'),'Cartesia-Version':version,'Content-Type':'application/json'},
        body:JSON.stringify({model_id:model,transcript:text,voice:{id:voice},language:'en',output_format:{container:'mp3',sample_rate:44100,bit_rate:128000}})
      });
    } else {
      const base=required('EDGE_TTS_URL').replace(/\/$/,'');
      const auth=process.env.EDGE_TTS_SECRET;
      if(process.env.NODE_ENV==='production' && !auth) throw new AppError(503,'读音服务尚未配置访问凭证');
      try{response=await fetch(base+'/speak',{
        method:'POST',signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},body:JSON.stringify({text})
      });}catch(e){
        const timeout=e instanceof Error&&['TimeoutError','AbortError'].includes(e.name);
        console.warn('guide transport failed:',timeout?'timeout':'connection');
        throw new AppError(502,timeout?'读音服务连接超时，可重试或使用系统朗读':'读音服务连接失败，可重试或使用系统朗读',timeout?'guide_timeout':'guide_connection');
      }
      if(!response.ok)await guideFailure(response);
    }
    if(!response.ok) throw new AppError(response.status===429?429:502, kind==='role'?`角色语音服务返回 ${response.status}，请检查 Cartesia 账号权限、额度与声音 ID。`:`读音服务暂时不可用（${response.status}），请稍后重试。`);
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(bytes.length<64 || bytes.length>8000000 || !(response.headers.get('content-type')||'').startsWith('audio/')) throw new AppError(502,'语音服务没有返回有效音频');
    await putAudio(key,bytes,'audio/mpeg');
    await putRecord('speech-text/'+key,{text,kind,model:kind==='role'?model:'edge-tts',voice,generatedAt:new Date().toISOString()});
    return {key,cached:false};
  });
}
