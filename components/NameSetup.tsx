'use client';
import {useState} from 'react';
import {ArrowRight} from 'lucide-react';
export function NameSetup({initial='',editing=false,onSave}:{initial?:string;editing?:boolean;onSave:(name:string)=>Promise<void>}){
 const [name,setName]=useState(initial),[consent,setConsent]=useState(editing),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <form className="name-setup" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await onSave(name.trim());}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}><label>你的称呼<input value={name} maxLength={20} onChange={e=>setName(e.target.value)} placeholder="你的名字或昵称" autoComplete="nickname"/></label>{!editing&&<label className="consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>同意保存对话与录音。</span></label>}{error&&<p className="error-message" role="alert">{error}</p>}<button className="primary-button full" disabled={!name.trim()||!consent||busy}>{busy?'保存中…':editing?'保存':'就这样叫我'}<ArrowRight size={16}/></button></form>;
}
