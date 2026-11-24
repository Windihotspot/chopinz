import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('seller-orders')+1);
 const [root,id,action]=[...['seller', 'orders'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='seller'&&id==='orders'){const businessId=uuid(q.get('business_id')||body.business_id);await requireBusiness(req,businessId,['owner','manager','staff']);if(req.method==='GET')return reply(cors,ok(await db.from('seller_orders').select('*,order_items(*)').eq('business_id',businessId).range(pg.offset,pg.offset+pg.limit-1)));if(req.method==='PATCH'&&action){await requireBusiness(req,businessId,['owner','manager']);const record=ok(await db.from('seller_orders').select('status,fulfillment_method').eq('id',uuid(action)).eq('business_id',businessId).single()) as {status:string;fulfillment_method:string};const transitions:Record<string,string[]>={pending:['accepted','rejected'],accepted:['preparing','ready_for_fulfillment','ready_for_pickup','cancelled'],preparing:['ready_for_fulfillment','ready_for_pickup'],ready_for_fulfillment:['awaiting_dispatch','out_for_delivery','completed'],ready_for_pickup:['completed'],awaiting_dispatch:['out_for_delivery'],out_for_delivery:['delivered'],delivered:['completed']};const next=text(body.status,40);if(!transitions[record.status]?.includes(next))throw new HttpError(409,'Invalid status transition');if(next==='ready_for_pickup'&&record.fulfillment_method!=='pickup'||next==='out_for_delivery'&&record.fulfillment_method!=='delivery')throw new HttpError(409,'Invalid fulfillment transition');const updated=ok(await db.from('seller_orders').update({status:next}).eq('id',action).eq('business_id',businessId).eq('status',record.status).select().maybeSingle());if(!updated)throw new HttpError(409,'Concurrent order update');ok(await db.from('order_status_history').insert({seller_order_id:action,order_id:(updated as {order_id:string}).order_id,old_status:record.status,new_status:next}));return reply(cors,updated)}}
 throw new HttpError(404,'Route not found');
}));
