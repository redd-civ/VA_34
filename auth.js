const cfg=window.VA34_SUPABASE||{};
const configured=Boolean(cfg.url&&cfg.publishableKey&&window.supabase);
const AUTH_REDIRECT=`${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/,'/') }auth.html`.replace(/\s+/g,'');
let client=null,signup=false;
const $=id=>document.getElementById(id);
function message(t,bad=false){$("message").textContent=t;$("message").className=bad?"notice warning":"notice"}
function renderMode(){ $("authTitle").textContent=signup?"Регистрация":"Вход"; $("submitAuth").textContent=signup?"Создать аккаунт":"Войти"; $("toggleMode").textContent=signup?"У меня уже есть аккаунт":"Создать аккаунт"; $("password").autocomplete=signup?"new-password":"current-password"; }
async function refresh(){
  if(!configured){$("authState").textContent="Supabase не настроен";return}
  const {data:{user}}=await client.auth.getUser();
  if(user){$("authForm").style.display="none";$("logged").style.display="block";$("userEmail").textContent=user.email||"аккаунт";$("authState").textContent="Авторизован";message("Сессия активна.")}
}
$("toggleMode").onclick=()=>{signup=!signup;renderMode()};
$("authForm").onsubmit=async e=>{
 e.preventDefault();
 if(!configured){message("Сначала настройте supabase-config.js.",true);return}
 $("submitAuth").disabled=true;
 try{
  let result;
  if(signup) result=await client.auth.signUp({email:$("email").value.trim(),password:$("password").value,options:{emailRedirectTo:AUTH_REDIRECT}});
  else result=await client.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
  if(result.error) throw result.error;
  if(signup) message("Аккаунт создан. Проверьте почту для подтверждения.");
  else location.href="cabinet.html";
  await refresh();
 }catch(err){message(err.message||"Ошибка авторизации",true)}
 $("submitAuth").disabled=false;
};
$("logout").onclick=async()=>{if(client){await client.auth.signOut();location.reload()}};
if(configured){client=window.supabase.createClient(cfg.url,cfg.publishableKey);client.auth.onAuthStateChange(()=>refresh())}
renderMode();refresh();