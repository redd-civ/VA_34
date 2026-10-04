/* Persistent special TЗ requests and Master decisions for the player cabinet. */
(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let reviews=[];
  function panel(){return document.getElementById('lordValidation')||document.getElementById('specialTZPanel');}
  async function sync(){
    try{
      if(!window.VA34_MASTER_CLOUD?.configured)return;
      const info=await window.VA34_MASTER_CLOUD.init();if(!info.authenticated)return;
      reviews=await window.VA34_MASTER_CLOUD.listForPlayer();
      document.querySelectorAll('[data-special-tz]').forEach(cb=>{
        const r=reviews.find(x=>x.item_id===cb.dataset.specialTz&&x.status!=='rejected');
        cb.checked=!!r;
        const host=cb.closest('.entity');
        if(host){let s=host.querySelector('[data-tz-cloud-status]');if(!s){s=document.createElement('div');s.dataset.tzCloudStatus='';s.className='muted';host.appendChild(s)}s.innerHTML=r?('Облачный статус: <b>'+esc(r.status==='approved'?'одобрено Мастером':'ожидает решения')+'</b>'):'Облачный статус: не заявлено';}
      });
      window.VA34_SPECIAL_TZ_CLOUD.reviews=reviews;
    }catch(e){console.warn('VA-34 special TЗ sync',e)}
  }
  async function request(id){
    const tz=(window.VA34_SPECIAL_TZ||[]).find(x=>x.id===id);if(!tz)return false;
    try{
      if(!window.VA34_MASTER_CLOUD?.configured){alert('Облачная очередь решений не настроена. Выполните master-review-schema.sql в Supabase.');return false}
      const info=await window.VA34_MASTER_CLOUD.init();if(!info.authenticated){alert('Сначала войдите в аккаунт.');return false}
      const existing=reviews.find(x=>x.item_id===id&&x.status!=='rejected');if(existing){await sync();return true;}
      await window.VA34_MASTER_CLOUD.request({id,item_id:id,type:'special_tz',title:tz.name,description:tz.effect||'',payload:tz});
      await sync();return true;
    }catch(e){alert('Не удалось отправить заявку Мастеру: '+(e.message||e));return false}
  }
  function install(){
    document.querySelectorAll('[data-special-tz]').forEach(cb=>{if(cb.dataset.cloudBound)return;cb.dataset.cloudBound='1';cb.addEventListener('change',async()=>{if(cb.checked){const ok=await request(cb.dataset.specialTz);if(!ok)cb.checked=false}else{alert('Отзыв заявки выполняется через Мастера; отметка не отменяет уже созданную заявку.');cb.checked=true}})});
    sync();
  }
  window.VA34_SPECIAL_TZ_CLOUD={sync,request,reviews};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,300));else setTimeout(install,300);
})();
