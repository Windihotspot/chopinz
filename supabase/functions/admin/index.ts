import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('admin')+1);
 const [root,id,action]=[...['admin'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='admin'){await requireRole(req,['admin']);if(id==='businesses'&&req.method==='PATCH'&&action){const status=text(body.verification_status,20);if(!['approved','rejected','suspended'].includes(status))throw new HttpError(400,'Invalid status');return reply(cors,ok(await db.from('businesses').update({verification_status:status}).eq('id',uuid(action)).select().single()))}if(id==='providers'&&req.method==='PATCH'&&action){return reply(cors,ok(await db.from('payment_providers').update({enabled:body.enabled===true}).eq('code',action).select().single()))}if(id==='overview'&&req.method==='GET'){const [orders,businesses,products]=await Promise.all([db.from('orders').select('*',{count:'exact',head:true}),db.from('businesses').select('*',{count:'exact',head:true}),db.from('products').select('*',{count:'exact',head:true})]);return reply(cors,{orders:orders.count,businesses:businesses.count,products:products.count})}if(id==='tickets'&&req.method==='GET')return reply(cors,ok(await db.from('support_tickets').select('*').range(pg.offset,pg.offset+pg.limit-1)))}
 throw new HttpError(404,'Route not found');
}));
