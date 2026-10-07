/* VA-34: populate Lord and ancestral shard race selectors from the authoritative race catalog. */
(function(){
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function fill(select,current){
    if(!select)return;
    const races=Array.isArray(window.VA34_RULES?.races)?window.VA34_RULES.races:[];
    const keep=current||select.value||'';
    select.innerHTML='<option value="">— выбрать —</option>'+races.map(r=>`<option value="${esc(r.name)}">${esc(r.name)}</option>`).join('')+'<option value="custom">Другая / пока не внесена в справочник</option>';
    if(keep)select.value=keep;
  }
  function apply(){
    const lord=document.getElementById('lordRace');
    const ancestral=document.getElementById('ancestralRace');
    fill(lord,window.state?.lord?.race||'');
    fill(ancestral,window.state?.lord?.ancestralRace||'');
  }
  const old=window.fillLordRace;
  window.fillLordRace=function(){
    if(typeof old==='function')old();
    fill(document.getElementById('lordRace'),window.state?.lord?.race||'');
    fill(document.getElementById('ancestralRace'),window.state?.lord?.ancestralRace||'');
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,0));else setTimeout(apply,0);
})();
