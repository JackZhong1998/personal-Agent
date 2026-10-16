'use client';
import {useId} from 'react';
export function Scene({variant='coffee',className=''}:{variant?:string;className?:string}) {
  const id=useId().replaceAll(':','');
  const sunset=variant==='sunset'; const sage=variant==='sage'; const lavender=variant==='lavender';
  const sky=sunset?'#f4c7ad':sage?'#bdcfc1':lavender?'#c8bfd7':'#dac5aa';
  return <svg className={'scene '+className} viewBox="0 0 640 420" fill="none" role="img" aria-label={sunset?'黄昏河畔的长椅与落日':sage?'绿意环绕的城市一角':lavender?'雨天安静温暖的书店':'午后阳光洒进街角咖啡馆'}>
    <defs><linearGradient id={id+'sky'} x1="320" y1="0" x2="320" y2="420" gradientUnits="userSpaceOnUse"><stop stopColor={sky}/><stop offset="1" stopColor={sunset?'#eedbba':'#f4e8d7'}/></linearGradient><linearGradient id={id+'wall'}><stop stopColor="#e6d3bb"/><stop offset="1" stopColor="#f6e9d7"/></linearGradient><filter id={id+'grain'}><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".09"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs>
    <g filter={`url(#${id}grain)`}>
    <path fill={`url(#${id}sky)`} d="M0 0h640v420H0z"/>
    {sunset?<>
      <circle cx="440" cy="130" r="56" fill="#faedcd"/><path d="M0 250q80-60 160-20t160-20 160 8 160-12v214H0" fill="#899a8b"/><path d="M0 289q150-42 300 0t340-7v138H0" fill="#b4b4a0"/><path d="M0 328q150-35 340-12t300-8v112H0" fill="#7f958d"/><path d="m355 307 152 0m-144 12h136m-128 18h116m-98 20h87" stroke="#e7c99f" strokeWidth="3" strokeLinecap="round"/>
      <path d="M-20 354 690 330v110H-20" fill="#a8a28a"/><path d="M44 235h230v17H44zM44 260h230v15H44zM39 289h242v18H39z" fill="#796d62"/><path d="M57 239v111m204-111v101" stroke="#4e5f58" strokeWidth="11"/>
      <path d="M39 0q64 73 61 219M57 60q66-41 115-19M85 132q-68-58-107-41" stroke="#686f54" strokeWidth="14"/>
      {[[-4,24],[35,20],[73,8],[111,16],[146,34],[5,72],[42,78],[85,53],[6,123]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="46" ry="21" transform={`rotate(${i*19} ${x} ${y})`} fill={i%2?'#909778':'#778366'}/>)}
    </>:<>
      <path d="M0 0h640v284H0z" fill={`url(#${id}wall)`}/>
      <path d="M201 37q0-24 24-24h301q24 0 24 24v239H201z" fill="#796f60"/><path d="M214 39q0-15 15-15h291q15 0 15 15v223H214z" fill={`url(#${id}sky)`}/>
      <circle cx="448" cy="90" r="36" fill="#f9edd4"/><path d="M213 193q41-43 83-8t75-13 78-8 85-24v122H214" fill="#aab09b"/>
      <path d="M232 212h20v50h-20zm38-37h34v87h-34zm62 20h29v67h-29zm111-18h49v85h-49z" fill="#b7ad95"/>
      <path d="M372 17v250m-166-126h339" stroke="#827561" strokeWidth="9"/>
      <path d="M193 265h367v13H193z" fill="#9c856e"/><path d="M0 284h640v136H0z" fill="#c7ac8c"/><path d="m214 278 70 0 175 142H285zm172 0h62l192 120v22h-54z" fill="#eddbc0" opacity=".8"/>
      <path d="M24 68h115v200H24z" fill="#a28c71"/><path d="M31 75h101v181H31z" fill="#706959"/><path d="M29 138h106m-106 62h106" stroke="#ae987c" strokeWidth="7"/>
      {[43,57,68,82,98,113].map((x,i)=><g key={x}><path d={`M${x} ${86+i%3*7}h9v48h-9z`} fill={['#c4ad96','#b6b8a0','#d9c8ad'][i%3]}/><path d={`M${x} ${155+i%2*5}h9v40h-9z`} fill={['#dac4a5','#a5ae97','#ba9b85'][i%3]}/></g>)}
      <ellipse cx="331" cy="317" rx="112" ry="28" fill="#7e6857"/><ellipse cx="331" cy="309" rx="112" ry="28" fill="#b18c68"/><path d="M324 327h14v93h-14z" fill="#806c57"/>
      <path d="M293 294h25v18q-12 9-25 0z" fill="#f7ecdb"/><path d="M318 299q15-2 10 8h-10" stroke="#f7ecdb" strokeWidth="4"/><ellipse cx="305" cy="295" rx="12" ry="4" fill="#806a55"/>
      <path d="M354 288h24v18q-12 9-24 0z" fill="#ddd6bf"/><path d="M378 292q14-2 10 8h-10" stroke="#ddd6bf" strokeWidth="4"/><ellipse cx="366" cy="288" rx="12" ry="4" fill="#806a55"/>
      <path d="M280 305h38m39 9h26" stroke="#d1b593" strokeWidth="2"/>
      <path d="M183 304q-25-69-54-39v65h58zm290-2q28-69 56-36v65h-60z" fill="#8a9177"/><path d="M126 327h65v11h-65zm337 0h69v11h-69z" fill="#8a9177"/><path d="m138 338-7 65m50-65 5 65m289-65-7 65m52-65 7 65" stroke="#7b705d" strokeWidth="7"/>
      <path d="M571 289h46l-9 46h-29z" fill="#b8886c"/><path d="M593 290V154m0 64q-58-28-33-69 36 7 33 69m1 36q60-17 44-58-34 6-44 58m-1-62q42-27 23-59-29 8-23 59m-1 88q-53-16-48-49 35-5 48 49" stroke="#7d8b67" fill="#899574" strokeWidth="4"/>
      <path d="M0 0h640v9H0zM0 0h10v420H0z" fill="#d5bea0"/>
      <path d="M162 0v56" stroke="#736e5e" strokeWidth="3"/><path d="M132 77q30-43 60 0z" fill="#9b987c"/><ellipse cx="162" cy="77" rx="30" ry="5" fill="#f4dfb4"/>
    </>}
    </g>
  </svg>;
}
export function Portrait({className=''}:{className?:string}) {return <svg className={className} viewBox="0 0 140 160" fill="none" role="img" aria-label="ROSÉ 同人角色插画头像，非本人照片"><rect width="140" height="160" rx="24" fill="#e6cbd0"/><circle cx="72" cy="63" r="47" fill="#eecfd0"/><path d="M32 66q0-48 37-48 42 0 41 47l7 65H24z" fill="#dbbd8e"/><path d="M21 160v-27q7-30 49-32 44 1 51 32v27" fill="#37313b"/><path d="M58 90h24v21q-12 11-24 0" fill="#e3b9a0"/><ellipse cx="70" cy="65" rx="27" ry="35" fill="#f0cdb6"/><path d="M39 64q-7-46 32-45 38 0 34 43l-9-19q-9-2-24-14-5 13-23 17l-7 48-10 31z" fill="#e8cb9a"/><path d="M97 45q9 41 2 76l13 9-3-68" fill="#d0b180"/><path d="M57 66h4m18 0h4" stroke="#6f564a" strokeWidth="2.5" strokeLinecap="round"/><path d="M63 81q7 5 15-1" stroke="#b77c78" strokeWidth="2" strokeLinecap="round"/><path d="m69 67-2 8h5" stroke="#d9a98e" strokeWidth="1.5"/><circle cx="50" cy="77" r="5" fill="#e7aaab" opacity=".45"/><circle cx="90" cy="77" r="5" fill="#e7aaab" opacity=".45"/><path d="M59 132q2-13 11-6 9-7 11 6-1 9-11 16-11-8-11-16" fill="#c89aa9"/></svg>;}
