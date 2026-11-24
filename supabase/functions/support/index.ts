import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('support')+1);
 const [root,id,action]=[...['support'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='support'){const {user}=await requireUser(req);if(req.method==='GET')return reply(cors,ok(await db.from('support_tickets').select('*').eq('user_id',user.id)));if(req.method==='POST')return reply(cors,ok(await db.from('support_tickets').insert({user_id:user.id,subject:text(body.subject,160),description:text(body.description,4000),business_id:body.business_id||null}).select().single()),201)}
 throw new HttpError(404,'Route not found');
}));
