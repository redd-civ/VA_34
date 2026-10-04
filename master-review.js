/* VA-34 Master review: special TЗ, Epic approvals and mechanical review queue. */
(()=>{
  const KEY='va34_master_reviews_v1';
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}};
  const save=x=>localStorage.setItem(KEY,JSON.stringify(x));
  function add(item){const a=load();a.unshift({...item,id:Date.now().toString(36),status:'pending',createdAt:new Date().toISOString()});save(a);render();}
  function setStatus(id,status){const a=load();const x=a.find(r=>r.id===id);if(x){x.status=status;x.updatedAt=new Date().toISOString();}save(a);render();}
  function render(){
    const box=document.getElementById('masterReviewPanel');if(!box)return;
    const a=load();
    box.innerHTML='<div class="section-head"><h2>🛡 Решения Мастера</h2><span class="muted">Специальные ТЗ и спорные механические решения</span></div>'+
      '<div class="notice">Одобрение здесь является решением Мастера. Каталог специальных ТЗ берётся из библиотеки правил; неизвестные механики не придумываются автоматически.</div>'+
      (a.length?'<div class="entity-list">'+a.map(x=>'<article class="entity"><h3>'+esc(x.title||'Запрос')+'</h3><p>'+esc(x.text||'')+'</p><div class="meta">'+esc(x.type||'review')+' · '+esc(x.status)+' · '+esc(x.createdAt||'')+'</div><div class="data-actions">'+(x.status==='pending'?'<button data-review="'+x.id+'" data-review-status="approved" class="primary">Одобрить</button><button data-review="'+x.id+'" data-review-status="rejected">Отклонить</button>':'')+'</div></article>').join('')+'</div>':'<div class="notice">Очередь решений пуста.</div>');
    box.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>setStatus(b.dataset.review,b.dataset.reviewStatus));
  }
  window.VA34_MASTER_REVIEW={add,load,render,setStatus};
  document.addEventListener('DOMContentLoaded',render);
})();
