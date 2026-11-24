import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('seller-products')+1);
 const [root,id,action]=[...['seller', 'products'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='seller'&&id==='products'){if(req.method==='POST'){const businessId=uuid(body.business_id);await requireBusiness(req,businessId);if(!text(body.name,150)||!text(body.slug,150))throw new HttpError(400,'Name and slug required');return reply(cors,ok(await db.from('products').insert({...allowed(body,['name','slug','description','category_id','unit','attributes','preparation_minutes']),business_id:businessId,status:'draft'}).select().single()),201)}if(req.method==='PATCH'&&action){const businessId=await businessOf(db,uuid(action));await requireBusiness(req,businessId);return reply(cors,ok(await db.from('products').update(allowed(body,['name','slug','description','category_id','unit','attributes','preparation_minutes','status'])).eq('id',action).select().single()))}}
 throw new HttpError(404,'Route not found');
}));
