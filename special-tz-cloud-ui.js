/* Persistent special TЗ requests for the player cabinet. */
(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let reviews=[];
  async function sync(){
    try{
      if(!window.VA34_MASTER_CLOUD?.configured)return;
      const info=await window.VA34_MASTER_CLOUD.init();if(!info.authenticated)return;
      reviews=await window.VA34_MASTER_CLOUD.listForPlayer();
      document.querySelectorAll('[data-special-tz]').forEach(cb=>{const r=reviews.find(x=>x.item_id===cb.dataset.specialTz);if(r)cb.checked=true;});
    }catch(e){console.warn('VA-34 special TЗ sync',e)}
  }
  async function request(id){
    const tz=(window.VA34_SPECIAL_TZ||[]).find(x=>x.id===id);if(!tz)return false;
    try{
      if(!window.VA34_MASTER_CLOUD?.configured){alert('Облачная очередь решений не настроена. Выполните master-review-schema.sql в Supabase.');return false}
      const info=await window.VA34_MASTER_CLOUD.init();if(!info.authenticated){alert('Сначала войдите в аккаунт.');return false}
      const existing=reviews.find(x=>x.item_id===id&&x.status!=='rejected');if(existing)return true;
      await window.VA34_MASTER_CLOUD.request({id,item_id:id,type:'special_tz',title:tz.name,description:tz.effect||'',payload:tz});
      await sync();return true;
    }catch(e){alert('Не удалось отправить заявку Мастеру: '+(e.message||e));return false}
  }
  function install(){
    document.querySelectorAll('[data-special-tz]').forEach(cb=>{cb.addEventListener('change',async()=>{if(cb.checked){const ok=await request(cb.dataset.specialTz);if(!ok)cb.checked=false}else{alert('Отмена заявки должна выполняться через Мастера; снятие отметки не отзывает уже созданную заявку.');cb.checked=true}})});
    sync();
  }
  window.VA34_SPECIAL_TZ_CLOUD={sync,request};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,500));else setTimeout(install,500);
})();
