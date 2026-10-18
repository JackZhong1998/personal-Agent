import {Mic,Upload,UserRound} from 'lucide-react';
import {StructurePage} from '@/components/StructurePage';
export default function NewCharacter(){return <StructurePage title="新增角色" preview><div className="preview-form"><div className="empty-avatar"><UserRound size={30}/></div><label>角色名称<input placeholder="名称" maxLength={30}/></label><label>声音<button className="upload-preview" disabled><Mic size={18}/>上传声音<Upload size={15}/></button></label><label>角色设定<textarea placeholder="性格、语气与背景" rows={4}/></label><button className="primary-button full" disabled>创建角色</button></div></StructurePage>;}
