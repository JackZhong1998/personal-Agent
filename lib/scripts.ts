import {authored} from './rose-content';
export const SCRIPT_VERSION='rose-2026-10-16.1';
export type StoryImage={src:string;alt:string;caption:string};
export type ScriptTurn={line:string;translation:string;cue:string;suggestions:string[];image?:StoryImage};
const postcards:Record<string,[string,string,string]>={
 'rose-first-coffee':['coffee','flowers','coffee'], 'rose-walk-home':['sunset','river','sunset'],
 'rose-studio':['studio','studio','night'], 'rose-rain':['rain','coffee','rain'],
 'rose-market':['flowers','market','flowers'], 'rose-goodnight':['night','night','night'],
 'rose-song':['studio','sunset','studio'], 'rose-hard-day':['night','rain','night'],
 'rose-date':['dinner','river','dinner'], 'rose-tradition':['coffee','coffee','sunset'],
 'rose-confession':['river','sunset','river'], 'rose-us':['breakfast','flowers','breakfast']
};
export const scripts:Record<string,ScriptTurn[]>=Object.fromEntries(Object.entries(authored).map(([id,text])=>[
 id,text.trim().split('\n').map((row,index)=>{
  const [original,zh,cue,...suggestions]=row.split('|');
  const named=[3,12,19].includes(index);
  const line=named?'{{name}}, '+(original.startsWith('I')?original:original[0].toLowerCase()+original.slice(1)):original;
  const imageIndex=[5,12,16].indexOf(index);
  const asset=postcards[id][Math.max(0,imageIndex)];
  return {line,translation:named?'{{name}}，'+zh:zh,cue,suggestions,
   ...(imageIndex>=0?{image:{src:'/postcards/'+asset+'.svg',alt:cue+' · 剧情场景插画',caption:index===12?'a little corner of my day ♡':'thought you might like this ♡'}}:{})};
 })
]));
export function personalize(turn:ScriptTurn,name:string){
 return {...turn,line:turn.line.replaceAll('{{name}}',name),translation:turn.translation.replaceAll('{{name}}',name),personalized:turn.line.includes('{{name}}')};
}
