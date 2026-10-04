/* VA-34 Master review UI. Persistent data lives in Supabase. */
(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const statusText={pending:'ожидает решения',approved:'одобрено',rejected:'отклонено'};
  let rows=[];
  async function refresh(){
    const box=document.getElementById('masterReviewPanel');if(!box)return;
    try{
      if(!window.VA34_MASTER_CLOUD?.configured){box.innerHTML='<div class="notice">Облачная очередь решений не настроена. Выполните master-review-schema.sql в Supabase.</div>';return;}
      const info=await window.VA34_MASTER_CLOUD.init();if(!info.authenticated){box.innerHTML='<div class="notice">Для решений Мастера требуется вход.</div>';return;}
      rows=await window.VA34_MASTER_CLOUD.listForMaster();render();
    }catch(e){box.innerHTML='<div class="warning">Ошибка очереди Мастера: '+esc(e.message||e)+'</div>';}
  }
  function render(){
    const box=document.getElementById('masterReviewPanel');if(!box)return;
    box.innerHTML='<div class="section-head"><h2>🛡 Решения Мастера</h2><span class="muted">Облачная очередь</span></div><div class="notice">Заявка игрока ≠ разрешение. Только решение Мастера переводит ТЗ или спорную механику в одобренное состояние.</div>'+
      (rows.length?'<div class="entity-list">'+rows.map(x=>'<article class="entity"><h3>'+esc(x.title||'Запрос')+'</h3><p>'+esc(x.description||'')+'</p><div class="meta">'+esc(x.type||'review')+' · '+esc(statusText[x.status]||x.status)+' · '+esc(x.created_at||'')+'</div>'+(x.decision_note?'<p><strong>Решение:</strong> '+esc(x.decision_note)+'</p>':'')+(x.status==='pending'?'<div class="data-actions"><button class="primary" data-review="'+esc(x.id)+'" data-status="approved">Одобрить</button><button data-review="'+esc(x.id)+'" data-status="rejected">Отклонить</button></div>':'')+'</article>').join('')+'</div>':'<div class="notice">Очередь решений пуста.</div>');
    box.querySelectorAll('[data-review]').forEach(b=>b.onclick=async()=>{if(!confirm(b.dataset.status==='approved'?'Одобрить заявку?':'Отклонить заявку?'))return;try{await window.VA34_MASTER_CLOUD.decide(b.dataset.review,b.dataset.status);await refresh()}catch(e){alert(e.message||e)}});
  }
  window.VA34_MASTER_REVIEW={refresh,render};
  document.addEventListener('DOMContentLoaded',refresh);
})();
