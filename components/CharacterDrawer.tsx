'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {Check,Compass,Plus,X} from 'lucide-react';
import {characters,characterSources} from '@/lib/characters';
import {NameSetup} from './NameSetup';
import {RosieCredits} from './RosieCredits';
export function CharacterDrawer({name,registered,initialEditing=false,onSave,onClose}:{name:string;registered:boolean;initialEditing?:boolean;onSave:(name:string)=>Promise<void>;onClose:()=>void}){
 const [editing,setEditing]=useState(initialEditing),panel=useRef<HTMLElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement;panel.current?.querySelector<HTMLElement>('button')?.focus();function key(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();onClose();}if(e.key!=='Tab')return;const nodes=panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,summary');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}document.addEventListener('keydown',key);return()=>{previous?.focus();document.removeEventListener('keydown',key);};},[onClose]);
 return <div className="character-drawer-layer"><button className="drawer-scrim" aria-label="关闭角色列表" onClick={onClose}/><aside className="character-drawer" ref={panel} role="dialog" aria-modal="true" aria-label="角色列表"><header className="drawer-header"><span>between</span><button className="icon-button" aria-label="关闭抽屉" onClick={onClose}><X size={20}/></button></header>
 <div className="drawer-scroll"><div className="drawer-greeting">Hi, <button aria-label="修改我的称呼" onClick={()=>setEditing(!editing)}>{name||'你'}</button></div>
 {editing&&<div className="drawer-profile"><NameSetup initial={name} editing={registered} onSave={async value=>{await onSave(value);onClose();}}/></div>}
 <div className="drawer-actions"><Link href="/characters/new"><Plus size={18}/>新增</Link><Link href="/explore"><Compass size={18}/>探索</Link></div>
 <nav className="character-list" aria-label="角色">{characters.map(c=>c.available?<button key={c.id} className="character-row active" onClick={onClose} aria-current="true"><Image src={c.image} alt="" width={48} height={48}/><span>{c.name}</span><Check size={16}/></button>:<Link key={c.id} className="character-row" href={'/characters/'+c.id}><Image src={c.image} alt="" width={48} height={48}/><span>{c.name}</span></Link>)}</nav>
 </div><footer className="drawer-footer"><details className="drawer-about"><summary>关于与来源</summary><p>非官方 AI 角色演绎，与艺人本人及团队无关联。角色全身图为 AI 生成。</p><RosieCredits/>{characterSources.map(s=><p key={s.id}><a href={s.source} target="_blank" rel="noreferrer">{s.artist}</a> · <a href={s.licenseUrl} target="_blank" rel="noreferrer">{s.license}</a></p>)}</details></footer>
 </aside></div>;
}
