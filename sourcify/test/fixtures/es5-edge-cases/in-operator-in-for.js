for ((a in b); ; ) ;
for ((a in b) && (c in d); ; ) ;
for (-(a in b); ; ) ;
for (cond ? a in b : c; ; ) ;
for (cond ? a : (b in c); ; ) ;
for (function(){
  a in b;
}; ; ) ;
for (function(){
  for ((a in b); ; ) ;
}; ; ) ;
