/* VA-34 compatibility layer: restore legacy id-as-global DOM behavior explicitly. */
(function(){
  document.querySelectorAll('[id]').forEach(function(el){
    const id=el.id;
    if(!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(id)) return;
    /* Always bind the actual element. Some browsers expose named elements
       on Window without hasOwnProperty(), which made the previous guard
       leave startingMagic unresolved. */
    window[id]=el;
  });
})();
