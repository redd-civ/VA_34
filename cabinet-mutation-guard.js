/* VA-34 cabinet guard: ignore MutationObserver churn caused by option decoration. */
(function(){
  const NativeObserver=window.MutationObserver;
  if(!NativeObserver)return;
  window.MutationObserver=function(callback){
    const guarded=function(records,observer){
      const relevant=records.some(record=>{
        const nodes=[...record.addedNodes,...record.removedNodes];
        return nodes.some(node=>node.nodeType===1 && (
          node.matches?.('[data-starter-tech],[data-starter-magic]') ||
          node.querySelector?.('[data-starter-tech],[data-starter-magic]')
        ));
      });
      if(relevant)callback(records,observer);
    };
    return new NativeObserver(guarded);
  };
  window.MutationObserver.prototype=NativeObserver.prototype;
})();
