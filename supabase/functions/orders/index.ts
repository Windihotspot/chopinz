import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('orders')+1);
 const [root,id,action]=[...['orders'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='orders'){const {user}=await requireUser(req);if(req.method==='GET'){let query=db.from('orders').select('*,seller_orders(*,order_items(*))').eq('user_id',user.id).order('created_at',{ascending:false});return reply(cors,ok(id?await query.eq('id',uuid(id)).maybeSingle():await query.range(pg.offset,pg.offset+pg.limit-1)))}}
 throw new HttpError(404,'Route not found');
}));
