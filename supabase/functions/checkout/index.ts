import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('checkout')+1);
 const [root,id,action]=[...['checkout'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='checkout'&&req.method==='POST'){const {user}=await requireUser(req);const key=req.headers.get('x-idempotency-key');if(!key||key.length<8||key.length>128)throw new HttpError(400,'x-idempotency-key required (8-128 chars)');const lines=body.lines;if(!Array.isArray(lines)||lines.length<1||lines.length>100)throw new HttpError(400,'Invalid checkout lines');const seen=new Set<string>();for(const line of lines){if(!line||typeof line!=='object')throw new HttpError(400,'Invalid line');const x=line as Record<string,unknown>;uuid(x.variant_id);uuid(x.location_id);integer(x.quantity,1,1000);const k=`${x.location_id}:${x.variant_id}`;if(seen.has(k))throw new HttpError(400,'Duplicate line');seen.add(k)}const result=await db.rpc('checkout_create',{p_user:user.id,p_key:key,p_lines:lines,p_fulfillment:body.fulfillment||{}});return reply(cors,ok(result),201)}
 throw new HttpError(404,'Route not found');
}));
