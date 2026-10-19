'use client';
import {useEffect,useState} from 'react';
import {loadRosiePhotos,type RosiePhotoSource} from '@/lib/rosie-photos';
export function RosieCredits(){const [photos,setPhotos]=useState<RosiePhotoSource[]>([]);useEffect(()=>{let live=true;void loadRosiePhotos().then(p=>{if(live)setPhotos(p);}).catch(()=>{});return()=>{live=false;};},[]);return <details className="rosie-credits"><summary>照片来源与署名</summary>{photos.length?photos.map(p=><p key={p.source}><a href={p.source} target="_blank" rel="noreferrer">{p.title}</a><span>{p.artist} · {p.license} · {p.url==='/rosie/rosie-secondary.jpg'?'首页抠图并添加白边':'按版式裁切显示'}</span>{p.licenseUrl&&<a href={p.licenseUrl} target="_blank" rel="noreferrer">许可条款</a>}</p>):<p>Wikimedia Commons 照片载入后将在此显示摄影者、原图与许可。加载失败时不使用生成肖像代替。</p>}</details>;}
