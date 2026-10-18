'use client';
import {useCallback,useEffect,useState} from 'react';
import {emptyLearning,type LearningProgress} from '@/lib/learning/progress';
export function useLearningState(){
 const [progress,setProgress]=useState<LearningProgress>(emptyLearning),[name,setName]=useState(''),[loaded,setLoaded]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{setError('');try{const r=await fetch('/api/learn',{cache:'no-store'}),data=await r.json();if(!r.ok)throw new Error(data.error||'进度暂未同步');setProgress(data.progress);setName(data.displayName);setLoaded(true);return true;}catch(e){setError((e as Error).message);return false;}},[]);
 useEffect(()=>{void load();},[load]);
 async function choose(displayName:string){const r=await fetch('/api/learn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'choose',displayName})});const data=await r.json();if(!r.ok)throw new Error(data.error||'称呼保存失败');setName(data.displayName);setProgress(data.progress);setLoaded(true);}
 return {progress,setProgress,name,loaded,error,load,choose};
}
