(()=>{
  let observerStarted=false;

  async function enableRejectedReapplication(){
    const box=document.getElementById('myApplication');
    if(!box||!window.supabase||!window.VA34_SUPABASE)return;
    const text=(box.textContent||'').toLowerCase();
    if(!text.includes('отклонена'))return;
    if(box.querySelector('#reapplyButton'))return;

    const db=window.supabase.createClient(VA34_SUPABASE.url,VA34_SUPABASE.publishableKey);
    const user=(await db.auth.getUser()).data.user;
    if(!user)return;
    const gameRes=await db.from('games').select('id,status').order('created_at',{ascending:true}).limit(1).maybeSingle();
    if(gameRes.error||!gameRes.data||gameRes.data.status!=='open')return;
    const game=gameRes.data;
    const appRes=await db.from('game_applications').select('id,status').eq('game_id',game.id).eq('player_id',user.id).maybeSingle();
    if(appRes.error||!appRes.data||appRes.data.status!=='rejected')return;

    const p=document.createElement('p');
    p.innerHTML='<button class="primary" id="reapplyButton">Подать новую заявку</button>';
    box.appendChild(p);
    document.getElementById('reapplyButton').onclick=async()=>{
      const button=document.getElementById('reapplyButton');
      if(button)button.disabled=true;
      const message=prompt('Сообщение Мастеру (необязательно):','');
      if(message===null){if(button)button.disabled=false;return;}
      const {error}=await db.from('game_applications').update({status:'pending',message,updated_at:new Date().toISOString()}).eq('id',appRes.data.id).eq('game_id',game.id).eq('player_id',user.id);
      if(error){alert(error.message);if(button)button.disabled=false;return;}
      box.innerHTML='<div class="notice">Ваша новая заявка находится на рассмотрении у Мастера.</div>';
    };
  }

  function start(){
    if(observerStarted)return;
    observerStarted=true;
    const box=document.getElementById('myApplication');
    if(!box)return;
    new MutationObserver(()=>enableRejectedReapplication()).observe(box,{childList:true,subtree:true});
    enableRejectedReapplication();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
