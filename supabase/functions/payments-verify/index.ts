import {handle,reply,readJson,requireMethod,HttpError,text} from '../_shared/https.ts';
import {getAdminClient,requireUser,requireRole,requireBusiness} from '../_shared/supabaseAdmin.ts';
import {initializePayment,verifyPayment,Provider} from '../_shared/payments.ts';
import {uuid,integer,allowed,ok,businessOf,page} from '../_shared/apiUtils.ts';
Deno.serve(handle(async(req,cors)=>{
 const db=getAdminClient(),pg=page(req),q=new URL(req.url).searchParams;
 const segments=new URL(req.url).pathname.split('/').filter(Boolean);
 const tail=segments.slice(segments.indexOf('payments-verify')+1);
 const [root,id,action]=[...['payments', 'verify'],...tail];
 let body:Record<string,unknown>={};if(['POST','PATCH','PUT'].includes(req.method))body=await readJson(req);
 if(root==='payments'&&id==='verify'&&req.method==='POST'){const {user}=await requireUser(req);const provider=body.provider as Provider,reference=text(body.reference,120);if(!['paystack','flutterwave'].includes(provider)||!reference)throw new HttpError(400,'Invalid payment verification');const transaction=ok(await db.from('payment_transactions').select('payment_id,payments(order_id,orders(user_id))').eq('provider',provider).eq('provider_reference',reference).single()) as {payments:{order_id:string;orders:{user_id:string}}};if(transaction.payments.orders.user_id!==user.id)throw new HttpError(403,'Not your payment');const verified=await verifyPayment(provider,reference,body.transaction_id?text(body.transaction_id):undefined);if(!verified.success||verified.reference!==reference)throw new HttpError(409,'Payment not successful');return reply(cors,ok(await db.rpc('payment_confirm',{p_provider:provider,p_reference:reference,p_amount:verified.amountKobo,p_currency:verified.currency,p_event_id:`verify:${reference}`,p_payload:verified.raw})))}
 throw new HttpError(404,'Route not found');
}));
