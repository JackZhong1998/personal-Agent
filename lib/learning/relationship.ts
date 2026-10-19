import type {LearningProgress} from './progress';
import {localDay} from '../story';
export const HEART_RULES={daily:5,maxBonus:5,miss:1};
export const previousDay=(day:string)=>new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10);
const validDay=(day:string)=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&!Number.isNaN(Date.parse(day+'T12:00:00Z'));
export function prepareRelationship(p:LearningProgress,today=localDay('Asia/Shanghai'),knownDays:string[]=[]){
 p.activeDays=Array.from(new Set([...(p.activeDays||[]),...p.days,...knownDays].filter(d=>validDay(d)&&d<=today))).sort();
 // Existing balances are preserved; penalties begin when the new rules are first used.
 if(!p.heartPolicy&&p.activeDays.length)p.heartPolicy={startedDay:today,settledThrough:previousDay(today)};
 if(!p.heartPolicy)return;
 const through=previousDay(today),from=p.heartPolicy.settledThrough;
 if(through<=from)return;
 const elapsed=Math.round((Date.parse(through+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000);
 const completed=new Set(p.days.filter(d=>d>from&&d<=through)).size;
 p.affection=Math.max(0,p.affection-Math.max(0,elapsed-completed)*HEART_RULES.miss);
 p.heartPolicy.settledThrough=through;
}
export function recordActivity(p:LearningProgress,day=localDay('Asia/Shanghai')){
 prepareRelationship(p,day);
 p.heartPolicy??={startedDay:day,settledThrough:previousDay(day)};
 if(!p.activeDays!.includes(day)){p.activeDays!.push(day);p.activeDays!.sort();}
}
export function dailyHeartReward(p:LearningProgress,day:string){
 if(p.days.includes(day))return 0;
 const completed=new Set(p.days);let prior=previousDay(day),bonus=0;
 while(completed.has(prior)&&bonus<HEART_RULES.maxBonus){bonus++;prior=previousDay(prior);}
 return HEART_RULES.daily+bonus;
}
export function relationshipSummary(p:LearningProgress){return {days:new Set([...(p.activeDays||[]),...p.days]).size,affection:p.affection};}
