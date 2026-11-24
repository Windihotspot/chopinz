import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('addresses')+1);
 const [root,id,action]=[...['addresses'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='addresses'){const {user}=await requireUser(req);if(req.method==='GET')return reply(cors,ok(await db.from('customer_addresses').select('*').eq('user_id',user.id)));if(req.method==='POST')return reply(cors,ok(await db.from('customer_addresses').insert({...allowed(body,['label','recipient','phone','address','city','state','latitude','longitude']),user_id:user.id}).select().single()),201);if(req.method==='DELETE'&&id)return reply(cors,ok(await db.from('customer_addresses').delete().eq('id',uuid(id)).eq('user_id',user.id).select()));}
 throw new HttpError(404,'Route not found');
}));
