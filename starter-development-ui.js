/* VA-34 starter development UI: live pool totals, special TЗ catalog and starter cost hints. */
(function(){
  const LEVEL_NAMES=['Базовый','Продвинутый','Экспертный','Мастерский','Грандмастерский','Эпичный'];
  const LEVEL_ROMAN=['I','II','III','IV','V','VI'];
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function rows(selector){return [...document.querySelectorAll(selector)]}
  function parseTech(){return rows('[data-starter-tech]').map(r=>({name:r.querySelector('[data-tech-name]')?.value||'',level:+(r.querySelector('[data-tech-level]')?.value||1)})).filter(x=>x.name)}
  function parseMagic(){return rows('[data-starter-magic]').map(r=>({name:r.querySelector('[data-magic-name]')?.value||'',level:+(r.querySelector('[data-magic-level]')?.value||1)})).filter(x=>x.name)}
  function ensureState(){if(window.state&&state.lord){state.lord.specialTZ=Array.isArray(state.lord.specialTZ)?state.lord.specialTZ:[];return true}return false}
  function total(){const tech=parseTech(),magic=parseMagic();return {tech:tech.reduce((s,x)=>s+x.level,0),magic:magic.reduce((s,x)=>s+x.level,0),total:tech.reduce((s,x)=>s+x.level,0)+magic.reduce((s,x)=>s+x.level,0)}}
  function status(t){if(t<4)return ['error','Нужно ещё '+(4-t)+' уровня развития.'];if(t<=5)return ['ok','Стартовый пул в норме.'];if(t<=7)return ['master','6–7 уровней — требуется решение Мастера.'];return ['error','Больше 7 уровней на старте нельзя.']}
  function injectPool(){
    const host=$('starterTechBuilder')?.parentElement;if(!host||$('starterDevelopmentSummary'))return;
    const el=document.createElement('div');el.id='starterDevelopmentSummary';el.className='notice';el.style.margin='10px 0';host.appendChild(el);
  }
  function renderPool(){
    injectPool();const el=$('starterDevelopmentSummary');if(!el)return;const t=total(),s=status(t.total);el.innerHTML='<strong>Стартовое развитие:</strong> технологии <b>'+t.tech+'</b> + магия <b>'+t.magic+'</b> = <b>'+t.total+'</b> уровней. <span class="badge '+(s[0]==='ok'?'cloud':s[0]==='master'?'checking':'error')+'">'+esc(s[1])+'</span><div class="muted" style="margin-top:6px">Базовый пул: 4–5. До 2 уровней магии; неиспользованные уровни магии можно перенести в технологии.</div>'}
  function renderTZ(){
    const host=$('lordValidation');if(!host||$('specialTZPanel'))return;
    const box=document.createElement('div');box.id='specialTZPanel';box.className='notice';box.style.marginTop='10px';host.parentElement.insertBefore(box,host.nextSibling);renderTZInto(box);
  }
  function renderTZInto(box){
    ensureState();const list=Array.isArray(window.VA34_SPECIAL_TZ)?window.VA34_SPECIAL_TZ:[];const owned=(state.lord.specialTZ||[]);
    if(!list.length){box.innerHTML='<strong>Специальные ТЗ:</strong> каталог пока пуст.';return}
    box.innerHTML='<strong>Специальные ТЗ из библиотеки правил</strong><div class="muted" style="margin:5px 0 10px">Отметка «Заявить» не даёт автоматического разрешения: неизвестные/неподтверждённые ТЗ остаются на решении Мастера.</div>'+list.map(tz=>{const rec=owned.find(x=>(typeof x==='string'?x:x.id)===tz.id);const checked=!!rec;const approved=!!rec&&typeof rec==='object'&&rec.status==='approved';return '<div class="entity" style="margin:6px 0;padding:8px"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-special-tz="'+esc(tz.id)+'" '+(checked?'checked':'')+'> <span><b>'+esc(tz.name)+'</b> <span class="muted">'+esc(tz.source||'')+'</span></span></label><div class="muted" style="margin-top:4px">'+esc(tz.effect||'')+(tz.requiredLevel?' · Требуемый уровень: '+LEVEL_ROMAN[(+tz.requiredLevel||1)-1]:'')+'</div><div class="muted">Статус: '+(approved?'одобрено Мастером':checked?'заявлено':'не заявлено')+'</div></div>'}).join('');
    box.querySelectorAll('[data-special-tz]').forEach(cb=>cb.onchange=()=>{ensureState();const id=cb.dataset.specialTz;let arr=Array.isArray(state.lord.specialTZ)?state.lord.specialTZ:[];if(cb.checked){if(!arr.some(x=>(typeof x==='string'?x:x.id)===id))arr.push({id,status:'requested'})}else arr=arr.filter(x=>(typeof x==='string'?x:x.id)!==id);state.lord.specialTZ=arr;localStorage.setItem('va34_cabinet_v1',JSON.stringify(state));renderTZInto(box);renderStarterValidation(starterIssues())});
  }
  function install(){
    injectPool();renderPool();renderTZ();
    const tech=$('starterTechBuilder'),magic=$('starterMagicBuilder');
    const observer=new MutationObserver(()=>{renderPool();renderTZ()});
    if(tech)observer.observe(tech,{childList:true,subtree:true});if(magic)observer.observe(magic,{childList:true,subtree:true});
    document.querySelectorAll('#addStarterTech,#addStarterMagic').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{renderPool();renderTZ()},0)));
    setInterval(()=>{renderPool();renderTZ()},1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
  window.VA34_STARTER_UI={total,parseTech,parseMagic,renderPool,renderTZ};
})();
