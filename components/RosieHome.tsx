'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,CalendarDays,ChevronDown,Heart,MessageCircle,Plane,Plus} from 'lucide-react';
import {useLearningState} from './useLearningState';
import {CharacterDrawer} from './CharacterDrawer';
import {learningSummary} from '@/lib/learning/progress';
import {relationshipSummary} from '@/lib/learning/relationship';
export function RosieHome(){
 const learning=useLearningState(),summary=learningSummary(learning.progress),relationship=relationshipSummary(learning.progress);
 const [drawerOpen,setDrawerOpen]=useState(false),trigger=useRef<HTMLButtonElement>(null),previous=useRef(false);
 useEffect(()=>{if(previous.current&&!drawerOpen)trigger.current?.focus();previous.current=drawerOpen;},[drawerOpen]);
 useEffect(()=>{const body=document.body.style.overflow,html=document.documentElement.style.overflow;document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';return()=>{document.body.style.overflow=body;document.documentElement.style.overflow=html;};},[]);
 return <div className="character-home room-home">
 <div className="room-background" aria-hidden="true"/>
 <div className="room-figure" aria-hidden="true"><Image src="/rosie/rosie-secondary.jpg" alt="Rosé 公开活动照片，白边贴纸" className="photo-sticker" fill sizes="(max-width:760px) 76vw, 480px" quality={75} priority/></div>
 <header className="showcase-header" inert={drawerOpen}><button className="showcase-identity glass" ref={trigger} aria-label="选择角色" aria-expanded={drawerOpen} aria-haspopup="dialog" onClick={()=>setDrawerOpen(true)}><Image src="/rosie/rosie-rimowa.jpg" alt="" width={34} height={34}/><h1>Rosé</h1><ChevronDown size={14}/></button><Link className="showcase-add glass" href="/scenes/new" aria-label="新增场景"><Plus size={23}/></Link></header>
 <div className="showcase-relationship glass" inert={drawerOpen} aria-label="关系数值"><Link href="/relationship#days" aria-label="查看相识天数规则"><CalendarDays size={16}/><span>{learning.loaded?relationship.days:'—'}<small>天</small></span></Link><i/><Link href="/relationship#affection" aria-label="查看心动值规则"><Heart size={16}/><span>{learning.loaded?relationship.affection:'—'}</span></Link>{learning.error&&<button onClick={()=>void learning.load()} aria-label="重试加载关系数值">重试</button>}</div>
 <nav className="showcase-scenes" inert={drawerOpen} aria-label="已创建的场景"><Link href="/travel" className="showcase-scene-card glass"><span className="showcase-scene-icon"><Plane size={19}/></span><span><h2>一起去美国</h2><small>{summary.completed} / 7</small></span><ArrowUpRight size={16}/></Link></nav>
 <div className="showcase-bottom" inert={drawerOpen}><Link href="/chat" className="showcase-chat glass" aria-label="进入对话"><MessageCircle size={24}/><span>对话</span></Link></div>
 {drawerOpen&&<CharacterDrawer name={learning.name} registered={!!learning.progress.companionId} onSave={learning.choose} onClose={()=>setDrawerOpen(false)}/>}
 </div>;
}
