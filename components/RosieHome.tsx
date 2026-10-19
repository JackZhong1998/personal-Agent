'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useCallback,useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {CalendarDays,Heart,ArrowUpRight,ChevronDown,ChevronLeft,ChevronRight,MessageCircle,Plane,Plus,RotateCcw,ZoomIn,ZoomOut} from 'lucide-react';
import {useLearningState} from './useLearningState';
import {CharacterDrawer} from './CharacterDrawer';
import {learningSummary} from '@/lib/learning/progress';
import {relationshipSummary} from '@/lib/learning/relationship';
const views=[{id:'left',label:'左侧'},{id:'front',label:'正面'},{id:'right',label:'右侧'}];
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
type Point={x:number;y:number};
export function RosieHome(){
 const learning=useLearningState(),summary=learningSummary(learning.progress),relationship=relationshipSummary(learning.progress);
 const [view,setView]=useState(1),[zoom,setZoom]=useState(1),[pan,setPan]=useState<Point>({x:0,y:0}),[dragging,setDragging]=useState(false),[drawerOpen,setDrawerOpen]=useState(false);
 const stage=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),previousDrawer=useRef(false),reduced=useRef(false),points=useRef(new Map<number,Point>()),gesture=useRef<{start:Point;pan:Point;zoom:number;distance:number}|null>(null);
 const closeDrawer=useCallback(()=>setDrawerOpen(false),[]);
 useEffect(()=>{if(previousDrawer.current&&!drawerOpen)trigger.current?.focus();previousDrawer.current=drawerOpen;},[drawerOpen]);
 useEffect(()=>{const body=document.body.style.overflow,html=document.documentElement.style.overflow;document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden';const query=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>{reduced.current=query.matches;};update();query.addEventListener('change',update);return()=>{document.body.style.overflow=body;document.documentElement.style.overflow=html;query.removeEventListener('change',update);};},[]);
 useEffect(()=>{const el=stage.current;if(!el)return;const wheel=(e:WheelEvent)=>{e.preventDefault();setZoom(z=>clamp(z-e.deltaY*.001,1,2.2));};el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);},[]);
 useEffect(()=>{if(zoom===1)setPan({x:0,y:0});},[zoom]);
 function changeView(direction:number){setView(v=>(v+direction+views.length)%views.length);setPan({x:0,y:0});}
 function reset(){setView(1);setZoom(1);setPan({x:0,y:0});}
 function distance(){const [a,b]=Array.from(points.current.values());return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;}
 function down(e:ReactPointerEvent<HTMLDivElement>){
  if(e.pointerType==='mouse'&&e.button!==0)return;
  points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}
  if(points.current.size===1){gesture.current={start:{x:e.clientX,y:e.clientY},pan:{...pan},zoom,distance:0};setDragging(true);}
  else if(points.current.size===2)gesture.current={start:{x:e.clientX,y:e.clientY},pan:{...pan},zoom,distance:distance()};
 }
 function move(e:ReactPointerEvent<HTMLDivElement>){
  const el=stage.current;if(!el)return;
  if(points.current.has(e.pointerId)){
   points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const g=gesture.current;if(!g)return;
   if(points.current.size===2&&g.distance>0){setZoom(clamp(g.zoom*distance()/g.distance,1,2.2));return;}
   if(g.zoom>1&&points.current.size===1){setPan({x:clamp(g.pan.x+e.clientX-g.start.x,-el.clientWidth*.45,el.clientWidth*.45),y:clamp(g.pan.y+e.clientY-g.start.y,-el.clientHeight*.45,el.clientHeight*.45)});}return;
  }
  if(e.pointerType==='mouse'&&!reduced.current){const rect=el.getBoundingClientRect();el.style.setProperty('--turn-y',`${clamp((e.clientX-rect.left)/rect.width-.5,-.5,.5)*3}deg`);el.style.setProperty('--turn-x',`${-clamp((e.clientY-rect.top)/rect.height-.5,-.5,.5)*2}deg`);}
 }
 function up(e:ReactPointerEvent<HTMLDivElement>){const g=gesture.current;if(g&&points.current.size===1&&g.distance===0&&g.zoom===1&&Math.abs(e.clientX-g.start.x)>55)changeView(e.clientX<g.start.x?1:-1);points.current.delete(e.pointerId);gesture.current=null;setDragging(false);try{e.currentTarget.releasePointerCapture(e.pointerId);}catch{}}
 function cancel(){points.current.clear();gesture.current=null;setDragging(false);stage.current?.style.setProperty('--turn-x','0deg');stage.current?.style.setProperty('--turn-y','0deg');}
 const current=views[view];
 return <div className="character-home">
 <div className="showcase-environment" aria-hidden="true"><div className="showcase-halo"/><div className="showcase-floor"/></div>
 <div className="character-viewport" ref={stage} inert={drawerOpen} tabIndex={0} role="group" aria-label="Rosé 角色展示" data-view={current.id} data-zoom={zoom.toFixed(2)} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={()=>{points.current.clear();gesture.current=null;setDragging(false);}} onPointerLeave={()=>{if(!dragging){stage.current?.style.setProperty('--turn-x','0deg');stage.current?.style.setProperty('--turn-y','0deg');}}} onKeyDown={e=>{if(e.key==='ArrowLeft'){e.preventDefault();changeView(-1);}else if(e.key==='ArrowRight'){e.preventDefault();changeView(1);}else if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(z=>clamp(z+.2,1,2.2));}else if(e.key==='-'){e.preventDefault();setZoom(z=>clamp(z-.2,1,2.2));}else if(e.key==='Home'||e.key==='Escape'){e.preventDefault();reset();}}}>
 <div className={'showcase-figure '+(dragging?'is-dragging':'')} style={{transform:`translate3d(${pan.x}px,${pan.y}px,0) scale(${zoom})`}}><div className="showcase-perspective"><Image key={current.id} src={`/rosie/showcase-${current.id}.png`} alt={`Rosé 全身角色插画，${current.label}视角`} fill sizes="(max-width:760px) 100vw, 720px" quality={75} priority draggable={false}/></div></div>
 </div>
 <header className="showcase-header" inert={drawerOpen}><button className="showcase-identity glass" ref={trigger} aria-label="选择角色" aria-expanded={drawerOpen} aria-haspopup="dialog" onClick={()=>{cancel();setDrawerOpen(true);}}><Image src="/rosie/rosie-rimowa.jpg" alt="" width={34} height={34}/><h1>Rosé</h1><ChevronDown size={14}/></button><Link className="showcase-add glass" href="/scenes/new" aria-label="新增场景"><Plus size={23}/></Link></header>
 <div className="showcase-relationship glass" inert={drawerOpen} aria-label="关系数值"><Link href="/relationship#days" aria-label="查看相识天数规则"><CalendarDays size={16}/><span>{learning.loaded?relationship.days:'—'}<small>天</small></span></Link><i/><Link href="/relationship#affection" aria-label="查看心动值规则"><Heart size={16}/><span>{learning.loaded?relationship.affection:'—'}</span></Link>{learning.error&&<button onClick={()=>void learning.load()} aria-label="重试加载关系数值">重试</button>}</div>
 <nav className="showcase-scenes" inert={drawerOpen} aria-label="已创建的场景"><Link href="/travel" className="showcase-scene-card glass"><span className="showcase-scene-icon"><Plane size={19}/></span><span><h2>一起去美国</h2><small>{summary.completed} / 7</small></span><ArrowUpRight size={16}/></Link></nav>
 <div className="showcase-bottom" inert={drawerOpen}><div className="showcase-tools glass" role="group" aria-label="角色查看工具"><button aria-label="上一个视角" title="上一个视角" onClick={()=>changeView(-1)}><ChevronLeft size={17}/></button><span aria-live="polite">{current.label}</span><button aria-label="下一个视角" title="下一个视角" onClick={()=>changeView(1)}><ChevronRight size={17}/></button><i/><button aria-label="缩小角色" title="缩小" disabled={zoom<=1} onClick={()=>setZoom(z=>clamp(z-.2,1,2.2))}><ZoomOut size={17}/></button><button aria-label="放大角色" title="放大" disabled={zoom>=2.2} onClick={()=>setZoom(z=>clamp(z+.2,1,2.2))}><ZoomIn size={17}/></button><button aria-label="重置视角" title="重置" onClick={reset}><RotateCcw size={15}/></button></div><Link href="/chat" className="showcase-chat glass" aria-label="进入对话"><MessageCircle size={24}/><span>对话</span></Link></div>
 {drawerOpen&&<CharacterDrawer name={learning.name} registered={!!learning.progress.companionId} onSave={learning.choose} onClose={closeDrawer}/>}
 </div>;
}
