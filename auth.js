const cfg=window.VA34_SUPABASE||{};
const configured=Boolean(cfg.url&&cfg.publishableKey&&window.supabase);
const AUTH_REDIRECT=`${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/,'/') }auth.html`.replace(/\s+/g,'');
let client=null,signup=false;
const $=id=>document.getElementById(id);
function message(t,bad=false){$("message").textContent=t;$("message").className=bad?"notice warning":"notice"}
function renderMode(){ $("authTitle").textContent=signup?"Регистрация":"Вход"; $("playerName").required=signup; $("playerNameRow").style.display=signup?"":"none"; $("submitAuth").textContent=signup?"Создать аккаунт":"Войти"; $("toggleMode").textContent=signup?"У меня уже есть аккаунт":"Создать аккаунт"; $("password").autocomplete=signup?"new-password":"current-password"; }
function withTimeout(promise,ms=8000){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Таймаут подключения к Supabase (8 сек).')),ms)} )]).finally(()=>clearTimeout(timer))}
function showSignupSuccess(email){
  $("authForm").style.display="none";
  $("message").style.display="none";
  $("signupSuccess").style.display="block";
  $("signupEmail").textContent=email||"указанный адрес";
  $("authState").textContent="Ожидается подтверждение email";
}
function backToLogin(){
  $("signupSuccess").style.display="none";
  $("message").style.display="block";
  $("authForm").style.display="grid";
  signup=false;
  renderMode();
  $("password").value="";
  message("Введите email и пароль для входа.");
}
async function refresh(){
  $("authState").textContent="Проверяем подключение к облаку…";
  if(!configured){$("authState").textContent="Supabase не настроен";message("Не найдены URL проекта или publishable key.",true);return}
  if(!client){$("authState").textContent="Ошибка клиента Supabase";message("Supabase SDK не загрузился.",true);return}
  try{
    const result=await withTimeout(client.auth.getUser());
    const user=result?.data?.user||null;
    if(user){$("authForm").style.display="none";$("signupSuccess").style.display="none";$("logged").style.display="block";$("userEmail").textContent=user.email||"аккаунт";$("authState").textContent="Авторизован";message("Сессия активна.")}
    else{$("authState").textContent="Облако подключено";if($("signupSuccess").style.display!=="block")message("Введите email и пароль для входа.")}
  }catch(err){
    console.error('VA34 auth check failed',err);
    $("authState").textContent="Ошибка подключения к облаку";
    message(err.message||"Не удалось проверить подключение к Supabase.",true);
  }
}
$("toggleMode").onclick=()=>{signup=!signup;renderMode()};
$("backToLogin").onclick=backToLogin;
$("authForm").onsubmit=async e=>{
 e.preventDefault();
 if(!configured){message("Сначала настройте supabase-config.js.",true);return}
 if(!e.currentTarget.checkValidity()){e.currentTarget.reportValidity();return}
 const button=$("submitAuth");
 button.disabled=true;
 const oldText=button.textContent;
 button.textContent=signup?"Создаём аккаунт…":"Выполняем вход…";
 try{
  let result;
  const email=$("email").value.trim();
  if(signup) result=await withTimeout(client.auth.signUp({email,password:$("password").value,options:{emailRedirectTo:AUTH_REDIRECT,data:{player_name:$("playerName").value.trim(),display_name:$("playerName").value.trim()}}}));
  else result=await withTimeout(client.auth.signInWithPassword({email,password:$("password").value}));
  if(result.error) throw result.error;
  if(signup){
    showSignupSuccess(email);
    return;
  }
  location.href="cabinet.html";
 }catch(err){
  console.error('VA34 auth action failed',err);
  message(err.message||"Ошибка авторизации",true);
 }finally{
  button.disabled=false;
  button.textContent=oldText;
 }
};
$("logout").onclick=async()=>{if(client){await client.auth.signOut();location.reload()}};
if(configured){client=window.supabase.createClient(cfg.url,cfg.publishableKey);client.auth.onAuthStateChange(()=>refresh())}
renderMode();refresh();