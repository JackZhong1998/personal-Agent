'use client';
import {useEffect,useState} from 'react';
import Image from 'next/image';
import {loadRosiePhotos,type RosiePhotoSource} from '@/lib/rosie-photos';
export function RosiePhoto({className='',secondary=false,photoIndex}:{className?:string;secondary?:boolean;photoIndex?:number}){
 const [photos,setPhotos]=useState<RosiePhotoSource[]>([]),[index,setIndex]=useState(0),[failed,setFailed]=useState(false);
 useEffect(()=>{let alive=true;void loadRosiePhotos().then(list=>{if(alive){setPhotos(list);setIndex(photoIndex===undefined?(secondary?list.length-1:0):photoIndex%list.length);}}).catch(()=>{if(alive)setFailed(true);});return()=>{alive=false;};},[secondary,photoIndex]);
 const photo=photos[index];
 return <div className={'rosie-photo '+className}>{photo&&!failed&&<Image key={photo.url} src={photo.url} fill sizes="(max-width: 760px) 100vw, 600px" quality={75} loading="eager" alt="Rosé 的公开活动照片" onError={()=>setFailed(true)} fetchPriority={secondary?'auto':'high'} referrerPolicy="no-referrer" style={{objectPosition:photo.url.includes('sofi')?'center 28%':'center 25%'}}/>}<span className="rosie-photo-fallback" aria-hidden="true">r.</span><span className="rosie-photo-grain" aria-hidden="true"/>{failed&&<span className="photo-unavailable">照片暂未载入</span>}{photo&&<details className="photo-credit"><summary>来源</summary><p>{photo.artist} · {photo.license}</p><a href={photo.source} target="_blank" rel="noreferrer">Wikimedia Commons 原图</a>{photo.licenseUrl&&<a href={photo.licenseUrl} target="_blank" rel="noreferrer">查看许可</a>}<span>画面按版式裁切显示</span></details>}{!secondary&&photos.length>1&&<div className="photo-switch">{photos.map((p,i)=><button key={p.url} aria-label={`切换 Rosie 照片 ${i+1}`} aria-pressed={index===i} onClick={()=>{setFailed(false);setIndex(i);}}><Image src={p.url} alt="" width={48} height={60} quality={75} sizes="48px" loading={i===index?'eager':'lazy'}/></button>)}</div>}</div>;
}
