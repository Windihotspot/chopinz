import freshLogo from "../assets/freshmart.svg";
import mamaLogo from "../assets/mamas-kitchen.svg";
export const productImages = {
  "rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=85",
  "tomatoes": "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=85",
  "avocado": "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=85",
  "eggs": "https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?auto=format&fit=crop&w=800&q=85",
  "milk": "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=85",
  "water": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&q=85",
  "chicken": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=85",
  "jollof": "https://placehold.co/800x600/EAF8EF/00532D?text=Party+Jollof+Rice",
  "plantain": "https://placehold.co/800x600/EAF8EF/00532D?text=Fried+Plantain"
};
export const sellers=[{id:'freshmart',logo:freshLogo,coverImage:'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=85',name:'FreshMart',category:'Groceries & essentials',location:'Lekki, Lagos',rating:4.8,fee:150000,eta:'35–50 min',description:'Fresh finds, everyday essentials and quality groceries, delivered from your neighbourhood.'},{id:'mamas-kitchen',logo:mamaLogo,coverImage:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85',name:'Mama’s Kitchen',category:'Restaurant',location:'Ikeja, Lagos',rating:4.9,fee:200000,eta:'25–40 min',description:'Freshly prepared Nigerian favourites, made with love.'}];
const item=(id,seller,name,category,price,stock,emoji,variants=[],old=0)=>({id,seller,name,category,price:price*100,stock,emoji,image:productImages[id],variants,old:old*100,description:`Enjoy ${name.toLowerCase()} from your local Chopinz seller. Available for delivery or collection.`});
export const products=[item('rice','freshmart','Premium rice','Pantry',8500,20,'🍚',[{id:'5kg',name:'5 kg',price:850000,stock:20},{id:'10kg',name:'10 kg',price:1600000,stock:8}]),item('tomatoes','freshmart','Fresh tomatoes','Produce',1800,25,'🍅',[],2200),item('avocado','freshmart','Avocados','Produce',2500,12,'🥑'),item('eggs','freshmart','Farm fresh eggs','Dairy & eggs',3500,15,'🥚'),item('milk','freshmart','Whole milk','Dairy & eggs',2200,10,'🥛'),item('water','freshmart','Bottled water pack','Drinks',3000,0,'💧'),item('jollof','mamas-kitchen','Party jollof rice','Meals',4500,20,'🍛',[{id:'regular',name:'Regular',price:450000,stock:20},{id:'large',name:'Large',price:650000,stock:10}]),item('chicken','mamas-kitchen','Grilled chicken','Meals',5000,12,'🍗'),item('plantain','mamas-kitchen','Fried plantain','Sides',1500,20,'🍌')];
export const money=n=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN'}).format(n/100);
