!function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.g)define([],t);else{var i;i="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,i.gobo=t()}}(function(){return function t(i,h,s){function e(a,r){if(!h[a]){if(!i[a]){var n="function"==typeof require&&require;if(!r&&n)return n(a,!0);if(o)return o(a,!0);var f=new Error("Cannot find module '"+a+"'");throw f.code="MODULE_NOT_FOUND",f}var c=h[a]={exports:{}};i[a][0].call(c.exports,function(t){var h=i[a][1][t];return e(h||t)},c,c.exports,t,i,h,s)}return h[a].exports}for(var o="function"==typeof require&&require,a=0;a<s.length;a++)e(s[a]);return e}({1:[function(t,i,h){"use strict";h.h=!0;var s=t("./wood.js"),e=t("./cheapSeed"),o={9:[[5,5]],13:[[4,4],[10,4],[4,10],[10,10]],19:[[4,4],[10,4],[16,4],[4,10],[10,10],[16,10],[4,16],[10,16],[16,16]]},a=5,r=/[.,:;|`'!]/g,n=[[.1,.09,.08,.07,.06,.06,.06,.06,.06,.06,.06],[.1,.12,.11,.1,.09,.09,.09,.09],[.12,.14,.13,.12,.12,.12]],f=function(){function t(t){this.i=Math.max(window.devicePixelRatio,1),this.width=t.widthPx*this.i,this.height=(t.heightPx||t.widthPx)*this.i,t.widthPx||(console.error("Invalid gobo widthPx: "+t.widthPx),this.width=this.height=100),this.isSketch=!!t.isSketch,this.j=!t.noCoords,this.k=(t.marginPx||a)*this.i,this.backgroundCanvas=t.backgroundCanvas,this.background=t.background,this.l=t.l||Math.random()}return t.prototype.m=function(t){return this.o=t,this.p(),this.isSketch||(e.q(this.l),this.s()),e.q(this.l),this.t(),this.u(),this.canvas},t.prototype.render=function(){this.v(),this.A(),this.B(),this.j&&this.C(),this.D()},t.prototype.F=function(){return this.canvas},t.prototype.t=function(){this.canvas=this.G(this.width,this.height),this.H.textAlign="center",this.H.textBaseline="middle"},t.prototype.G=function(t,i){var h=document.createElement("canvas");return h.width=t,h.height=i,this.H=h.getContext("2d"),h},t.prototype.p=function(){var t=Math.min(this.width,this.height);this.gobanSize=this.o.gobanSize,this.j?(this.I=(t-2*this.k)/(this.gobanSize+2),this.I>10*this.i?(this.J=10*this.i,this.I=(t-2*this.k-2*this.J)/this.gobanSize):this.J=this.I,this.K=this.k+this.J):(this.I=(t-2*this.k)/this.gobanSize,this.K=this.k),this.L=this.I/2,this.M=.55*this.I,this.fontSize=.8*this.I,this.N=Math.round(this.K+this.I/2+(this.width-t)/2),this.O=Math.round(this.K+this.I/2+(this.height-t)/2),this.P=this.O+(this.gobanSize-1)*this.I,this.R=this.N+(this.gobanSize-1)*this.I},t.prototype.pixelToGridCoordinates=function(t,i){return[Math.round((t-this.N)/this.I),Math.round((this.P-i)/this.I)]},t.prototype.u=function(){if(!this.backgroundCanvas)if(this.background){if("#"===this.background[0]||"rgb"===this.background.substr(0,3).toLowerCase())this.backgroundColor=this.background;else if("wood"===this.background){if(this.isSketch||this.backgroundCanvas)return;var t=this.backgroundCanvas=document.createElement("canvas");t.width=t.height=200*this.i,s.S(t)}}else this.backgroundColor="#c75"},t.prototype.s=function(){var t=this.I,i=t/2;this.T=this.G(t,t),this.U(i,i),this.V=[];for(var h=10;h>=0;h--)this.V.push(this.G(t,t)),this.W(i,i,this.L);this.X=[];for(var h=17;h>=0;h--)this.X.push(this.G(t,t)),this.Y(i,i,this.L);this.Z=[];for(var s=0;s<this.gobanSize;s++)for(var o=this.Z[s]=[],h=0;h<this.gobanSize;h++)o.push(~~(11*e.$()));this._=[];for(var s=0;s<this.gobanSize;s++)for(var o=this._[s]=[],h=0;h<this.gobanSize;h++){var a=h%3+s%3*3,r=h%6<3==s%6<3?0:1,n=a+9*r;o.push(n)}this.aa=this.G(t,t),this.Y(i,i,this.L/2),this.ba=this.G(t,t),this.W(i,i,this.L/2)},t.prototype.ca=function(){this.backgroundCanvas?this.H.fillStyle=this.H.createPattern(this.backgroundCanvas,"repeat"):this.H.fillStyle=this.backgroundColor},t.prototype.v=function(){this.ca(),this.H.fillRect(0,0,this.width,this.height)},t.prototype.A=function(){this.H.strokeStyle="#000",this.H.lineWidth=1,this.H.beginPath();for(var t=0;t<this.gobanSize;t++){var i=this.N+t*this.I;this.H.moveTo(i,this.O),this.H.lineTo(i,this.P);var h=this.O+t*this.I;this.H.moveTo(this.N,h),this.H.lineTo(this.R,h)}this.H.stroke()},t.prototype.B=function(){this.H.fillStyle="#000";var t=o[this.gobanSize];if(t)for(var i=0;i<t.length;i++){var h=t[i],s=(h[0]-1)*this.I+this.N,e=(h[1]-1)*this.I+this.O;this.H.beginPath(),this.H.arc(s,e,this.I/9,0,2*Math.PI),this.H.fill()}},t.prototype.C=function(){this.H.fillStyle="#000",this.H.font=this.J+"px Arial";for(var t="ABCDEFGHJKLMNOPQRSTUVWXYZ",i=this.L+this.K/2,h=this.N,s=this.O-i,e=this.P+i,o=0;o<this.gobanSize;o++)this.H.fillText(t[o],h,s),this.H.fillText(t[o],h,e),h+=this.I;for(var a=this.N-i,r=this.R+i,n=this.O,o=0;o<this.gobanSize;o++){var f=(this.gobanSize-o).toString();this.H.fillText(f,a,n),this.H.fillText(f,r,n),n+=this.I}},t.prototype.D=function(){for(var t=this.isSketch?1:2,i=0;i<t;i++)for(var h=0;h<this.gobanSize;h++)for(var s=0;s<this.gobanSize;s++)this.da(s,h,i)},t.prototype.da=function(t,i,h){var s=t*this.I+this.N,e=this.P-i*this.I,o=this.o.ea(t,i);-1!==o.fa&&(0!==h||this.isSketch?this.ha(s,e,o.fa,t,i):this.ga(s,e)),(-1===o.fa||1===h||this.isSketch)&&(o.mark&&this.ia(s,e,o),o.label&&this.ja(s,e,o,o.label))},t.prototype.ga=function(t,i){var h=.25*this.L,s=this.L-h;this.H.drawImage(this.T,t-s,i-s)},t.prototype.ha=function(t,i,h,s,e){if(this.isSketch)return this.ka(t,i,h,this.L);var o;o=0===h?this.V[this.Z[e][s]]:this.X[this._[e][s]],this.H.drawImage(o,t-this.L,i-this.L)},t.prototype.ka=function(t,i,h,s){this.H.fillStyle=0===h?"rgb(0,0,0)":"rgb(255,255,255)",this.H.beginPath(),this.H.arc(t,i,.93*s,0,2*Math.PI),this.H.fill()},t.prototype.la=function(t,i,h,s){if(this.isSketch||-1!==s){var e=.4*this.L;return this.ka(t,i,h,e)}var e=this.L,o=0===h?this.ba:this.aa;this.H.drawImage(o,t-e,i-e,2*e,2*e)},t.prototype.U=function(t,i){var h=.1*this.L,s=.95*this.L,e=this.H.createRadialGradient(t,i,s-1-h,t,i,s+h);e.addColorStop(0,"rgba(32,32,32,0.5)"),e.addColorStop(1,"rgba(62,62,62,0)"),this.H.fillStyle=e,this.H.beginPath(),this.H.arc(t,i,s+h,0,2*Math.PI,!0),this.H.fill()},t.prototype.ma=function(t,i,h,s,e,o,a){var r=h/5,n=this.H.createRadialGradient(t-2*r,i-2*r,o*h,t-r,i-r,a*h);n.addColorStop(0,s),n.addColorStop(1,e),this.H.beginPath(),this.H.fillStyle=n,this.H.arc(t,i,.95*h,0,2*Math.PI,!0),this.H.fill()},t.prototype.W=function(t,i,h){var s=.8-.2*e.$(),o=40*e.$()+76,a="rgb("+~~(10*e.$()+o)+","+~~(10*e.$()+o)+","+~~(10*e.$()+o)+")";this.ma(t,i,h,a,"#000",.01,s)},t.prototype.Y=function(t,i,h){this.ma(t,i,h,"#fff","#aaa",.33,1);var s=n[~~(3*e.$())],o=2*e.$()*Math.PI,a=1+1.5*e.$(),r=.2+.3*e.$();this.na(t,i,h,o,s,r,a)},t.prototype.na=function(t,i,h,s,o,a,r){for(var n=s,f=s,c=0;c<o.length;c++){n+=o[c],f-=o[c];var u=.15*e.$()+0;this.oa(t,i,h,n,f,a,r,u)}},t.prototype.oa=function(t,i,h,s,e,o,a,r){var n=this.H;r=~~(100*r)/100,n.strokeStyle="rgba(128,128,128,"+r+")",n.lineWidth=h/30*a,n.beginPath(),h-=Math.max(1,n.lineWidth);var f,c,u,l,p=t+h*Math.cos(s*Math.PI),d=i+h*Math.sin(s*Math.PI),v=t+h*Math.cos(e*Math.PI),g=i+h*Math.sin(e*Math.PI);v>p?(f=(g-d)/(v-p),c=Math.atan(f)):v===p?c=Math.PI/2:(f=(g-d)/(v-p),c=Math.atan(f)-Math.PI);var y=o*h;u=Math.sin(c)*y,l=Math.cos(c)*y;var b=p+u,S=d-l,k=v+u,H=g-l;n.moveTo(p,d),n.bezierCurveTo(b,S,k,H,v,g),n.stroke()},t.prototype.pa=function(t,i,h){switch(h.fa){case-1:if("+"!==h.mark[0]){this.ca();var s=.8*this.I;this.H.fillRect(t-s/2,i-s/2,s,s)}return"#000";case 0:return"#fff";case 1:return"#000"}},t.prototype.ia=function(t,i,h){var s=this.H,e=h.mark.split(":"),o=e[0],a=e.length>1?e[1].split(","):[],r=(parseInt(a[0])/10||1)*this.M,n=r/2,f=.5*(parseInt(a[1])||5);switch(o){case"[]":s.strokeStyle=this.pa(t,i,h),s.lineWidth=f,s.strokeRect(t-n,i-n,r,r);break;case"O":s.strokeStyle=this.pa(t,i,h),s.lineWidth=f,s.beginPath(),s.arc(t,i,n,0,2*Math.PI),s.stroke();break;case"*":s.fillStyle=this.pa(t,i,h),s.font=1.5*this.fontSize+"px Arial",s.fillText("*",t,i+.35*this.fontSize);break;case"+":s.strokeStyle=this.pa(t,i,h),s.lineWidth=f,s.beginPath(),s.moveTo(t-n,i),s.lineTo(t+n,i),s.moveTo(t,i-n),s.lineTo(t,i+n),s.stroke();break;case"+?":s.fillStyle="#888",s.fillRect(t-n,i-n,r,r);break;case"+Bo":case"+Wo":this.la(t,i,"B"===o[1]?0:1,h.fa);break;default:console.error("Unknown mark type: "+h.mark)}},t.prototype.ja=function(t,i,h,s){this.H.fillStyle=this.pa(t,i,h),h.style&&(this.H.fillStyle=h.style);var e=s.replace(r,"").length,o=s.length-e,a=e+.5*o,n=1.2-.2*a,f=Math.max(this.fontSize*n,12*this.i);this.H.font=f+"px Arial",this.H.fillText(s,t,i)},t}();h.qa=f},{"./cheapSeed":5,"./wood.js":6}],2:[function(t,i,h){"use strict";h.h=!0;var s=t("./LogicalBoard"),e=t("./BoardRenderer"),o=function(){function t(t){this.ra=new s.sa(t.gobanSize||19),this.ta=new e.qa(t),this.canvas=this.ta.m(this.ra)}return t.prototype.render=function(){this.ta.render()},t.prototype.setStoneAt=function(t,i,h){this.ra.setStoneAt(t,i,h)},t.prototype.clearVertexAt=function(t,i){this.ra.clearVertexAt(t,i)},t.prototype.getStoneColorAt=function(t,i){return this.ra.ea(t,i).fa},t.prototype.setLabelAt=function(t,i,h,s){this.ra.setLabelAt(t,i,h,s)},t.prototype.setMarkAt=function(t,i,h){this.ra.setMarkAt(t,i,h)},t.prototype.pixelToGridCoordinates=function(t,i){return this.ta.pixelToGridCoordinates(t,i)},t}();h.Gobo=o},{"./BoardRenderer":1,"./LogicalBoard":3}],3:[function(t,i,h){"use strict";h.h=!0;var s=t("./Vertex"),e=function(){function t(t){this.gobanSize=t,this.ua=new Array(t);for(var i=0;i<t;i++){this.ua[i]=new Array(t);for(var h=0;h<t;h++)this.ua[i][h]=new s.va}}return t.prototype.ea=function(t,i){var h=this.ua[i][t];if(!h)throw new Error("Invalid coordinates: "+t+","+i);return h},t.prototype.clearVertexAt=function(t,i){this.ea(t,i).clear()},t.prototype.setStoneAt=function(t,i,h){this.ea(t,i).wa(h)},t.prototype.setLabelAt=function(t,i,h,s){var e=this.ea(t,i);e.xa(h),s&&e.ya(s)},t.prototype.setMarkAt=function(t,i,h){this.ea(t,i).za(h)},t}();h.sa=e},{"./Vertex":4}],4:[function(t,i,h){"use strict";h.h=!0;var s=function(){function t(){this.clear()}return t.prototype.clear=function(){this.fa=-1,this.label="",this.mark=""},t.prototype.wa=function(t){this.fa=t},t.prototype.xa=function(t){this.label=t},t.prototype.za=function(t){this.mark=t},t.prototype.ya=function(t){this.style=t},t}();h.va=s},{}],5:[function(t,i,h){"use strict";var s;h.q=function(t){if(!(t>=0&&t<=1))throw new Error("Seed must be between 0 and 1");s=t},h.$=function(){var t=43046721*s+.236067977;return s=t-Math.floor(t)},h.Aa=function(t,i){return h.$()*(i-t)+t}},{}],6:[function(t,i,h){function s(){var t=[];t[d]=1;var i=t[v]=p(H[0],H[1]);return t[g]=p(i*w[0],i*w[1]),t}function e(t){for(var i=[0,0,0],h=p(I[0],I[1]),s=0;s<3;s++)i[s]=t[s]*h;return i}function o(t,i){for(var h=~~(t/f),s=t,e=[],o=h;o>=2;o--){var a=(l()+.5)*(s/o);e.push(a),s-=a,i.push(0)}return e.push(s),e}function a(t,i,h,s,e,o){for(var a=s,r=i.length,n=Math.max((o-e)/k+1,0),u=0;u<r-1;u++){var p=(u+.5)*f,d=s-a+i[u]/2,v=Math.max((d-s)/S+1,0),g=Math.min(Math.abs(d-p)/c,1),H=h[u];H=H*(1-g)+(l()-.5)*b,h[u]=H=Math.max(Math.min(H,y),-y);var w=i[u]+H;w=a/(r-u)*v+w*(1-v);var I=t[u]*n+w*(1-n);i[u]=I,a-=I}i[r-1]=a}function r(t){for(var i=s(),h=e(i),o=p(M[0],M[1]),a=[0,0,0],r=[],n=t-1;n>=0;n--){for(var f=n%2?1-l()*o:0+l()*o,c=0;c<3;c++)a[c]=f*i[c]+(1-f)*h[c];for(var u="#",c=0;c<3;c++)u+=("0"+Math.round(255*a[c]).toString(16)).slice(-2);r[n]=u}return r}function n(t){f=p(1.2,2.4),c=p(1,2.5)*f;for(var i=[],h=o(t.width,i),s=h.length,e=r(s),n=h.concat(),u=t.getContext("2d"),l=0;l<t.height;l++){for(var d=0,v=0;v<s;v++){u.fillStyle=e[v];var g=n[v];u.fillRect(d,l,g+1,1),d+=g}a(h,n,i,t.width,t.height,l)}}var f,c,u=t("./cheapSeed"),l=u.$,p=u.Aa,d=0,v=1,g=2,y=.12,b=y/8,S=30,k=100,H=[.4,.85],w=[.6,.9],I=[.75,.9],M=[.2,.5];h.S=function(t){n(t)}},{"./cheapSeed":5}]},{},[2])(2)});