"use strict";function setOfCachedUrls(e){return e.keys().then(function(e){return e.map(function(e){return e.url})}).then(function(e){return new Set(e)})}var precacheConfig=[["/reading/index.html","0f819d2537e0598a564f238ace731ea4"],["/reading/static/css/main.5ead487e.css","90c96301b1d20f9c16a91bc7989836b0"],["/reading/static/js/main.5f310407.js","cfa8813c3d10b9eaae32135039f25253"],["/reading/static/media/back-arrow.c5d07098.svg","c5d07098d950864b816a6fab3a2f6eed"],["/reading/static/media/bat.a271bab8.m4a","a271bab85e866152c34f258fcc3761e0"],["/reading/static/media/battleback10.a4686241.png","a4686241c1d452929c48ef85effb831c"],["/reading/static/media/battleback4.36285b26.png","36285b26c419211a94d6e491cbb883cc"],["/reading/static/media/battleback8.3d7fd049.png","3d7fd049b01eb9d6b295786e620fd669"],["/reading/static/media/bee.73978b0a.m4a","73978b0a1ee4389fe3518039036294d9"],["/reading/static/media/bird.902fc96e.m4a","902fc96ea15cafbc2d508be1dbebf1c0"],["/reading/static/media/card-back.2a6ae8cd.jpeg","2a6ae8cd0b49c63776debab58a4a3a3a"],["/reading/static/media/cat.5c569174.m4a","5c569174d393927debb8346f8d53566b"],["/reading/static/media/chest.e2a17d78.png","e2a17d78c09c609b2255ba8fee70fc21"],["/reading/static/media/coin.e4cebf62.png","e4cebf62da09ec1bb78553b09e66f82b"],["/reading/static/media/cow.51f7f0cf.m4a","51f7f0cf07cf72a61eb24e4fe394a58f"],["/reading/static/media/crab.3a188a3b.m4a","3a188a3b39a2b9a6952c536f918e59d0"],["/reading/static/media/dinosaur.03e9c83b.m4a","03e9c83be42b9dd323d12f5c5d1d3765"],["/reading/static/media/dog.f59ef267.m4a","f59ef267833b40d74c509e3d9ef70e08"],["/reading/static/media/fish.53d99013.m4a","53d99013e54e8c245b1f7002fb6e3c88"],["/reading/static/media/fox.d3a74812.m4a","d3a7481218560fe97fcca2f810584913"],["/reading/static/media/frog.c37ed4bd.m4a","c37ed4bd4b2d24f8e9fb8ec373847fed"],["/reading/static/media/gemBlue.5872aa69.png","5872aa694026d3ff344d70af726f29ce"],["/reading/static/media/gemGreen.ea756bc0.png","ea756bc05602e4346faa9f6ac8f8a3f4"],["/reading/static/media/gemRed.e55a9612.png","e55a96121b82c5f2f23e1aa812737cb8"],["/reading/static/media/glyphicons-halflings-regular.448c34a5.woff2","448c34a56d699c29117adc64c43affeb"],["/reading/static/media/glyphicons-halflings-regular.89889688.svg","89889688147bd7575d6327160d64e760"],["/reading/static/media/glyphicons-halflings-regular.e18bbf61.ttf","e18bbf611f2a2e43afc071aa2f4e1512"],["/reading/static/media/glyphicons-halflings-regular.f4769f9b.eot","f4769f9bdb7466be65088239c12046d1"],["/reading/static/media/glyphicons-halflings-regular.fa277232.woff","fa2772327f55d8198301fdb8bcfc8158"],["/reading/static/media/igloo.1c1d47f3.m4a","1c1d47f357e52353afea9816767e176d"],["/reading/static/media/jump.fcf4cb02.m4a","fcf4cb0219a0ace9ff3151ec23ab9068"],["/reading/static/media/pig.cad1cb67.m4a","cad1cb67b9a190e75c30f70752bc6f5e"],["/reading/static/media/rat.f97f375e.m4a","f97f375e9322d701a5d66d16420451d7"],["/reading/static/media/run.9421e588.m4a","9421e58888e1300d5018e7a1f15e4cfd"],["/reading/static/media/shark.7ccc21c0.m4a","7ccc21c038f43a29077c9f1319eefb3a"],["/reading/static/media/slick.b7c9e1e4.woff","b7c9e1e479de3b53f1e4e30ebac2403a"],["/reading/static/media/slick.ced611da.eot","ced611daf7709cc778da928fec876475"],["/reading/static/media/slick.d41f55a7.ttf","d41f55a78e6f49a5512878df1737e58a"],["/reading/static/media/slick.f97e3bbf.svg","f97e3bbf73254b0112091d0192f17aec"],["/reading/static/media/snake.89dc9a22.m4a","89dc9a229eb482435bc631685367a592"],["/reading/static/media/speaker-icon.502251e6.svg","502251e64d7d65fdf035640b9ee394b5"],["/reading/static/media/spyglass.e002a393.png","e002a3936bc0cc36f5ee48413ffe00d2"],["/reading/static/media/store-icon.717d415f.svg","717d415ff2095bbb79c0014886ea5ef6"],["/reading/static/media/sun.8b493fc8.m4a","8b493fc8ba4e98a7f76cce97bd8c809f"],["/reading/static/media/tome.ecdbb094.png","ecdbb094d9f11646b80d0d8369de5f10"],["/reading/static/media/wood-texture.6350ef0b.png","6350ef0b92f0f55e3116af968556c107"],["/reading/static/media/worm.1b702492.m4a","1b702492125eb93eee1648f334914e7b"]],cacheName="sw-precache-v3-sw-precache-webpack-plugin-"+(self.registration?self.registration.scope:""),ignoreUrlParametersMatching=[/^utm_/],addDirectoryIndex=function(e,a){var t=new URL(e);return"/"===t.pathname.slice(-1)&&(t.pathname+=a),t.toString()},cleanResponse=function(e){if(!e.redirected)return Promise.resolve(e);return("body"in e?Promise.resolve(e.body):e.blob()).then(function(a){return new Response(a,{headers:e.headers,status:e.status,statusText:e.statusText})})},createCacheKey=function(e,a,t,c){var i=new URL(e);return c&&i.pathname.match(c)||(i.search+=(i.search?"&":"")+encodeURIComponent(a)+"="+encodeURIComponent(t)),i.toString()},isPathWhitelisted=function(e,a){if(0===e.length)return!0;var t=new URL(a).pathname;return e.some(function(e){return t.match(e)})},stripIgnoredUrlParameters=function(e,a){var t=new URL(e);return t.hash="",t.search=t.search.slice(1).split("&").map(function(e){return e.split("=")}).filter(function(e){return a.every(function(a){return!a.test(e[0])})}).map(function(e){return e.join("=")}).join("&"),t.toString()},hashParamName="_sw-precache",urlsToCacheKeys=new Map(precacheConfig.map(function(e){var a=e[0],t=e[1],c=new URL(a,self.location),i=createCacheKey(c,hashParamName,t,/\.\w{8}\./);return[c.toString(),i]}));self.addEventListener("install",function(e){e.waitUntil(caches.open(cacheName).then(function(e){return setOfCachedUrls(e).then(function(a){return Promise.all(Array.from(urlsToCacheKeys.values()).map(function(t){if(!a.has(t)){var c=new Request(t,{credentials:"same-origin"});return fetch(c).then(function(a){if(!a.ok)throw new Error("Request for "+t+" returned a response with status "+a.status);return cleanResponse(a).then(function(a){return e.put(t,a)})})}}))})}).then(function(){return self.skipWaiting()}))}),self.addEventListener("activate",function(e){var a=new Set(urlsToCacheKeys.values());e.waitUntil(caches.open(cacheName).then(function(e){return e.keys().then(function(t){return Promise.all(t.map(function(t){if(!a.has(t.url))return e.delete(t)}))})}).then(function(){return self.clients.claim()}))}),self.addEventListener("fetch",function(e){if("GET"===e.request.method){var a,t=stripIgnoredUrlParameters(e.request.url,ignoreUrlParametersMatching),c="index.html";(a=urlsToCacheKeys.has(t))||(t=addDirectoryIndex(t,c),a=urlsToCacheKeys.has(t));var i="/reading/index.html";!a&&"navigate"===e.request.mode&&isPathWhitelisted(["^(?!\\/__).*"],e.request.url)&&(t=new URL(i,self.location).toString(),a=urlsToCacheKeys.has(t)),a&&e.respondWith(caches.open(cacheName).then(function(e){return e.match(urlsToCacheKeys.get(t)).then(function(e){if(e)return e;throw Error("The cached response that was expected is missing.")})}).catch(function(a){return console.warn('Couldn\'t serve response for "%s" from cache: %O',e.request.url,a),fetch(e.request)}))}});