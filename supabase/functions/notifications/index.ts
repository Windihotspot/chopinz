import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('notifications')+1);
 const [root,id,action]=[...['notifications'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='notifications'){const {user}=await requireUser(req);if(req.method==='GET')return reply(cors,ok(await db.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).range(pg.offset,pg.offset+pg.limit-1)));if(req.method==='PATCH'&&id)return reply(cors,ok(await db.from('notifications').update({read_at:new Date().toISOString()}).eq('id',uuid(id)).eq('user_id',user.id).select()))}
 throw new HttpError(404,'Route not found');
}));
