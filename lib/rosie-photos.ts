// Client-side Commons catalog. No API key, tracking proxy, generated likeness,
// or claim of endorsement. Only explicitly reusable photo licenses are accepted.
export type RosiePhotoSource={url:string;source:string;artist:string;license:string;licenseUrl:string;title:string};
let pending:Promise<RosiePhotoSource[]>|null=null;
const plain=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&(?:[a-z]+|#\d+);/gi,' ').replace(/\s+/g,' ').trim().slice(0,240);
export async function loadRosiePhotos():Promise<RosiePhotoSource[]>{
 if(pending)return pending;
 pending=(async()=>{
  try{const stored=JSON.parse(localStorage.getItem('rosie-commons-photos-v1')||'null');if(stored&&Date.now()-stored.at<86400000&&Array.isArray(stored.photos)&&stored.photos.length)return stored.photos;}catch{}
  const query=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:'intitle:Rosé BLACKPINK filetype:bitmap',gsrnamespace:'6',gsrlimit:'20',prop:'imageinfo',iiprop:'url|size|extmetadata',iiurlwidth:'1200'});
  const response=await fetch('https://commons.wikimedia.org/w/api.php?'+query,{signal:AbortSignal.timeout(12000),credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw new Error('Photo catalog unavailable');const data=await response.json();
  const photos:RosiePhotoSource[]=Object.values(data.query?.pages||{}).flatMap((page:unknown)=>{
   const p=page as {title:string;imageinfo?:{thumburl?:string;url:string;width:number;height:number;extmetadata?:Record<string,{value:string}>}[]},info=p.imageinfo?.[0];if(!info||!/ros[ée]/i.test(p.title))return [];
   const m=info.extmetadata||{},license=plain(m.LicenseShortName?.value||''),url=info.thumburl||info.url;
   if(!/^(CC BY(?:-SA)? [\d.]+|CC0(?: [\d.]+)?|Public domain)$/i.test(license)||!url.startsWith('https://upload.wikimedia.org/')||info.width>info.height*1.2)return [];
   const licenseUrl=m.LicenseUrl?.value||'';
   return [{url,source:'https://commons.wikimedia.org/wiki/'+encodeURIComponent(p.title),title:p.title.replace(/^File:/,''),artist:plain(m.Artist?.value||'Wikimedia Commons contributor'),license,licenseUrl:licenseUrl.startsWith('https://creativecommons.org/')?licenseUrl:''}];
  });
  if(!photos.length)throw new Error('No reusable portrait found');try{localStorage.setItem('rosie-commons-photos-v1',JSON.stringify({at:Date.now(),photos}));}catch{}return photos;
 })().catch(e=>{pending=null;throw e;});return pending;
}
