'use client';
import {useState} from 'react';
import {ArrowRight} from 'lucide-react';
export function NameSetup({initial='',onSave}:{initial?:string;onSave:(name:string)=>Promise<void>}){
 const [name,setName]=useState(initial),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <form className="name-setup" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await onSave(name.trim());}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}><label>Rosie 应该怎么叫你？<input value={name} maxLength={20} onChange={e=>setName(e.target.value)} placeholder="你的名字或昵称" autoComplete="nickname"/></label><label className="consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>理解为 AI 角色演绎，同意保存对话与学习录音。</span></label>{error&&<p className="error-message" role="alert">{error}</p>}<button className="primary-button full" disabled={!name.trim()||!consent||busy}>{busy?'保存中…':'就这样叫我'}<ArrowRight size={16}/></button></form>;
}
