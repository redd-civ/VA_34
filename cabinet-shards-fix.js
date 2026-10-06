(()=>{
  function localizeWorldTypes(){
    const root=document.getElementById('shardsList');
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const text=node.nodeValue;
      const trimmed=text.trim();
      if(trimmed==='ancestral')node.nodeValue=text.replace('ancestral','Родовой');
      else if(trimmed==='ordinary')node.nodeValue=text.replace('ordinary','Обычный');
      else if(/\bancestral\b/i.test(text))node.nodeValue=text.replace(/\bancestral\b/gi,'Родовой');
      else if(/\bordinary\b/i.test(text))node.nodeValue=text.replace(/\bordinary\b/gi,'Обычный');
    });
  }

  function editShardFixed(shard){
    if(!shard||typeof state==='undefined')return;
    const current=state.shards.find(x=>x.id===shard.id)||shard;
    const root=document.getElementById('shardsList');
    if(!root||typeof shardForm!=='function')return;
    root.innerHTML=shardForm(current);
    const form=root.querySelector('#shardForm');
    if(!form)return;
    form.onsubmit=e=>{
      e.preventDefault();
      const values=Object.fromEntries(new FormData(form));
      const index=state.shards.findIndex(x=>x.id===current.id);
      if(index<0)return;
      state.shards[index]={
        ...state.shards[index],
        ...values,
        id:state.shards[index].id,
        size:Number(values.size||1),
        income:Number(values.income||0),
        population:values.population??'',
        garrison:Number(values.garrison||0),
        supply:Number(values.supply||0),
        defense:Number(values.defense||0),
        buildings:Number(values.buildings||0)
      };
      save();
      localizeWorldTypes();
    };
    const cancel=root.querySelector('#cancelShard');
    if(cancel)cancel.onclick=()=>{render();localizeWorldTypes()};
  }

  // Replace the global handler used by the World list. The update is by shard id,
  // never by pushing a new object, so editing cannot create a duplicate shard.
  window.editShard=editShardFixed;

  localizeWorldTypes();
  const root=document.getElementById('shardsList');
  if(root)new MutationObserver(localizeWorldTypes).observe(root,{childList:true,subtree:true});
})();
