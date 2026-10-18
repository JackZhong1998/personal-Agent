'use client';
import {useEffect,useState} from 'react';
import {loadRosiePhotos,type RosiePhotoSource} from '@/lib/rosie-photos';
export function RosiePhoto({className='',secondary=false}:{className?:string;secondary?:boolean}){
 const [photos,setPhotos]=useState<RosiePhotoSource[]>([]),[index,setIndex]=useState(0),[failed,setFailed]=useState(false);
 useEffect(()=>{let alive=true;void loadRosiePhotos().then(list=>{if(alive){setPhotos(list);setIndex(secondary?list.length-1:0);}}).catch(()=>{if(alive)setFailed(true);});return()=>{alive=false;};},[secondary]);
 const photo=photos[index];
 return <div className={'rosie-photo '+className}>{photo&&!failed&&<img key={photo.url} src={photo.url} alt="Rosé 的公开活动照片" onError={()=>setFailed(true)} fetchPriority={secondary?'auto':'high'} referrerPolicy="no-referrer"/>}<span className="rosie-photo-fallback" aria-hidden="true">r.</span><span className="rosie-photo-grain" aria-hidden="true"/>{failed&&<span className="photo-unavailable">照片暂未载入</span>}{photo&&<details className="photo-credit"><summary>Photo © / 来源</summary><p>{photo.artist} · {photo.license}</p><a href={photo.source} target="_blank" rel="noreferrer">Wikimedia Commons 原图</a>{photo.licenseUrl&&<a href={photo.licenseUrl} target="_blank" rel="noreferrer">查看许可</a>}<span>画面按版式裁切显示</span></details>}{!secondary&&photos.length>1&&<div className="photo-switch">{photos.map((p,i)=><button key={p.url} aria-label={`切换 Rosie 照片 ${i+1}`} aria-pressed={index===i} onClick={()=>{setFailed(false);setIndex(i);}}><i/></button>)}</div>}</div>;
}
