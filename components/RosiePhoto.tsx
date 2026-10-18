'use client';
import {useEffect,useState} from 'react';
import {loadRosiePhotos,type RosiePhotoSource} from '@/lib/rosie-photos';
export function RosiePhoto({className='',secondary=false}:{className?:string;secondary?:boolean}){
 const [photo,setPhoto]=useState<RosiePhotoSource|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let alive=true;void loadRosiePhotos().then(photos=>{if(alive)setPhoto(photos[secondary&&photos.length>1?1:0]);}).catch(()=>{if(alive)setFailed(true);});return()=>{alive=false;};},[secondary]);
 return <div className={'rosie-photo '+className}>{photo&&!failed&&<img src={photo.url} alt="Rosé 的公开活动照片" onError={()=>setFailed(true)} fetchPriority={secondary?'auto':'high'} referrerPolicy="no-referrer"/>}<span className="rosie-photo-fallback" aria-hidden="true">r.</span><span className="rosie-photo-grain" aria-hidden="true"/>{failed&&<span className="photo-unavailable">照片暂未载入</span>}{photo&&<details className="photo-credit"><summary>Photo © / 来源</summary><p>{photo.artist} · {photo.license}</p><a href={photo.source} target="_blank" rel="noreferrer">Wikimedia Commons 原图</a>{photo.licenseUrl&&<a href={photo.licenseUrl} target="_blank" rel="noreferrer">查看许可</a>}<span>画面按版式裁切显示</span></details>}</div>;
}
