import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('seller-locations')+1);
 const [root,id,action]=[...['seller', 'locations'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='seller'&&id==='locations'){const businessId=uuid(body.business_id||q.get('business_id'));await requireBusiness(req,businessId);if(req.method==='GET')return reply(cors,ok(await db.from('business_locations').select('*').eq('business_id',businessId)));if(req.method==='POST')return reply(cors,ok(await db.from('business_locations').insert({...allowed(body,['name','address','city','state','latitude','longitude','pickup_enabled','delivery_enabled','is_open','operating_hours']),business_id:businessId}).select().single()),201)}
 throw new HttpError(404,'Route not found');
}));
