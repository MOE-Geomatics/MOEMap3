/*
arcgislink.js (http://google-maps-utility-library-v3.googlecode.com/svn/trunk/arcgislink/)

arcgislink.js is modified to decrease the number of digitals after the decimal point. Now the 
latitude and longitude only have six digitals after the decimal point. The length of URL is decreased 
to make sure when buffer circle is combined with other conditions, the application is still working. 

Aug 23, 2013: arcgislink.js is modified to get ride the dependency on google maps by adding a global variable
dependOnGoogleMaps. If this is true, Google Maps will be initialized. Otherwise, this is purely used to generate report. 
*/
var dependOnGoogleMaps = false;
(function(){var gmaps=gmaps||{};var RAD_DEG=Math.PI/180;var jsonpID_=0;window.ags_jsonp=window.ags_jsonp||{};var G={OverlayView:function(){},event:{trigger:function(){}}};if(dependOnGoogleMaps){G=google.maps}var WGS84,NAD83,WEB_MERCATOR,WEB_MERCATOR_AUX;var Config={proxyUrl:null,alwaysUseProxy:false};var spatialReferences_={};var Util={};function extractString_(full,start,end){var i=(start==="")?0:full.indexOf(start);var e=end===""?full.length:full.indexOf(end,i+start.length);return full.substring(i+start.length,e)}function isString_(o){return o&&typeof o==="string"}function isArray_(o){return o&&o.splice}function isNumber_(o){return typeof o==="number"}function augmentObject_(src,dest,force){if(src&&dest){var p;for(p in src){if(force||!(p in dest)){dest[p]=src[p]}}}return dest}function triggerEvent_(src,evtName,args){G.event.trigger.apply(this,arguments)}function handleErr_(errback,json){if(errback&&json&&json.error){errback(json.error)}}function formatTimeString_(time,endTime){var ret="";if(time){ret+=(time.getTime()-time.getTimezoneOffset()*60000)}if(endTime){ret+=", "+(endTime.getTime()-endTime.getTimezoneOffset()*60000)}return ret}function setNodeOpacity_(node,op){op=Math.min(Math.max(op,0),1);if(node){var st=node.style;if(typeof st.opacity!=="undefined"){st.opacity=op}if(typeof st.filters!=="undefined"){st.filters.alpha.opacity=Math.floor(100*op)}if(typeof st.filter!=="undefined"){st.filter="alpha(opacity:"+Math.floor(op*100)+")"}}}function getLayerDefsString_(defs){var strDefs="";for(var x in defs){if(defs.hasOwnProperty(x)){if(strDefs.length>0){strDefs+=";"}strDefs+=(x+":"+defs[x])}}return strDefs}function getXmlHttp_(){if(typeof XMLHttpRequest==="undefined"){try{return new ActiveXObject("Msxml2.XMLHTTP.6.0")}catch(e){}try{return new ActiveXObject("Msxml2.XMLHTTP.3.0")}catch(e1){}try{return new ActiveXObject("Msxml2.XMLHTTP")}catch(e2){}throw new Error("This browser does not support XMLHttpRequest.")}else{return new XMLHttpRequest()}}var GeometryType={POINT:"esriGeometryPoint",MULTIPOINT:"esriGeometryMultipoint",POLYLINE:"esriGeometryPolyline",POLYGON:"esriGeometryPolygon",ENVELOPE:"esriGeometryEnvelope"};function getGeometryType_(obj){var o=obj;if(isArray_(obj)&&obj.length>0){o=obj[0]}if(o instanceof G.LatLng||o instanceof G.Marker){if(isArray_(obj)&&obj.length>1){return GeometryType.MULTIPOINT}else{return GeometryType.POINT}}else{if(o instanceof G.Polyline){return GeometryType.POLYLINE}else{if(o instanceof G.Polygon){return GeometryType.POLYGON}else{if(o instanceof G.LatLngBounds){return GeometryType.ENVELOPE}else{if(o.x!==undefined&&o.y!==undefined){return GeometryType.POINT}else{if(o.points){return GeometryType.MULTIPOINT}else{if(o.paths){return GeometryType.POLYLINE}else{if(o.rings){return GeometryType.POLYGON}}}}}}}}return null}function isOverlay_(obj){var o=obj;if(isArray_(obj)&&obj.length>0){o=obj[0]}if(isArray_(o)&&o.length>0){o=o[0]}if(o instanceof G.LatLng||o instanceof G.Marker||o instanceof G.Polyline||o instanceof G.Polygon||o instanceof G.LatLngBounds){return true}return false}function formatSRParam_(sr){if(!sr){return null}return isNumber_(sr)?sr:sr.wkid?sr.wkid:sr.toJSON()}function fromLatLngsToJSON_(pts,close){var arr=[];var latlng;for(var i=0,c=pts.getLength();i<c;i++){latlng=pts.getAt(i);arr.push("["+latlng.lng().toFixed(6)+","+latlng.lat().toFixed(6)+"]")}if(close&&arr.length>0){arr.push("["+pts.getAt(0).lng().toFixed(6)+","+pts.getAt(0).lat().toFixed(6)+"]")}return arr.join(",")}function fromOverlaysToJSON_(geom){var gtype=getGeometryType_(geom);var g,gs,i,pts;var json="{";switch(gtype){case GeometryType.POINT:g=isArray_(geom)?geom[0]:geom;if(g instanceof G.Marker){g=g.getPosition()}json+="x:"+g.lng()+",y:"+g.lat();break;case GeometryType.MULTIPOINT:pts=[];for(i=0;i<geom.length;i++){if(geom[i] instanceof G.Marker){g=geom[i].getPosition()}else{g=geom[i]}pts.push("["+g.lng()+","+g.lat()+"]")}json+="points: ["+pts.join(",")+"]";break;case GeometryType.POLYLINE:pts=[];gs=isArray_(geom)?geom:[geom];for(i=0;i<gs.length;i++){pts.push("["+fromLatLngsToJSON_(gs[i].getPath())+"]")}json+="paths:["+pts.join(",")+"]";break;case GeometryType.POLYGON:pts=[];g=isArray_(geom)?geom[0]:geom;var paths=g.getPaths();for(i=0;i<paths.getLength();i++){pts.push("["+fromLatLngsToJSON_(paths.getAt(i),true)+"]")}json+="rings:["+pts.join(",")+"]";break;case GeometryType.ENVELOPE:g=isArray_(geom)?geom[0]:geom;json+="xmin:"+g.getSouthWest().lng()+",ymin:"+g.getSouthWest().lat()+",xmax:"+g.getNorthEast().lng()+",ymax:"+g.getNorthEast().lat();break}json+=", spatialReference:{wkid:4326}";json+="}";return json}function fromGeometryToJSON_(geom){function fromPointsToJSON(pts){var arr=[];for(var i=0,c=pts.length;i<c;i++){arr.push("["+pts[i][0]+","+pts[i][1]+"]")}return"["+arr.join(",")+"]"}function fromLinesToJSON(lines){var arr=[];for(var i=0,c=lines.length;i<c;i++){arr.push(fromPointsToJSON(lines[i]))}return"["+arr.join(",")+"]"}var json="{";if(geom.x){json+="x:"+geom.x+",y:"+geom.y}else{if(geom.xmin){json+="xmin:"+geom.xmin+",ymin:"+geom.ymin+",xmax:"+geom.xmax+",ymax:"+geom.ymax}else{if(geom.points){json+="points:"+fromPointsToJSON(geom.points)}else{if(geom.paths){json+="paths:"+fromLinesToJSON(geom.paths)}else{if(geom.rings){json+="rings:"+fromLinesToJSON(geom.rings)}}}}}json+="}";return json}function fromEnvelopeToLatLngBounds_(extent){var sr=spatialReferences_[extent.spatialReference.wkid||extent.spatialReference.wkt];sr=sr||WGS84;var sw=sr.inverse([extent.xmin,extent.ymin]);var ne=sr.inverse([extent.xmax,extent.ymax]);return new G.LatLngBounds(new G.LatLng(sw[1],sw[0]),new G.LatLng(ne[1],ne[0]))}function fromJSONToOverlays_(geom,opts){var ovs=null;var ov;var i,ic,j,jc,parts,part,lnglat,latlngs;opts=opts||{};if(geom){ovs=[];if(geom.x){ov=new G.Marker(augmentObject_(opts.markerOptions||opts,{position:new G.LatLng(geom.y,geom.x)}));ovs.push(ov)}else{parts=geom.points||geom.paths||geom.rings;if(!parts){return ovs}var rings=[];for(i=0,ic=parts.length;i<ic;i++){part=parts[i];if(geom.points){ov=new G.Marker(augmentObject_(opts.markerOptions||opts,{position:new G.LatLng(part[1],part[0])}));ovs.push(ov)}else{latlngs=[];for(j=0,jc=part.length;j<jc;j++){lnglat=part[j];latlngs.push(new G.LatLng(lnglat[1],lnglat[0]))}if(geom.paths){ov=new G.Polyline(augmentObject_(opts.polylineOptions||opts,{path:latlngs}));ovs.push(ov)}else{if(geom.rings){rings.push(latlngs)}}}}if(geom.rings){ov=new G.Polygon(augmentObject_(opts.polygonOptions||opts,{paths:rings}));ovs.push(ov)}}}return ovs}function parseFeatures_(features,ovOpts){if(features){var i,I,f;for(i=0,I=features.length;i<I;i++){f=features[i];if(f.geometry){f.geometry=fromJSONToOverlays_(f.geometry,ovOpts)}}}}function formatRequestString_(o){var ret;if(typeof o==="object"){if(isArray_(o)){ret=[];for(var i=0,I=o.length;i<I;i++){ret.push(formatRequestString_(o[i]))}return"["+ret.join(",")+"]"}else{if(isOverlay_(o)){return fromOverlaysToJSON_(o)}else{if(o.toJSON){return o.toJSON()}else{ret="";for(var x in o){if(o.hasOwnProperty(x)){if(ret.length>0){ret+=", "}ret+=x+":"+formatRequestString_(o[x])}}return"{"+ret+"}"}}}}return o.toString()}function fromLatLngsToFeatureSet_(latlngs){var i,I,latlng;var features=[];for(i=0,I=latlngs.length;i<I;i++){latlng=latlngs[i];if(latlng instanceof G.Marker){latlng=latlng.getPosition()}features.push({geometry:{x:latlng.lng(),y:latlng.lat(),spatialReference:{wkid:4326}}})}return{type:'"features"',features:features,doNotLocateOnRestrictedElements:false}}function prepareGeometryParams_(p){var params={};if(!p){return null}var json=[];var g,isOv;if(p.geometries&&p.geometries.length>0){g=p.geometries[0];isOv=isOverlay_(g);for(var i=0,c=p.geometries.length;i<c;i++){if(isOv){json.push(fromOverlaysToJSON_(p.geometries[i]))}else{json.push(fromGeometryToJSON_(p.geometries[i]))}}}if(!p.geometryType){p.geometryType=getGeometryType_(g)}if(isOv){params.inSR=WGS84.wkid}else{if(p.inSpatialReference){params.inSR=formatSRParam_(p.inSpatialReference)}}if(p.outSpatialReference){params.outSR=formatSRParam_(p.outSpatialReference)}params.geometries='{geometryType:"'+p.geometryType+'", geometries:['+json.join(",")+"]}";return params}function log_(msg){if(window.console){window.console.log(msg)}else{var l=document.getElementById("_ags_log");if(l){l.innerHTML=l.innerHTML+msg+"<br/>"}}}function formatParams_(params){var query="";if(params){params.f=params.f||"json";for(var x in params){if(params.hasOwnProperty(x)&&params[x]!==null&&params[x]!==undefined){var val=formatRequestString_(params[x]);query+=(query.length>0?"&":"")+(x+"="+(escape?escape(val):encodeURIComponent(val)))}}}return query}function callback_(fn,obj){var args=[];for(var i=2,c=arguments.length;i<c;i++){args.push(arguments[i])}return function(){fn.apply(obj,args)}}function addCopyrightInfo_(cpArray,mapService,map){if(mapService.hasLoaded()){cpArray.push(mapService.copyrightText)}else{G.event.addListenerOnce(mapService,"load",function(){setCopyrightInfo_(map)})}}function setCopyrightInfo_(map){var div=null;if(map){var mvc=map.controls[G.ControlPosition.BOTTOM_RIGHT];if(mvc){for(var i=0,c=mvc.getLength();i<c;i++){if(mvc.getAt(i).id==="agsCopyrights"){div=mvc.getAt(i);break}}}if(!div){div=document.createElement("div");div.style.fontFamily="Arial,sans-serif";div.style.fontSize="10px";div.style.textAlign="right";div.id="agsCopyrights";map.controls[G.ControlPosition.BOTTOM_RIGHT].push(div);G.event.addListener(map,"maptypeid_changed",function(){setCopyrightInfo_(map)})}var ovs=map.agsOverlays;var cp=[];var svc,type;if(ovs){for(var i=0,c=ovs.getLength();i<c;i++){addCopyrightInfo_(cp,ovs.getAt(i).mapService_,map)}}var ovTypes=map.overlayMapTypes;if(ovTypes){for(var i=0,c=ovTypes.getLength();i<c;i++){type=ovTypes.getAt(i);if(type instanceof MapType){for(var j=0,cj=type.tileLayers_.length;j<cj;j++){addCopyrightInfo_(cp,type.tileLayers_[j].mapService_,map)}}}}type=map.mapTypes.get(map.getMapTypeId());if(type instanceof MapType){for(var i=0,c=type.tileLayers_.length;i<c;i++){addCopyrightInfo_(cp,type.tileLayers_[i].mapService_,map)}if(type.negative){div.style.color="#ffffff"}else{div.style.color="#000000"}}div.innerHTML=cp.join("<br/>")}}function getJSON_(url,params,callbackName,callbackFn){var sid="ags_jsonp_"+(jsonpID_++)+"_"+Math.floor(Math.random()*1000000);var script=null;params=params||{};params[callbackName||"callback"]="ags_jsonp."+sid;var query=formatParams_(params);var head=document.getElementsByTagName("head")[0];if(!head){throw new Error("document must have header tag")}var jsonpcallback=function(){if(window.ags_jsonp[sid]){delete window.ags_jsonp[sid]}if(script){head.removeChild(script)}script=null;callbackFn.apply(null,arguments);triggerEvent_(Util,"jsonpend",sid)};window.ags_jsonp[sid]=jsonpcallback;if((query+url).length<2000&&!Config.alwaysUseProxy){script=document.createElement("script");script.src=url+(url.indexOf("?")===-1?"?":"&")+query;script.id=sid;head.appendChild(script)}else{var loc=window.location;var dom=loc.protocol+"//"+loc.hostname+(!loc.port||loc.port===80?"":":"+loc.port+"/");var useProxy=true;if(url.toLowerCase().indexOf(dom.toLowerCase())!==-1){useProxy=false}if(Config.alwaysUseProxy){useProxy=true}if(useProxy&&!Config.proxyUrl){throw new Error("No proxyUrl property in Config is defined")}var xmlhttp=getXmlHttp_();xmlhttp.onreadystatechange=function(){if(xmlhttp.readyState===4){if(xmlhttp.status===200){eval(xmlhttp.responseText)}else{throw new Error("Error code "+xmlhttp.status)}}};xmlhttp.open("POST",useProxy?Config.proxyUrl+"?"+url:url,true);xmlhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded");xmlhttp.send(query)}triggerEvent_(Util,"jsonpstart",sid);return sid}Util.getJSON=function(url,params,callbackName,callbackFn){getJSON_(url,params,callbackName,callbackFn)};Util.addToMap=function(map,overlays){if(isArray_(overlays)){var ov;for(var i=0,I=overlays.length;i<I;i++){ov=overlays[i];if(isArray_(ov)){Util.addToMap(map,ov)}else{if(isOverlay_(ov)){ov.setMap(map)}}}}};Util.removeFromMap=function(overlays,clearArray){Util.addToMap(null,overlays);if(clearArray){overlays.length=0}};function SpatialReference(params){params=params||{};this.wkid=params.wkid;this.wkt=params.wkt}SpatialReference.prototype.forward=function(lnglat){return lnglat};SpatialReference.prototype.inverse=function(coords){return coords};SpatialReference.prototype.getCircum=function(){return 360};SpatialReference.prototype.toJSON=function(){return"{"+(this.wkid?" wkid:"+this.wkid:"wkt: '"+this.wkt+"'")+"}"};function Geographic(params){params=params||{};SpatialReference.call(this,params)}Geographic.prototype=new SpatialReference();function LambertConformalConic(params){params=params||{};SpatialReference.call(this,params);var f_i=params.inverse_flattening;var phi1=params.standard_parallel_1*RAD_DEG;var phi2=params.standard_parallel_2*RAD_DEG;var phi0=params.latitude_of_origin*RAD_DEG;this.a_=params.semi_major/params.unit;this.lamda0_=params.central_meridian*RAD_DEG;this.FE_=params.false_easting;this.FN_=params.false_northing;var f=1/f_i;var es=2*f-f*f;this.e_=Math.sqrt(es);var m1=this.calc_m_(phi1,es);var m2=this.calc_m_(phi2,es);var tF=this.calc_t_(phi0,this.e_);var t1=this.calc_t_(phi1,this.e_);var t2=this.calc_t_(phi2,this.e_);this.n_=Math.log(m1/m2)/Math.log(t1/t2);this.F_=m1/(this.n_*Math.pow(t1,this.n_));this.rho0_=this.calc_rho_(this.a_,this.F_,tF,this.n_)}LambertConformalConic.prototype=new SpatialReference();LambertConformalConic.prototype.calc_m_=function(phi,es){var sinphi=Math.sin(phi);return Math.cos(phi)/Math.sqrt(1-es*sinphi*sinphi)};LambertConformalConic.prototype.calc_t_=function(phi,e){var esp=e*Math.sin(phi);return Math.tan(Math.PI/4-phi/2)/Math.pow((1-esp)/(1+esp),e/2)};LambertConformalConic.prototype.calc_rho_=function(a,F,t,n){return a*F*Math.pow(t,n)};LambertConformalConic.prototype.calc_phi_=function(t,e,phi){var esp=e*Math.sin(phi);return Math.PI/2-2*Math.atan(t*Math.pow((1-esp)/(1+esp),e/2))};LambertConformalConic.prototype.solve_phi_=function(t_i,e,init){var i=0;var phi=init;var newphi=this.calc_phi_(t_i,e,phi);while(Math.abs(newphi-phi)>1e-9&&i<10){i++;phi=newphi;newphi=this.calc_phi_(t_i,e,phi)}return newphi};LambertConformalConic.prototype.forward=function(lnglat){var phi=lnglat[1]*RAD_DEG;var lamda=lnglat[0]*RAD_DEG;var t=this.calc_t_(phi,this.e_);var rho=this.calc_rho_(this.a_,this.F_,t,this.n_);var theta=this.n_*(lamda-this.lamda0_);var E=this.FE_+rho*Math.sin(theta);var N=this.FN_+this.rho0_-rho*Math.cos(theta);return[E,N]};LambertConformalConic.prototype.inverse=function(coords){var E=coords[0]-this.FE_;var N=coords[1]-this.FN_;var theta=Math.atan(E/(this.rho0_-N));var rho=(this.n_>0?1:-1)*Math.sqrt(E*E+(this.rho0_-N)*(this.rho0_-N));var t=Math.pow((rho/(this.a_*this.F_)),1/this.n_);var init=Math.PI/2-2*Math.atan(t);var phi=this.solve_phi_(t,this.e_,init);var lamda=theta/this.n_+this.lamda0_;return[lamda/RAD_DEG,phi/RAD_DEG]};LambertConformalConic.prototype.getCircum=function(){return Math.PI*2*this.a_};function TransverseMercator(params){params=params||{};SpatialReference.call(this,params);this.a_=params.semi_major/params.unit;var f_i=params.inverse_flattening;this.k0_=params.scale_factor;var phi0=params.latitude_of_origin*RAD_DEG;this.lamda0_=params.central_meridian*RAD_DEG;this.FE_=params.false_easting;this.FN_=params.false_northing;var f=1/f_i;this.es_=2*f-f*f;this.ep4_=this.es_*this.es_;this.ep6_=this.ep4_*this.es_;this.eas_=this.es_/(1-this.es_);this.M0_=this.calc_m_(phi0,this.a_,this.es_,this.ep4_,this.ep6_)}TransverseMercator.prototype=new SpatialReference();TransverseMercator.prototype.calc_m_=function(phi,a,es,ep4,ep6){return a*((1-es/4-3*ep4/64-5*ep6/256)*phi-(3*es/8+3*ep4/32+45*ep6/1024)*Math.sin(2*phi)+(15*ep4/256+45*ep6/1024)*Math.sin(4*phi)-(35*ep6/3072)*Math.sin(6*phi))};TransverseMercator.prototype.forward=function(lnglat){var phi=lnglat[1]*RAD_DEG;var lamda=lnglat[0]*RAD_DEG;var nu=this.a_/Math.sqrt(1-this.es_*Math.pow(Math.sin(phi),2));var T=Math.pow(Math.tan(phi),2);var C=this.eas_*Math.pow(Math.cos(phi),2);var A=(lamda-this.lamda0_)*Math.cos(phi);var M=this.calc_m_(phi,this.a_,this.es_,this.ep4_,this.ep6_);var E=this.FE_+this.k0_*nu*(A+(1-T+C)*Math.pow(A,3)/6+(5-18*T+T*T+72*C-58*this.eas_)*Math.pow(A,5)/120);var N=this.FN_+this.k0_*(M-this.M0_)+nu*Math.tan(phi)*(A*A/2+(5-T+9*C+4*C*C)*Math.pow(A,4)/120+(61-58*T+T*T+600*C-330*this.eas_)*Math.pow(A,6)/720);return[E,N]};TransverseMercator.prototype.inverse=function(coords){var E=coords[0];var N=coords[1];var e1=(1-Math.sqrt(1-this.es_))/(1+Math.sqrt(1-this.es_));var M1=this.M0_+(N-this.FN_)/this.k0_;var mu1=M1/(this.a_*(1-this.es_/4-3*this.ep4_/64-5*this.ep6_/256));var phi1=mu1+(3*e1/2-27*Math.pow(e1,3)/32)*Math.sin(2*mu1)+(21*e1*e1/16-55*Math.pow(e1,4)/32)*Math.sin(4*mu1)+(151*Math.pow(e1,3)/6)*Math.sin(6*mu1)+(1097*Math.pow(e1,4)/512)*Math.sin(8*mu1);var C1=this.eas_*Math.pow(Math.cos(phi1),2);var T1=Math.pow(Math.tan(phi1),2);var N1=this.a_/Math.sqrt(1-this.es_*Math.pow(Math.sin(phi1),2));var R1=this.a_*(1-this.es_)/Math.pow((1-this.es_*Math.pow(Math.sin(phi1),2)),3/2);var D=(E-this.FE_)/(N1*this.k0_);var phi=phi1-(N1*Math.tan(phi1)/R1)*(D*D/2-(5+3*T1+10*C1-4*C1*C1-9*this.eas_)*Math.pow(D,4)/24+(61+90*T1+28*C1+45*T1*T1-252*this.eas_-3*C1*C1)*Math.pow(D,6)/720);var lamda=this.lamda0_+(D-(1+2*T1+C1)*Math.pow(D,3)/6+(5-2*C1+28*T1-3*C1*C1+8*this.eas_+24*T1*T1)*Math.pow(D,5)/120)/Math.cos(phi1);return[lamda/RAD_DEG,phi/RAD_DEG]};TransverseMercator.prototype.getCircum=function(){return Math.PI*2*this.a_};function SphereMercator(params){params=params||{};SpatialReference.call(this,params);this.a_=(params.semi_major||6378137)/(params.unit||1);this.lamda0_=(params.central_meridian||0)*RAD_DEG}SphereMercator.prototype=new SpatialReference();SphereMercator.prototype.forward=function(lnglat){var phi=lnglat[1]*RAD_DEG;var lamda=lnglat[0]*RAD_DEG;var E=this.a_*(lamda-this.lamda0_);var N=(this.a_/2)*Math.log((1+Math.sin(phi))/(1-Math.sin(phi)));return[E,N]};SphereMercator.prototype.inverse=function(coords){var E=coords[0];var N=coords[1];var phi=Math.PI/2-2*Math.atan(Math.exp(-N/this.a_));var lamda=E/this.a_+this.lamda0_;return[lamda/RAD_DEG,phi/RAD_DEG]};SphereMercator.prototype.getCircum=function(){return Math.PI*2*this.a_};function Albers(params){params=params||{};SpatialReference.call(this,params);var f_i=params.inverse_flattening;var phi1=params.standard_parallel_1*RAD_DEG;var phi2=params.standard_parallel_2*RAD_DEG;var phi0=params.latitude_of_origin*RAD_DEG;this.a_=params.semi_major/params.unit;this.lamda0_=params.central_meridian*RAD_DEG;this.FE_=params.false_easting;this.FN_=params.false_northing;var f=1/f_i;var es=2*f-f*f;this.e_=Math.sqrt(es);var m1=this.calc_m_(phi1,es);var m2=this.calc_m_(phi2,es);var q1=this.calc_q_(phi1,this.e_);var q2=this.calc_q_(phi2,this.e_);var q0=this.calc_q_(phi0,this.e_);this.n_=(m1*m1-m2*m2)/(q2-q1);this.C_=m1*m1+this.n_*q1;this.rho0_=this.calc_rho_(this.a_,this.C_,this.n_,q0)}Albers.prototype=new SpatialReference();Albers.prototype.calc_m_=function(phi,es){var sinphi=Math.sin(phi);return Math.cos(phi)/Math.sqrt(1-es*sinphi*sinphi)};Albers.prototype.calc_q_=function(phi,e){var esp=e*Math.sin(phi);return(1-e*e)*(Math.sin(phi)/(1-esp*esp)-(1/(2*e))*Math.log((1-esp)/(1+esp)))};Albers.prototype.calc_rho_=function(a,C,n,q){return a*Math.sqrt(C-n*q)/n};Albers.prototype.calc_phi_=function(q,e,phi){var esp=e*Math.sin(phi);return phi+(1-esp*esp)*(1-esp*esp)/(2*Math.cos(phi))*(q/(1-e*e)-Math.sin(phi)/(1-esp*esp)+Math.log((1-esp)/(1+esp))/(2*e))};Albers.prototype.solve_phi_=function(q,e,init){var i=0;var phi=init;var newphi=this.calc_phi_(q,e,phi);while(Math.abs(newphi-phi)>1e-8&&i<10){i++;phi=newphi;newphi=this.calc_phi_(q,e,phi)}return newphi};Albers.prototype.forward=function(lnglat){var phi=lnglat[1]*RAD_DEG;var lamda=lnglat[0]*RAD_DEG;var q=this.calc_q_(phi,this.e_);var rho=this.calc_rho_(this.a_,this.C_,this.n_,q);var theta=this.n_*(lamda-this.lamda0_);var E=this.FE_+rho*Math.sin(theta);var N=this.FN_+this.rho0_-rho*Math.cos(theta);return[E,N]};Albers.prototype.inverse=function(coords){var E=coords[0]-this.FE_;var N=coords[1]-this.FN_;var rho=Math.sqrt(E*E+(this.rho0_-N)*(this.rho0_-N));var adj=this.n_>0?1:-1;var theta=Math.atan(adj*E/(adj*this.rho0_-adj*N));var q=(this.C_-rho*rho*this.n_*this.n_/(this.a_*this.a_))/this.n_;var init=Math.asin(q/2);var phi=this.solve_phi_(q,this.e_,init);var lamda=theta/this.n_+this.lamda0_;return[lamda/RAD_DEG,phi/RAD_DEG]};Albers.prototype.getCircum=function(){return Math.PI*2*this.a_};Albers.prototype.getCircum=function(){return Math.PI*2*this.a_};WGS84=new Geographic({wkid:4326});NAD83=new Geographic({wkid:4269});WEB_MERCATOR=new SphereMercator({wkid:102113,semi_major:6378137,central_meridian:0,unit:1});WEB_MERCATOR_AUX=new SphereMercator({wkid:102100,semi_major:6378137,central_meridian:0,unit:1});spatialReferences_={"4326":WGS84,"4269":NAD83,"102113":WEB_MERCATOR,"102100":WEB_MERCATOR_AUX};SpatialReference.WGS84=WGS84;SpatialReference.NAD83=NAD83;SpatialReference.WEB_MERCATOR=WEB_MERCATOR;SpatialReference.WEB_MERCATOR_AUX=WEB_MERCATOR_AUX;Util.registerSR=function(wkidt,wktOrSR){var sr=spatialReferences_[""+wkidt];if(sr){return sr}if(wktOrSR instanceof SpatialReference){spatialReferences_[""+wkidt]=wktOrSR;sr=wktOrSR}else{var wkt=wktOrSR||wkidt;var params={wkt:wkidt};if(wkidt===parseInt(wkidt,10)){params={wkid:wkidt}}var prj=extractString_(wkt,'PROJECTION["','"]');var spheroid=extractString_(wkt,"SPHEROID[","]").split(",");if(prj!==""){params.unit=parseFloat(extractString_(extractString_(wkt,"PROJECTION",""),"UNIT[","]").split(",")[1]);params.semi_major=parseFloat(spheroid[1]);params.inverse_flattening=parseFloat(spheroid[2]);params.latitude_of_origin=parseFloat(extractString_(wkt,'"Latitude_Of_Origin",',"]"));params.central_meridian=parseFloat(extractString_(wkt,'"Central_Meridian",',"]"));params.false_easting=parseFloat(extractString_(wkt,'"False_Easting",',"]"));params.false_northing=parseFloat(extractString_(wkt,'"False_Northing",',"]"))}switch(prj){case"":sr=new SpatialReference(params);break;case"Lambert_Conformal_Conic":params.standard_parallel_1=parseFloat(extractString_(wkt,'"Standard_Parallel_1",',"]"));params.standard_parallel_2=parseFloat(extractString_(wkt,'"Standard_Parallel_2",',"]"));sr=new LambertConformalConic(params);break;case"Transverse_Mercator":params.scale_factor=parseFloat(extractString_(wkt,'"Scale_Factor",',"]"));sr=new TransverseMercator(params);break;case"Albers":params.standard_parallel_1=parseFloat(extractString_(wkt,'"Standard_Parallel_1",',"]"));params.standard_parallel_2=parseFloat(extractString_(wkt,'"Standard_Parallel_2",',"]"));sr=new Albers(params);break;default:throw new Error(prj+"  not supported")}if(sr){spatialReferences_[""+wkidt]=sr}}return sr};function Catalog(url){this.url=url;var me=this;getJSON_(url,{},"",function(json){augmentObject_(json,me);triggerEvent_(me,"load")})}function Layer(url){this.url=url;this.definition=null}Layer.prototype.load=function(){var me=this;if(this.loaded_){return}getJSON_(this.url,{},"",function(json){augmentObject_(json,me);me.loaded_=true;triggerEvent_(me,"load")})};Layer.prototype.isInScale=function(scale){if(this.maxScale&&this.maxScale>scale){return false}if(this.minScale&&this.minScale<scale){return false}return true};var SpatialRelationship={INTERSECTS:"esriSpatialRelIntersects",CONTAINS:"esriSpatialRelContains",CROSSES:"esriSpatialRelCrosses",ENVELOPE_INTERSECTS:"esriSpatialRelEnvelopeIntersects",INDEX_INTERSECTS:"esriSpatialRelIndexIntersects",OVERLAPS:"esriSpatialRelOverlaps",TOUCHES:"esriSpatialRelTouches",WITHIN:"esriSpatialRelWithin"};Layer.prototype.query=function(p,callback,errback){if(!p){return}var params=augmentObject_(p,{});if(p.geometry&&!isString_(p.geometry)){params.geometry=fromOverlaysToJSON_(p.geometry);params.geometryType=getGeometryType_(p.geometry);params.inSR=4326}if(p.spatialRelationship){params.spatialRel=p.spatialRelationship;delete params.spatialRelationship}if(p.outFields&&isArray_(p.outFields)){params.outFields=p.outFields.join(",")}if(p.objectIds){params.objectIds=p.objectIds.join(",")}if(p.time){params.time=formatTimeString_(p.time,p.endTime)}params.outSR=4326;params.returnGeometry=p.returnGeometry===false?false:true;params.returnIdsOnly=p.returnIdsOnly===true?true:false;delete params.overlayOptions;getJSON_(this.url+"/query",params,"",function(json){parseFeatures_(json.features,p.overlayOptions);callback(json,json.error);handleErr_(errback,json)})};Layer.prototype.queryRelatedRecords=function(qparams,callback,errback){if(!qparams){return}var params=augmentObject_(qparams,{});params.f=params.f||"json";if(params.outFields&&!isString_(params.outFields)){params.outFields=params.outFields.join(",")}params.returnGeometry=params.returnGeometry===false?false:true;getJSON_(this.url+"/query",params,"",function(json){handleErr_(errback,json);callback(json)})};function MapService(url,opts){this.url=url;this.loaded_=false;var tks=url.split("/");this.name=tks[tks.length-2].replace(/_/g," ");opts=opts||{};if(opts.delayLoad){var me=this;window.setTimeout(function(){me.loadServiceInfo()},opts.delayLoad*1000)}else{this.loadServiceInfo()}}MapService.prototype.loadServiceInfo=function(){var me=this;getJSON_(this.url,{},"",function(json){me.init_(json)})};MapService.prototype.init_=function(json){var me=this;if(json.error){throw new Error(json.error.message)}augmentObject_(json,this);if(json.spatialReference.wkt){this.spatialReference=Util.registerSR(json.spatialReference.wkt)}else{this.spatialReference=spatialReferences_[json.spatialReference.wkid]}if(json.tables!==undefined){getJSON_(this.url+"/layers",{},"",function(json2){me.initLayers_(json2);getJSON_(me.url+"/legend",{},"",function(json3){me.initLegend_(json3);me.setLoaded_()})})}else{me.initLayers_(json);me.setLoaded_()}};MapService.prototype.setLoaded_=function(){this.loaded_=true;triggerEvent_(this,"load")};MapService.prototype.initLayers_=function(json2){var layers=[];var tables=[];this.layers=layers;if(json2.tables){this.tables=tables}var layer,i,c,info;for(i=0,c=json2.layers.length;i<c;i++){info=json2.layers[i];layer=new Layer(this.url+"/"+info.id);augmentObject_(info,layer);layer.visible=layer.defaultVisibility;layers.push(layer)}if(json2.tables){for(i=0,c=json2.tables.length;i<c;i++){info=json2.tables[i];layer=new Layer(this.url+"/"+info.id);augmentObject_(info,layer);tables.push(layer)}}for(i=0,c=layers.length;i<c;i++){layer=layers[i];if(layer.subLayerIds){layer.subLayers=[];for(var j=0,jc=layer.subLayerIds.length;j<jc;j++){var subLayer=this.getLayer(layer.subLayerIds[j]);layer.subLayers.push(subLayer);subLayer.parentLayer=layer}}}};MapService.prototype.initLegend_=function(json3){var layers=this.layers;if(json3.layers){var layer,i,c,info;for(i=0,c=json3.layers.length;i<c;i++){info=json3.layers[i];layer=layers[info.layerId];augmentObject_(info,layer)}}};MapService.prototype.getLayer=function(nameOrId){var layers=this.layers;if(layers){for(var i=0,c=layers.length;i<c;i++){if(nameOrId===layers[i].id){return layers[i]}if(isString_(nameOrId)&&layers[i].name.toLowerCase()===nameOrId.toLowerCase()){return layers[i]}}}return null};MapService.prototype.getLayerDefs_=function(){var ret={};if(this.layers){for(var i=0,c=this.layers.length;i<c;i++){var layer=this.layers[i];if(layer.definition){ret[String(layer.id)]=layer.definition}}}return ret};MapService.prototype.hasLoaded=function(){return this.loaded_};MapService.prototype.getVisibleLayerIds_=function(){var ret=[];if(this.layers){var layer;var i,c;for(i=0,c=this.layers.length;i<c;i++){layer=this.layers[i];if(layer.subLayers){for(var j=0,jc=layer.subLayers.length;j<jc;j++){if(layer.subLayers[j].visible===false){layer.visible=false;break}}}}for(i=0,c=this.layers.length;i<c;i++){layer=this.layers[i];if(layer.subLayers&&layer.subLayers.length>0){continue}if(layer.visible===true){ret.push(layer.id)}}}return ret};MapService.prototype.getInitialBounds=function(){if(this.initialExtent){this.initBounds_=this.initBounds_||fromEnvelopeToLatLngBounds_(this.initialExtent);return this.initBounds_}return null};MapService.prototype.getFullBounds=function(){if(this.fullExtent){this.fullBounds_=this.fullBounds_||fromEnvelopeToLatLngBounds_(this.fullExtent);return this.fullBounds_}return null};MapService.prototype.exportMap=function(p,callback,errback){if(!p||!p.bounds){return}var params={};params.f=p.f;var bnds=p.bounds;params.bbox=""+bnds.getSouthWest().lng()+","+bnds.getSouthWest().lat()+","+bnds.getNorthEast().lng()+","+bnds.getNorthEast().lat();params.size=""+p.width+","+p.height;params.dpi=p.dpi;if(p.imageSR){if(p.imageSR.wkid){params.imageSR=p.imageSR.wkid}else{params.imageSR="{wkt:"+p.imageSR.wkt+"}"}}params.bboxSR="4326";params.format=p.format;var defs=p.layerDefinitions;if(defs===undefined){defs=this.getLayerDefs_()}params.layerDefs=getLayerDefsString_(defs);var vlayers=p.layerIds;var layerOpt=p.layerOption||"show";if(vlayers===undefined){vlayers=this.getVisibleLayerIds_()}if(vlayers.length>0){params.layers=layerOpt+":"+vlayers.join(",")}else{if(this.loaded_&&callback){callback({href:null});return}}params.transparent=(p.transparent===false?false:true);if(p.time){params.time=formatTimeString_(p.time,p.endTime)}params.layerTimeOptions=p.layerTimeOptions;if(params.f==="image"){return this.url+"/export?"+formatParams_(params)}else{getJSON_(this.url+"/export",params,"",function(json){if(json.extent){json.bounds=fromEnvelopeToLatLngBounds_(json.extent);delete json.extent;callback(json)}else{handleErr_(errback,json.error)}})}};MapService.prototype.identify=function(p,callback,errback){if(!p){return}var params={};params.geometry=fromOverlaysToJSON_(p.geometry);params.geometryType=getGeometryType_(p.geometry);params.mapExtent=fromOverlaysToJSON_(p.bounds);params.tolerance=p.tolerance||2;params.sr=4326;params.imageDisplay=""+p.width+","+p.height+","+(p.dpi||96);params.layers=(p.layerOption||"all");if(p.layerIds){params.layers+=":"+p.layerIds.join(",")}if(p.layerDefs){params.layerDefs=getLayerDefsString_(p.layerDefs)}params.maxAllowableOffset=p.maxAllowableOffset;params.returnGeometry=(p.returnGeometry===false?false:true);getJSON_(this.url+"/identify",params,"",function(json){var rets=null;var i,js,g;if(json.results){rets=[];for(i=0;i<json.results.length;i++){js=json.results[i];g=fromJSONToOverlays_(js.geometry,p.overlayOptions);js.feature={geometry:g,attributes:js.attributes};delete js.attributes}}callback(json);handleErr_(errback,json)})};MapService.prototype.find=function(opts,callback,errback){if(!opts){return}var params=augmentObject_(opts,{});if(opts.layerIds){params.layers=opts.layerIds.join(",");delete params.layerIds}if(opts.searchFields){params.searchFields=opts.searchFields.join(",")}params.contains=(opts.contains===false?false:true);if(opts.layerDefinitions){params.layerDefs=getLayerDefsString_(opts.layerDefinitions);delete params.layerDefinitions}params.sr=4326;params.returnGeometry=(opts.returnGeometry===false?false:true);getJSON_(this.url+"/find",params,"",function(json){var rets=null;var i,js,g;if(json.results){rets=[];for(i=0;i<json.results.length;i++){js=json.results[i];g=fromJSONToOverlays_(js.geometry,opts.overlayOptions);js.feature={geometry:g,attributes:js.attributes};delete js.attributes}}callback(json);handleErr_(errback,json)})};MapService.prototype.queryLayer=function(layerNameOrId,params,callback,errback){var layer=this.getLayer(layerNameOrId);if(layer){layer.query(params,callback,errback)}};function GeocodeService(url){this.url=url;this.loaded_=false;var me=this;getJSON_(url,{},"",function(json){me.init_(json)})}GeocodeService.prototype.init_=function(json){augmentObject_(json,this);if(json.spatialReference){this.spatialReference=spatialReferences_[json.spatialReference.wkid||json.spatialReference.wkt]||WGS84}this.loaded_=true;triggerEvent_(this,"load")};GeocodeService.prototype.findAddressCandidates=function(gparams,callback,errback){var params=augmentObject_(gparams,{});if(params.inputs){augmentObject_(params.inputs,params);delete params.inputs}if(isArray_(params.outFields)){params.outFields=params.outFields.join(",")}var me=this;getJSON_(this.url+"/findAddressCandidates",params,"",function(json){if(json.candidates){var res,loc;var cands=[];for(var i=0;i<json.candidates.length;i++){res=json.candidates[i];loc=res.location;if(!isNaN(loc.x)&&!isNaN(loc.y)){var ll=[loc.x,loc.y];var sr=me.spatialReference;if(gparams.outSR){sr=spatialReferences_[gparams.outSR]}if(sr){ll=sr.inverse(ll)}res.location=new G.LatLng(ll[1],ll[0]);cands[cands.length]=res}}}callback({candidates:cands});handleErr_(errback,json)})};GeocodeService.prototype.geocode=function(params,callback){this.findAddressCandidates(params,callback)};GeocodeService.prototype.reverseGeocode=function(params,callback,errback){if(!isString_(params.location)){params.location=fromOverlaysToJSON_(params.location)}params.outSR=4326;var me=this;getJSON_(this.url+"/reverseGeocode",params,"",function(json){if(json.location){var loc=json.location;if(!isNaN(loc.x)&&!isNaN(loc.y)){var ll=[loc.x,loc.y];if(me.spatialReference){ll=me.spatialReference.inverse(ll)}json.location=new G.LatLng(ll[1],ll[0])}}callback(json);handleErr_(errback,json)})};function GeometryService(url){this.url=url;this.t="geocodeservice"}GeometryService.prototype.project=function(p,callback,errback){var params=prepareGeometryParams_(p);getJSON_(this.url+"/project",params,"callback",function(json){var geom=[];if(p.outSpatialReference===4326||p.outSpatialReference.wkid===4326){for(var i=0,c=json.geometries.length;i<c;i++){geom.push(fromJSONToOverlays_(json.geometries[i]))}json.geometries=geom}callback(json);handleErr_(errback,json)})};var SRUnit={METER:9001,FOOT:9002,SURVEY_FOOT:9003,SURVEY_MILE:9035,KILLOMETER:9036,RADIAN:9101,DEGREE:9102};GeometryService.prototype.buffer=function(p,callback,errback){var params=prepareGeometryParams_(p);if(p.bufferSpatialReference){params.bufferSR=formatSRParam_(p.bufferSpatialReference)}params.outSR=4326;params.distances=p.distances.join(",");if(p.unit){params.unit=p.unit}getJSON_(this.url+"/buffer",params,"callback",function(json){var geom=[];if(json.geometries){for(var i=0,c=json.geometries.length;i<c;i++){geom.push(fromJSONToOverlays_(json.geometries[i],p.overlayOptions))}}json.geometries=geom;callback(json);handleErr_(errback,json)})};function GPService(url){this.url=url;this.loaded_=false;var me=this;getJSON_(url,{},"",function(json){augmentObject_(json,me);me.loaded_=true;triggerEvent_(me,"load")})}function GPTask(url){this.url=url;this.loaded_=false;var me=this;getJSON_(url,{},"",function(json){augmentObject_(json,me);me.loaded_=true;triggerEvent_(me,"load")})}GPTask.prototype.execute=function(p,callback,errback){var params={};if(p.parameters){augmentObject_(p.parameters,params)}if(p.outSpatialReference){params["env:outSR"]=formatSRParam_(p.outSpatialReference)}else{params["env:outSR"]=4326}if(p.processSpatialReference){params["env:processSR"]=formatSRParam_(p.processSpatialReference)}getJSON_(this.url+"/execute",params,"",function(json){if(json.results){var res,f;for(var i=0;i<json.results.length;i++){res=json.results[i];if(res.dataType==="GPFeatureRecordSetLayer"){for(var j=0,J=res.value.features.length;j<J;j++){f=res.value.features[j];if(f.geometry){f.geometry=fromJSONToOverlays_(f.geometry,p.overlayOptions)}}}}}callback(json);handleErr_(errback,json)})};function NetworkService(url){this.url=url;this.loaded_=false;var me=this;getJSON_(url,{},"",function(json){augmentObject_(json,me);me.loaded_=true;triggerEvent_(me,"load")})}function RouteTask(url){this.url=url}RouteTask.prototype.solve=function(opts,callback,errback){if(!opts){return}var params=augmentObject_(opts,{});if(isArray_(opts.stops)){params.stops=fromLatLngsToFeatureSet_(opts.stops)}if(isArray_(opts.barriers)){if(opts.barriers.length>0){params.barriers=fromLatLngsToFeatureSet_(opts.barriers)}else{delete params.barriers}}params.returnRoutes=(opts.returnRoutes===false?false:true);params.returnDirections=(opts.returnDirections===true?true:false);params.returnBarriers=(opts.returnBarriers===true?true:false);params.returnStops=(opts.returnStops===true?true:false);getJSON_(this.url+"/solve",params,"",function(json){if(json.routes){parseFeatures_(json.routes.features,opts.overlayOptions)}callback(json);handleErr_(errback,json)})};function Projection(tileInfo){this.lods_=tileInfo?tileInfo.lods:null;this.spatialReference_=tileInfo?spatialReferences_[tileInfo.spatialReference.wkid||tileInfo.spatialReference.wkt]:WEB_MERCATOR;if(!this.spatialReference_){throw new Error("unsupported Spatial Reference")}this.resolution0_=tileInfo?tileInfo.lods[0].resolution:156543.033928;this.minZoom=Math.floor(Math.log(this.spatialReference_.getCircum()/this.resolution0_/256)/Math.LN2+0.5);this.maxZoom=tileInfo?this.minZoom+this.lods_.length-1:20;if(G.Size){this.tileSize_=tileInfo?new G.Size(tileInfo.cols,tileInfo.rows):new G.Size(256,256)}this.scale_=Math.pow(2,this.minZoom)*this.resolution0_;this.originX_=tileInfo?tileInfo.origin.x:-20037508.342787;this.originY_=tileInfo?tileInfo.origin.y:20037508.342787;if(tileInfo){var ratio;for(var i=0;i<tileInfo.lods.length-1;i++){ratio=tileInfo.lods[i].resolution/tileInfo.lods[i+1].resolution;if(ratio>2.001||ratio<1.999){throw new Error("This type of map cache is not supported in V3. \nScale ratio between zoom levels must be 2")}}}}Projection.prototype.fromLatLngToPoint=function(latlng,opt_point){if(!latlng||isNaN(latlng.lat())||isNaN(latlng.lng())){return null}var coords=this.spatialReference_.forward([latlng.lng(),latlng.lat()]);var point=opt_point||new G.Point(0,0);point.x=(coords[0]-this.originX_)/this.scale_;point.y=(this.originY_-coords[1])/this.scale_;return point};Projection.prototype.fromLatLngToPoint=Projection.prototype.fromLatLngToPoint;Projection.prototype.fromPointToLatLng=function(pixel,opt_nowrap){if(pixel===null){return null}var x=pixel.x*this.scale_+this.originX_;var y=this.originY_-pixel.y*this.scale_;var geo=this.spatialReference_.inverse([x,y]);return new G.LatLng(geo[1],geo[0])};Projection.prototype.getScale=function(zoom){var zoomIdx=zoom-this.minZoom;var res=0;if(this.lods_[zoomIdx]){res=this.lods_[zoomIdx].scale}return res};Projection.WEB_MECATOR=new Projection();function TileLayer(service,opt_layerOpts){opt_layerOpts=opt_layerOpts||{};if(opt_layerOpts.opacity){this.opacity_=opt_layerOpts.opacity;delete opt_layerOpts.opacity}augmentObject_(opt_layerOpts,this);this.mapService_=(service instanceof MapService)?service:new MapService(service);if(opt_layerOpts.hosts){var pro=extractString_(this.mapService_.url,"","://");var host=extractString_(this.mapService_.url,"://","/");var path=extractString_(this.mapService_.url,pro+"://"+host,"");this.urlTemplate_=pro+"://"+opt_layerOpts.hosts+path;this.numOfHosts_=parseInt(extractString_(opt_layerOpts.hosts,"[","]"),10)}this.name=opt_layerOpts.name||this.mapService_.name;this.maxZoom=opt_layerOpts.maxZoom||19;this.minZoom=opt_layerOpts.minZoom||0;this.dynaZoom=opt_layerOpts.dynaZoom||this.maxZoom;if(this.mapService_.loaded_){this.init_(opt_layerOpts)}else{var me=this;G.event.addListenerOnce(this.mapService_,"load",function(){me.init_(opt_layerOpts)})}this.tiles_={};this.map_=opt_layerOpts.map}TileLayer.prototype.init_=function(opt_layerOpts){if(this.mapService_.tileInfo){this.projection_=new Projection(this.mapService_.tileInfo);this.minZoom=opt_layerOpts.minZoom||this.projection_.minZoom;this.maxZoom=opt_layerOpts.maxZoom||this.projection_.maxZoom}};TileLayer.prototype.getTileUrl=function(tile,zoom){var z=zoom-(this.projection_?this.projection_.minZoom:this.minZoom);var url="";if(!isNaN(tile.x)&&!isNaN(tile.y)&&z>=0&&tile.x>=0&&tile.y>=0){var u=this.mapService_.url;if(this.urlTemplate_){u=this.urlTemplate_.replace("["+this.numOfHosts_+"]",""+((tile.y+tile.x)%this.numOfHosts_))}var prj=this.projection_||(this.map_?this.map_.getProjection():Projection.WEB_MECATOR);if(!prj instanceof Projection){prj=Projection.WEB_MECATOR}var size=prj.tileSize_;var numOfTiles=1<<zoom;var gworldsw=new G.Point(tile.x*size.width/numOfTiles,(tile.y+1)*size.height/numOfTiles);var gworldne=new G.Point((tile.x+1)*size.width/numOfTiles,tile.y*size.height/numOfTiles);var bnds=new G.LatLngBounds(prj.fromPointToLatLng(gworldsw),prj.fromPointToLatLng(gworldne));var fullBounds=this.mapService_.getFullBounds();if(this.mapService_.singleFusedMapCache===false||zoom>this.dynaZoom){var params={f:"image"};params.bounds=bnds;params.format="png32";params.width=size.width;params.height=size.height;params.imageSR=prj.spatialReference_;url=this.mapService_.exportMap(params)}else{if(fullBounds&&!fullBounds.intersects(bnds)){url=""}else{url=u+"/tile/"+z+"/"+tile.y+"/"+tile.x}}}return url};TileLayer.prototype.setOpacity=function(op){this.opacity_=op;var tiles=this.tiles_;for(var x in tiles){if(tiles.hasOwnProperty(x)){setNodeOpacity_(tiles[x],op)}}};TileLayer.prototype.getOpacity=function(){return this.opacity_};TileLayer.prototype.getMapService=function(){return this.mapService_};function MapType(tileLayers,opt_typeOpts){opt_typeOpts=opt_typeOpts||{};var i;if(opt_typeOpts.opacity){this.opacity_=opt_typeOpts.opacity;delete opt_typeOpts.opacity}augmentObject_(opt_typeOpts,this);var layers=tileLayers;if(isString_(tileLayers)){layers=[new TileLayer(tileLayers,opt_typeOpts)]}else{if(tileLayers instanceof MapService){layers=[new TileLayer(tileLayers,opt_typeOpts)]}else{if(tileLayers instanceof TileLayer){layers=[tileLayers]}else{if(tileLayers.length>0&&isString_(tileLayers[0])){layers=[];for(i=0;i<tileLayers.length;i++){layers[i]=new TileLayer(tileLayers[i],opt_typeOpts)}}}}}this.tileLayers_=layers;this.tiles_={};if(opt_typeOpts.maxZoom!==undefined){this.maxZoom=opt_typeOpts.maxZoom}else{var maxZ=0;for(i=0;i<layers.length;i++){maxZ=Math.max(maxZ,layers[i].maxZoom)}this.maxZoom=maxZ}if(layers[0].projection_){this.tileSize=layers[0].projection_.tileSize_;this.projection=layers[0].projection_}else{this.tileSize=new G.Size(256,256)}if(!this.name){this.name=layers[0].name}}MapType.prototype.getTile=function(tileCoord,zoom,ownerDocument){var div=ownerDocument.createElement("div");var tileId="_"+tileCoord.x+"_"+tileCoord.y+"_"+zoom;for(var i=0;i<this.tileLayers_.length;i++){var t=this.tileLayers_[i];if(zoom<=t.maxZoom&&zoom>=t.minZoom){var url=t.getTileUrl(tileCoord,zoom);if(url){var img=ownerDocument.createElement(document.all?"img":"div");img.style.border="0px none";img.style.margin="0px";img.style.padding="0px";img.style.overflow="hidden";img.style.position="absolute";img.style.top="0px";img.style.left="0px";img.style.width=""+this.tileSize.width+"px";img.style.height=""+this.tileSize.height+"px";if(document.all){img.src=url}else{img.style.backgroundImage="url("+url+")"}div.appendChild(img);t.tiles_[tileId]=img;if(t.opacity_!==undefined){setNodeOpacity_(img,t.opacity_)}else{if(this.opacity_!==undefined){setNodeOpacity_(img,this.opacity_)}}}else{}}}this.tiles_[tileId]=div;div.setAttribute("tid",tileId);return div};MapType.prototype.getTile=MapType.prototype.getTile;MapType.prototype.releaseTile=function(node){if(node.getAttribute("tid")){var tileId=node.getAttribute("tid");if(this.tiles_[tileId]){delete this.tiles_[tileId]}for(var i=0;i<this.tileLayers_.length;i++){var t=this.tileLayers_[i];if(t.tiles_[tileId]){delete t.tiles_[tileId]}}}};MapType.prototype.releaseTile=MapType.prototype.releaseTile;MapType.prototype.setOpacity=function(op){this.opacity_=op;var tiles=this.tiles_;for(var x in tiles){if(tiles.hasOwnProperty(x)){var nodes=tiles[x].childNodes;for(var i=0;i<nodes.length;i++){setNodeOpacity_(nodes[i],op)}}}};MapType.prototype.getOpacity=function(){return this.opacity_};MapType.prototype.getTileLayers=function(){return this.tileLayers_};function MapOverlay(service,opt_overlayOpts){opt_overlayOpts=opt_overlayOpts||{};this.mapService_=(service instanceof MapService)?service:new MapService(service);this.minZoom=opt_overlayOpts.minZoom;this.maxZoom=opt_overlayOpts.maxZoom;this.opacity_=opt_overlayOpts.opacity||1;this.exportOptions_=opt_overlayOpts.exportOptions||{};this.drawing_=false;this.needsNewRefresh_=false;this.overlay_=null;this.div_=null;if(opt_overlayOpts.map){this.setMap(opt_overlayOpts.map)}this.map_=null;this.listeners_=[]}MapOverlay.prototype=new G.OverlayView();MapOverlay.prototype.onAdd=function(){var me=this;this.listeners_.push(G.event.addListener(this.getMap(),"bounds_changed",callback_(this.refresh,this)));this.listeners_.push(G.event.addListener(this.getMap(),"dragstart",function(){me.dragging=true}));this.listeners_.push(G.event.addListener(this.getMap(),"dragend",function(){me.dragging=false}));var map=this.getMap();map.agsOverlays=map.agsOverlays||new G.MVCArray();map.agsOverlays.push(this);setCopyrightInfo_(map);this.map_=map};MapOverlay.prototype.onAdd=MapOverlay.prototype.onAdd;MapOverlay.prototype.onRemove=function(){for(var i=0,j=this.listeners_.length;i<j;i++){G.event.removeListener(this.listeners_[i])}if(this.overlay_){this.overlay_.setMap(null)}var map=this.map_;var agsOvs=map.agsOverlays;if(agsOvs){for(var i=0,c=agsOvs.getLength();i<c;i++){if(agsOvs.getAt(i)==this){agsOvs.removeAt(i);break}}}setCopyrightInfo_(map);this.map_=null};MapOverlay.prototype.onRemove=MapOverlay.prototype.onRemove;MapOverlay.prototype.draw=function(){if(!this.drawing_||this.needsNewRefresh_===true){this.refresh()}};MapOverlay.prototype.draw=MapOverlay.prototype.draw;MapOverlay.prototype.getOpacity=function(){return this.opacity_};MapOverlay.prototype.setOpacity=function(opacity){var op=Math.min(Math.max(opacity,0),1);this.opacity_=op;if(this.overlay_){setNodeOpacity_(this.overlay_.div_,op)}};MapOverlay.prototype.getMapService=function(){return this.mapService_};MapOverlay.prototype.refresh=function(){if(this.drawing_===true){this.needsNewRefresh_=true;return}var m=this.getMap();var bnds=m?m.getBounds():null;if(!bnds){return}var params=this.exportOptions_;params.bounds=bnds;var sr=WEB_MERCATOR;var s=m.getDiv();params.width=s.offsetWidth;params.height=s.offsetHeight;if(s.offsetWidth==0||s.offsetHeight==0){return}var prj=m.getProjection();if(prj&&prj instanceof Projection){sr=prj.spatialReference_}params.imageSR=sr;triggerEvent_(this,"drawstart");var me=this;this.drawing_=true;if(!this.dragging&&this.overlay_){this.overlay_.setMap(null);this.overlay_=null}this.mapService_.exportMap(params,function(json){me.drawing_=false;if(me.needsNewRefresh_===true){me.needsNewRefresh_=false;me.refresh();return}if(json.href){if(me.overlay_){me.overlay_.setMap(null);me.overlay_=null}me.overlay_=new ImageOverlay(json.bounds,json.href,me.map_,me.opacity_)}triggerEvent_(me,"drawend")})};MapOverlay.prototype.isHidden=function(){return !(this.visible_&&this.isInZoomRange_())};MapOverlay.prototype.isInZoomRange_=function(){var z=this.getMap().getZoom();if((this.minZoom!==undefined&&z<this.minZoom)||(this.maxZoom!==undefined&&z>this.maxZoom)){return false}return true};MapOverlay.prototype.show=function(){this.visible_=true;this.div_.style.visibility="visible";this.refresh()};MapOverlay.prototype.hide=function(){this.visible_=false;this.div_.style.visibility="hidden"};function ImageOverlay(bounds,url,map,op){this.bounds_=bounds;this.url_=url;this.map_=map;this.div_=null;this.op_=op;this.setMap(map)}ImageOverlay.prototype=new G.OverlayView();ImageOverlay.prototype.onAdd=function(){var div=document.createElement("DIV");div.style.border="none";div.style.borderWidth="0px";div.style.position="absolute";div.style.backgroundImage="url("+this.url_+")";this.div_=div;var panes=this.getPanes();setNodeOpacity_(div,this.op_);panes.overlayLayer.appendChild(div)};ImageOverlay.prototype.draw=function(){var overlayProjection=this.getProjection();var sw=overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());var ne=overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());var div=this.div_;div.style.left=sw.x+"px";div.style.top=ne.y+"px";div.style.width=(ne.x-sw.x)+"px";div.style.height=(sw.y-ne.y)+"px"};ImageOverlay.prototype.onRemove=function(){this.div_.parentNode.removeChild(this.div_);this.div_=null};function CopyrightControl(map){this.map_=map;setCopyrightInfo_(map)}CopyrightControl.prototype.refresh=function(){setCopyrightInfo_(this.map_)};gmaps.ags={SpatialReference:SpatialReference,Geographic:Geographic,LambertConformalConic:LambertConformalConic,SphereMercator:SphereMercator,TransverseMercator:TransverseMercator,SpatialRelationship:SpatialRelationship,GeometryType:GeometryType,SRUnit:SRUnit,Catalog:Catalog,MapService:MapService,Layer:Layer,GeocodeService:GeocodeService,GeometryService:GeometryService,GPService:GPService,GPTask:GPTask,RouteTask:RouteTask,Util:Util,Config:Config,Projection:Projection,TileLayer:TileLayer,MapOverlay:MapOverlay,MapType:MapType,CopyrightControl:CopyrightControl};window.gmaps=gmaps})();

;//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function(){var n=this,t=n._,r={},e=Array.prototype,u=Object.prototype,i=Function.prototype,a=e.push,o=e.slice,c=e.concat,l=u.toString,f=u.hasOwnProperty,s=e.forEach,p=e.map,h=e.reduce,v=e.reduceRight,g=e.filter,d=e.every,m=e.some,y=e.indexOf,b=e.lastIndexOf,x=Array.isArray,w=Object.keys,_=i.bind,j=function(n){return n instanceof j?n:this instanceof j?void(this._wrapped=n):new j(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=j),exports._=j):n._=j,j.VERSION="1.6.0";var A=j.each=j.forEach=function(n,t,e){if(null==n)return n;if(s&&n.forEach===s)n.forEach(t,e);else if(n.length===+n.length){for(var u=0,i=n.length;i>u;u++)if(t.call(e,n[u],u,n)===r)return}else for(var a=j.keys(n),u=0,i=a.length;i>u;u++)if(t.call(e,n[a[u]],a[u],n)===r)return;return n};j.map=j.collect=function(n,t,r){var e=[];return null==n?e:p&&n.map===p?n.map(t,r):(A(n,function(n,u,i){e.push(t.call(r,n,u,i))}),e)};var O="Reduce of empty array with no initial value";j.reduce=j.foldl=j.inject=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),h&&n.reduce===h)return e&&(t=j.bind(t,e)),u?n.reduce(t,r):n.reduce(t);if(A(n,function(n,i,a){u?r=t.call(e,r,n,i,a):(r=n,u=!0)}),!u)throw new TypeError(O);return r},j.reduceRight=j.foldr=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),v&&n.reduceRight===v)return e&&(t=j.bind(t,e)),u?n.reduceRight(t,r):n.reduceRight(t);var i=n.length;if(i!==+i){var a=j.keys(n);i=a.length}if(A(n,function(o,c,l){c=a?a[--i]:--i,u?r=t.call(e,r,n[c],c,l):(r=n[c],u=!0)}),!u)throw new TypeError(O);return r},j.find=j.detect=function(n,t,r){var e;return k(n,function(n,u,i){return t.call(r,n,u,i)?(e=n,!0):void 0}),e},j.filter=j.select=function(n,t,r){var e=[];return null==n?e:g&&n.filter===g?n.filter(t,r):(A(n,function(n,u,i){t.call(r,n,u,i)&&e.push(n)}),e)},j.reject=function(n,t,r){return j.filter(n,function(n,e,u){return!t.call(r,n,e,u)},r)},j.every=j.all=function(n,t,e){t||(t=j.identity);var u=!0;return null==n?u:d&&n.every===d?n.every(t,e):(A(n,function(n,i,a){return(u=u&&t.call(e,n,i,a))?void 0:r}),!!u)};var k=j.some=j.any=function(n,t,e){t||(t=j.identity);var u=!1;return null==n?u:m&&n.some===m?n.some(t,e):(A(n,function(n,i,a){return u||(u=t.call(e,n,i,a))?r:void 0}),!!u)};j.contains=j.include=function(n,t){return null==n?!1:y&&n.indexOf===y?n.indexOf(t)!=-1:k(n,function(n){return n===t})},j.invoke=function(n,t){var r=o.call(arguments,2),e=j.isFunction(t);return j.map(n,function(n){return(e?t:n[t]).apply(n,r)})},j.pluck=function(n,t){return j.map(n,j.property(t))},j.where=function(n,t){return j.filter(n,j.matches(t))},j.findWhere=function(n,t){return j.find(n,j.matches(t))},j.max=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.max.apply(Math,n);var e=-1/0,u=-1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;o>u&&(e=n,u=o)}),e},j.min=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.min.apply(Math,n);var e=1/0,u=1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;u>o&&(e=n,u=o)}),e},j.shuffle=function(n){var t,r=0,e=[];return A(n,function(n){t=j.random(r++),e[r-1]=e[t],e[t]=n}),e},j.sample=function(n,t,r){return null==t||r?(n.length!==+n.length&&(n=j.values(n)),n[j.random(n.length-1)]):j.shuffle(n).slice(0,Math.max(0,t))};var E=function(n){return null==n?j.identity:j.isFunction(n)?n:j.property(n)};j.sortBy=function(n,t,r){return t=E(t),j.pluck(j.map(n,function(n,e,u){return{value:n,index:e,criteria:t.call(r,n,e,u)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),"value")};var F=function(n){return function(t,r,e){var u={};return r=E(r),A(t,function(i,a){var o=r.call(e,i,a,t);n(u,o,i)}),u}};j.groupBy=F(function(n,t,r){j.has(n,t)?n[t].push(r):n[t]=[r]}),j.indexBy=F(function(n,t,r){n[t]=r}),j.countBy=F(function(n,t){j.has(n,t)?n[t]++:n[t]=1}),j.sortedIndex=function(n,t,r,e){r=E(r);for(var u=r.call(e,t),i=0,a=n.length;a>i;){var o=i+a>>>1;r.call(e,n[o])<u?i=o+1:a=o}return i},j.toArray=function(n){return n?j.isArray(n)?o.call(n):n.length===+n.length?j.map(n,j.identity):j.values(n):[]},j.size=function(n){return null==n?0:n.length===+n.length?n.length:j.keys(n).length},j.first=j.head=j.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:0>t?[]:o.call(n,0,t)},j.initial=function(n,t,r){return o.call(n,0,n.length-(null==t||r?1:t))},j.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:o.call(n,Math.max(n.length-t,0))},j.rest=j.tail=j.drop=function(n,t,r){return o.call(n,null==t||r?1:t)},j.compact=function(n){return j.filter(n,j.identity)};var M=function(n,t,r){return t&&j.every(n,j.isArray)?c.apply(r,n):(A(n,function(n){j.isArray(n)||j.isArguments(n)?t?a.apply(r,n):M(n,t,r):r.push(n)}),r)};j.flatten=function(n,t){return M(n,t,[])},j.without=function(n){return j.difference(n,o.call(arguments,1))},j.partition=function(n,t){var r=[],e=[];return A(n,function(n){(t(n)?r:e).push(n)}),[r,e]},j.uniq=j.unique=function(n,t,r,e){j.isFunction(t)&&(e=r,r=t,t=!1);var u=r?j.map(n,r,e):n,i=[],a=[];return A(u,function(r,e){(t?e&&a[a.length-1]===r:j.contains(a,r))||(a.push(r),i.push(n[e]))}),i},j.union=function(){return j.uniq(j.flatten(arguments,!0))},j.intersection=function(n){var t=o.call(arguments,1);return j.filter(j.uniq(n),function(n){return j.every(t,function(t){return j.contains(t,n)})})},j.difference=function(n){var t=c.apply(e,o.call(arguments,1));return j.filter(n,function(n){return!j.contains(t,n)})},j.zip=function(){for(var n=j.max(j.pluck(arguments,"length").concat(0)),t=new Array(n),r=0;n>r;r++)t[r]=j.pluck(arguments,""+r);return t},j.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},j.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if("number"!=typeof r)return e=j.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}if(y&&n.indexOf===y)return n.indexOf(t,r);for(;u>e;e++)if(n[e]===t)return e;return-1},j.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=null!=r;if(b&&n.lastIndexOf===b)return e?n.lastIndexOf(t,r):n.lastIndexOf(t);for(var u=e?r:n.length;u--;)if(n[u]===t)return u;return-1},j.range=function(n,t,r){arguments.length<=1&&(t=n||0,n=0),r=arguments[2]||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=0,i=new Array(e);e>u;)i[u++]=n,n+=r;return i};var R=function(){};j.bind=function(n,t){var r,e;if(_&&n.bind===_)return _.apply(n,o.call(arguments,1));if(!j.isFunction(n))throw new TypeError;return r=o.call(arguments,2),e=function(){if(!(this instanceof e))return n.apply(t,r.concat(o.call(arguments)));R.prototype=n.prototype;var u=new R;R.prototype=null;var i=n.apply(u,r.concat(o.call(arguments)));return Object(i)===i?i:u}},j.partial=function(n){var t=o.call(arguments,1);return function(){for(var r=0,e=t.slice(),u=0,i=e.length;i>u;u++)e[u]===j&&(e[u]=arguments[r++]);for(;r<arguments.length;)e.push(arguments[r++]);return n.apply(this,e)}},j.bindAll=function(n){var t=o.call(arguments,1);if(0===t.length)throw new Error("bindAll must be passed function names");return A(t,function(t){n[t]=j.bind(n[t],n)}),n},j.memoize=function(n,t){var r={};return t||(t=j.identity),function(){var e=t.apply(this,arguments);return j.has(r,e)?r[e]:r[e]=n.apply(this,arguments)}},j.delay=function(n,t){var r=o.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},j.defer=function(n){return j.delay.apply(j,[n,1].concat(o.call(arguments,1)))},j.throttle=function(n,t,r){var e,u,i,a=null,o=0;r||(r={});var c=function(){o=r.leading===!1?0:j.now(),a=null,i=n.apply(e,u),e=u=null};return function(){var l=j.now();o||r.leading!==!1||(o=l);var f=t-(l-o);return e=this,u=arguments,0>=f?(clearTimeout(a),a=null,o=l,i=n.apply(e,u),e=u=null):a||r.trailing===!1||(a=setTimeout(c,f)),i}},j.debounce=function(n,t,r){var e,u,i,a,o,c=function(){var l=j.now()-a;t>l?e=setTimeout(c,t-l):(e=null,r||(o=n.apply(i,u),i=u=null))};return function(){i=this,u=arguments,a=j.now();var l=r&&!e;return e||(e=setTimeout(c,t)),l&&(o=n.apply(i,u),i=u=null),o}},j.once=function(n){var t,r=!1;return function(){return r?t:(r=!0,t=n.apply(this,arguments),n=null,t)}},j.wrap=function(n,t){return j.partial(t,n)},j.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length-1;r>=0;r--)t=[n[r].apply(this,t)];return t[0]}},j.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},j.keys=function(n){if(!j.isObject(n))return[];if(w)return w(n);var t=[];for(var r in n)j.has(n,r)&&t.push(r);return t},j.values=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},j.pairs=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},j.invert=function(n){for(var t={},r=j.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},j.functions=j.methods=function(n){var t=[];for(var r in n)j.isFunction(n[r])&&t.push(r);return t.sort()},j.extend=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]=t[r]}),n},j.pick=function(n){var t={},r=c.apply(e,o.call(arguments,1));return A(r,function(r){r in n&&(t[r]=n[r])}),t},j.omit=function(n){var t={},r=c.apply(e,o.call(arguments,1));for(var u in n)j.contains(r,u)||(t[u]=n[u]);return t},j.defaults=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]===void 0&&(n[r]=t[r])}),n},j.clone=function(n){return j.isObject(n)?j.isArray(n)?n.slice():j.extend({},n):n},j.tap=function(n,t){return t(n),n};var S=function(n,t,r,e){if(n===t)return 0!==n||1/n==1/t;if(null==n||null==t)return n===t;n instanceof j&&(n=n._wrapped),t instanceof j&&(t=t._wrapped);var u=l.call(n);if(u!=l.call(t))return!1;switch(u){case"[object String]":return n==String(t);case"[object Number]":return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case"[object Date]":case"[object Boolean]":return+n==+t;case"[object RegExp]":return n.source==t.source&&n.global==t.global&&n.multiline==t.multiline&&n.ignoreCase==t.ignoreCase}if("object"!=typeof n||"object"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]==n)return e[i]==t;var a=n.constructor,o=t.constructor;if(a!==o&&!(j.isFunction(a)&&a instanceof a&&j.isFunction(o)&&o instanceof o)&&"constructor"in n&&"constructor"in t)return!1;r.push(n),e.push(t);var c=0,f=!0;if("[object Array]"==u){if(c=n.length,f=c==t.length)for(;c--&&(f=S(n[c],t[c],r,e)););}else{for(var s in n)if(j.has(n,s)&&(c++,!(f=j.has(t,s)&&S(n[s],t[s],r,e))))break;if(f){for(s in t)if(j.has(t,s)&&!c--)break;f=!c}}return r.pop(),e.pop(),f};j.isEqual=function(n,t){return S(n,t,[],[])},j.isEmpty=function(n){if(null==n)return!0;if(j.isArray(n)||j.isString(n))return 0===n.length;for(var t in n)if(j.has(n,t))return!1;return!0},j.isElement=function(n){return!(!n||1!==n.nodeType)},j.isArray=x||function(n){return"[object Array]"==l.call(n)},j.isObject=function(n){return n===Object(n)},A(["Arguments","Function","String","Number","Date","RegExp"],function(n){j["is"+n]=function(t){return l.call(t)=="[object "+n+"]"}}),j.isArguments(arguments)||(j.isArguments=function(n){return!(!n||!j.has(n,"callee"))}),"function"!=typeof/./&&(j.isFunction=function(n){return"function"==typeof n}),j.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},j.isNaN=function(n){return j.isNumber(n)&&n!=+n},j.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"==l.call(n)},j.isNull=function(n){return null===n},j.isUndefined=function(n){return n===void 0},j.has=function(n,t){return f.call(n,t)},j.noConflict=function(){return n._=t,this},j.identity=function(n){return n},j.constant=function(n){return function(){return n}},j.property=function(n){return function(t){return t[n]}},j.matches=function(n){return function(t){if(t===n)return!0;for(var r in n)if(n[r]!==t[r])return!1;return!0}},j.times=function(n,t,r){for(var e=Array(Math.max(0,n)),u=0;n>u;u++)e[u]=t.call(r,u);return e},j.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},j.now=Date.now||function(){return(new Date).getTime()};var T={escape:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;"}};T.unescape=j.invert(T.escape);var I={escape:new RegExp("["+j.keys(T.escape).join("")+"]","g"),unescape:new RegExp("("+j.keys(T.unescape).join("|")+")","g")};j.each(["escape","unescape"],function(n){j[n]=function(t){return null==t?"":(""+t).replace(I[n],function(t){return T[n][t]})}}),j.result=function(n,t){if(null==n)return void 0;var r=n[t];return j.isFunction(r)?r.call(n):r},j.mixin=function(n){A(j.functions(n),function(t){var r=j[t]=n[t];j.prototype[t]=function(){var n=[this._wrapped];return a.apply(n,arguments),z.call(this,r.apply(j,n))}})};var N=0;j.uniqueId=function(n){var t=++N+"";return n?n+t:t},j.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var q=/(.)^/,B={"'":"'","\\":"\\","\r":"r","\n":"n","	":"t","\u2028":"u2028","\u2029":"u2029"},D=/\\|'|\r|\n|\t|\u2028|\u2029/g;j.template=function(n,t,r){var e;r=j.defaults({},r,j.templateSettings);var u=new RegExp([(r.escape||q).source,(r.interpolate||q).source,(r.evaluate||q).source].join("|")+"|$","g"),i=0,a="__p+='";n.replace(u,function(t,r,e,u,o){return a+=n.slice(i,o).replace(D,function(n){return"\\"+B[n]}),r&&(a+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'"),e&&(a+="'+\n((__t=("+e+"))==null?'':__t)+\n'"),u&&(a+="';\n"+u+"\n__p+='"),i=o+t.length,t}),a+="';\n",r.variable||(a="with(obj||{}){\n"+a+"}\n"),a="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+a+"return __p;\n";try{e=new Function(r.variable||"obj","_",a)}catch(o){throw o.source=a,o}if(t)return e(t,j);var c=function(n){return e.call(this,n,j)};return c.source="function("+(r.variable||"obj")+"){\n"+a+"}",c},j.chain=function(n){return j(n).chain()};var z=function(n){return this._chain?j(n).chain():n};j.mixin(j),A(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=e[n];j.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!=n&&"splice"!=n||0!==r.length||delete r[0],z.call(this,r)}}),A(["concat","join","slice"],function(n){var t=e[n];j.prototype[n]=function(){return z.call(this,t.apply(this._wrapped,arguments))}}),j.extend(j.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}}),"function"==typeof define&&define.amd&&define("underscore",[],function(){return j})}).call(this);
//# sourceMappingURL=underscore-min.map;/*global document:false */
/*global google:false */
/*global gmaps:false */
/*global LOCATOR:false */
/*global LATLNG_LOCATOR:false */
/*global UTM_LOCATOR:false */
/*global TWP_LOCATOR:false */
/*global ADDRESS_LOCATOR:false */

/*
This module is used to convert the user inputs, such as latitude & longitude, UTM coordinates, 
Geographic Township with/without lot and concession, and address, to decimal laitude and longitude. 

This module requires the following properties are defined in globalConfig.
1) validateLatLngWithRegion method: Give two values, decide which one is latitude and which one is 
longitude. In Ontario, this is determined by the fact that the absoulte value of longitude is always 
larger than the absolute value of latitude. That is the predefined method in globalConfig. Developers
can define their own method with the same name to override this method. 

2) defaultZone: The default UTM zone number. If the users only input the easting and northing, the 
default UTM zone will be used in the UTM search. The predefined UTM zone in globalConfig is 17. 

3) geogTwpService: The URL for Geographic Township with/without lot and concession web service. It contains
the following properties: 
	geogTwpService: {
		url: "http://www.appliomaps.lrc.gov.on.ca/ArcGIS/rest/services/MOE/sportfishservice/MapServer",  //URL
		TWPLayerID: 0,   // layer id for Geographic Township layer
		LotLayerID: 1,   // layer id for Geographic Township with lot and concession layer
		outFields: ["CENX", "CENY"],  // output fields for Geographic Township with lot and concession layer
		TWPLayerNameField: "NAME", // Geographic Township Name field inGeographic Township layer
		LotLayerNameFields: {    // Geographic Township Name field, Lot, Concession fields in Geographic Township with lot and concession layer
			TownshipField: "OFFICIAL_NAME_UPPER",
			LotField: "LOT_NUM_1",
			ConField: "CONCESSION_NUMBER"
		}
	}

4) regionAddressProcess: test whether the input contains province name. In globalConfig, a default method is provided to 
test whether the input contains Ontario or not. If not, Ontario is added to the ending of user input. 

5) regionBoundary: stores the boundary of the province polygon. It is used to test whether a point is within the province or not. 
In globalConfig, the boundary of Ontario is provided. 

6) UTMRange: store the value ranges of easting and northing in UTM coordinates. In globalConfig, the UTM ranges of Ontario is provided as following: 
	UTMRange: {
		minEasting: 258030.3,        
		maxEasting: 741969.7,        
		minNorthing: 4614583.73,        
		maxNorthing: 6302884.09
	}
7) locatorsAvailable: stores whether specific locator services is available or not. In globalConfig, the default seting makes all four locator services
available. 
	locatorsAvailable: {
		latlng: true,
		utm: true,
		township: true,
		address: true
	}. 

The is an example of configuration in globalConfig:
	regionBoundary: [{x: -95.29920350, y: 48.77505703},	{x: -95.29920350, y: 53.07150598}, 	{x: -89.02502409, y: 56.95876930}, 	{x: -87.42238044, y: 56.34499088}, 	{x: -86.36531760, y: 55.93580527}, 	{x: -84.69447635, y: 55.45842206}, 	{x: -81.89837466, y: 55.35612565}, 	{x: -81.96657226, y: 53.17380238}, 	{x: -80.84131182, y: 52.28723355}, 	{x: -79.98884179, y: 51.80985033}, 	{x: -79.34096457, y: 51.74165273}, 	{x: -79.34096457, y: 47.54750019}, 	{x: -78.55669214, y: 46.49043736}, 	{x: -76.61306048, y: 46.14944935}, 	{x: -75.59009645, y: 45.77436253}, 	{x: -74.12384800, y: 45.91075774}, 	{x: -73.98745279, y: 45.02418891}, 	{x: -75.07861443, y: 44.61500329}, 	{x: -75.86288685, y: 44.03532368}, 	{x: -76.88585089, y: 43.69433566}, 	{x: -79.20, y: 43.450196}, 	{x: -78.62488975, y: 42.94416204}, 	{x: -79.54555738, y: 42.43268002}, 	{x: -81.28459623, y: 42.15988961}, 	{x: -82.54625188, y: 41.58020999}, 	{x: -83.26232670, y: 41.95529681}, 	{x: -83.36462310, y: 42.43268002}, 	{x: -82.61444948, y: 42.73956923}, 	{x: -82.17116506, y: 43.59203926}, 	{x: -82.61444948, y: 45.36517692}, 	{x: -84.08069793, y: 45.91075774}, 	{x: -84.93316796, y: 46.69503016}, 	{x: -88.27485047, y: 48.22947621}, 	{x: -89.33191330, y: 47.78619180}, 	{x: -90.32077854, y: 47.68389540}, 	{x: -92.09391619, y: 47.95668581}, 	{x: -94.07164666, y: 48.33177262}, 	{x: -95.29920350, y: 48.77505703}],
	UTMRange: {
		minEasting: 258030.3,        
		maxEasting: 741969.7,        
		minNorthing: 4614583.73,        
		maxNorthing: 6302884.09
	},
	locatorsAvailable: {
		latlng: true,
		utm: true,
		township: true,
		address: true
	},
	validateLatLngWithRegion: function(v1, v2){
		var lat = Math.min(v1, v2);
		var lng = -Math.max(v1, v2);
		return {lat: lat, lng: lng};
	},
	regionAddressProcess: function(addressStr){
		var address = addressStr.toUpperCase();
		var regionNames = ["ON", "ONT", "ONTARIO"];
		var res = false;
		for(var i=0; i<regionNames.length; i++){
			if(globalConfig.isAddressEndsWithRegionName(address, regionNames[i])){
				res = true;
			}
		}
		if(!res){
			return addressStr + " Ontario";
		}
		return addressStr;
	},
	defaultZone: 17,
	geogTwpService: {
		url: "http://www.appliomaps.lrc.gov.on.ca/ArcGIS/rest/services/MOE/sportfishservice/MapServer",
		TWPLayerID: 0,
		LotLayerID: 1,
		outFields: ["CENX", "CENY"],
		TWPLayerNameField: "NAME",
		LotLayerNameFields: {
			TownshipField: "OFFICIAL_NAME_UPPER",
			LotField: "LOT_NUM_1",
			ConField: "CONCESSION_NUMBER"
		}
	}
*/

var globalConfig = globalConfig || {};
/*globalConfig.informationDivId = globalConfig.informationDivId || 'information';
globalConfig.noResultFound = globalConfig.noResultFound || function(){
	document.getElementById(globalConfig.informationDivId).innerHTML ="<i>" + globalConfig.noResultFoundMsg + "</i>";	
};*/
	/* This the center of Ontario. If the geocoder returns this location as the results, it will be a failure of geocoding. */
	globalConfig.failedLocation = globalConfig.failedLocation || {
		positions: [[51.253775,-85.32321389999998], [42.832714, -80.279923]],
		difference: 0.00001
	};
	/* LOCATOR setting Starts */
	globalConfig.regionBoundary = globalConfig.regionBoundary || [{x: -95.29920350, y: 48.77505703},{x: -95.29920350, y: 53.07150598}, 	{x: -89.02502409, y: 56.95876930}, 	{x: -87.42238044, y: 56.34499088}, 	{x: -86.36531760, y: 55.93580527}, 	{x: -84.69447635, y: 55.45842206}, 	{x: -81.89837466, y: 55.35612565}, 	{x: -81.96657226, y: 53.17380238}, 	{x: -80.84131182, y: 52.28723355}, 	{x: -79.98884179, y: 51.80985033}, 	{x: -79.34096457, y: 51.74165273}, 	{x: -79.34096457, y: 47.54750019}, 	{x: -78.55669214, y: 46.49043736}, 	{x: -76.61306048, y: 46.14944935}, 	{x: -75.59009645, y: 45.77436253}, 	{x: -74.12384800, y: 45.91075774}, 	{x: -73.98745279, y: 45.02418891}, 	{x: -75.07861443, y: 44.61500329}, 	{x: -75.86288685, y: 44.03532368}, 	{x: -76.88585089, y: 43.69433566}, 	{x: -79.20, y: 43.450196}, 	{x: -78.62488975, y: 42.94416204}, 	{x: -79.54555738, y: 42.43268002}, 	{x: -81.28459623, y: 42.15988961}, 	{x: -82.54625188, y: 41.58020999}, 	{x: -83.26232670, y: 41.95529681}, 	{x: -83.36462310, y: 42.43268002}, 	{x: -82.61444948, y: 42.73956923}, 	{x: -82.17116506, y: 43.59203926}, 	{x: -82.61444948, y: 45.36517692}, 	{x: -84.08069793, y: 45.91075774}, 	{x: -84.93316796, y: 46.69503016}, 	{x: -88.27485047, y: 48.22947621}, 	{x: -89.33191330, y: 47.78619180}, 	{x: -90.32077854, y: 47.68389540}, 	{x: -92.09391619, y: 47.95668581}, 	{x: -94.07164666, y: 48.33177262}, 	{x: -95.29920350, y: 48.77505703}];
	globalConfig.TWPSearch = false;  //use to remember whether it is a Township location search. 
	globalConfig.TWPLotConSearch = false; //use to remember whether it is a Township with lot and concession location search.
	globalConfig.UTMRange = globalConfig.UTMRange ||{
		minEasting: 258030.3,        
		maxEasting: 741969.7,        
		minNorthing: 4614583.73,        
		maxNorthing: 6302884.09
	};
	globalConfig.locatorsAvailable = globalConfig.locatorsAvailable || {
		latlng: true,
		utm: true,
		township: true,
		address: true
	};
	globalConfig.validateLatLngWithRegion = globalConfig.validateLatLngWithRegion  || function(v1, v2){
		var lat = Math.min(v1, v2);
		var lng = -Math.max(v1, v2);
		return {lat: lat, lng: lng};
	};
	//Private method: test whether the input ends keywords
	globalConfig.isAddressEndsWithRegionName = globalConfig.isAddressEndsWithRegionName || function(address, str) {
		if (address.length > str.length + 1) {
			var substr = address.substring(address.length - str.length - 1);
			if (substr === (" " + str) || substr === ("," + str)) {
				return true;
			}
		}
		return false;
	};
	//Private method: test whether the input contains keywords by calling testOntario
	globalConfig.regionAddressProcess = globalConfig.regionAddressProcess || function(addressStr){
		var address = addressStr.toUpperCase();
		var regionNames = ["ON", "ONT", "ONTARIO"];
		var res = false;
		for(var i=0; i<regionNames.length; i++){
			if(globalConfig.isAddressEndsWithRegionName(address, regionNames[i])){
				res = true;
			}
		}
		if(!res){
			return addressStr + " Ontario";
		}
		return addressStr;
	};
	globalConfig.defaultZone = globalConfig.defaultZone || 17;
	globalConfig.geogTwpService = globalConfig.geogTwpService ||{
		url: "http://www.appliomaps.lrc.gov.on.ca/ArcGIS/rest/services/MOE/sportfishservice/MapServer",
		TWPLayerID: 0,
		LotLayerID: 1,
		latitude: "CENY",
		longitude: "CENX",		
		TWPLayerNameField: "NAME",
		LotLayerNameFields: {
			TownshipField: "OFFICIAL_NAME_UPPER",
			LotField: "LOT_NUM_1",
			ConField: "CONCESSION_NUMBER"
		}
	};
	/*globalConfig.locationServicesList = globalConfig.locationServicesList || [
		{
			mapService: "http://138.218.29.100/ArcGIS/rest/services/DevJerry/Parcels/MapServer",
			layerID: 0,
			displayPolygon: true,  //For non-polygon layers, it is always false. For polygon layers, you can turn on and off to visualize the polygon.  
			fieldsInInfoWindow: ["ARN"], 
			getInfoWindow: function(attributes){
				return "Assessment Parcel Number: <strong>" + attributes.ARN + "</strong>";
			}, 
			latitude: "Latitude",
			longitude: "Longitude",
			getSearchCondition: function(searchString){
				return "ARN = '" + searchString + "'";
			}, 
			isInputFitRequirements: function(searchString){
				var reg_isInteger = /^\d+$/;
				if ((searchString.length === 20) && (reg_isInteger.test(searchString))) {
					return true;
				}
				return false;				
			}
		},
		{
			mapService: "http://www.appliomaps.lrc.gov.on.ca/ArcGIS/rest/services/MOE/permitstotakewater/MapServer",
			layerID: 0,
			displayPolygon: false,  //For non-polygon layers, it is always false. For polygon layers, you can turn on and off to visualize the polygon.  
			fieldsInInfoWindow: ["OFF_NAME"], 
			getInfoWindow: function(attributes){
				return "<strong>" + attributes.OFF_NAME + "</strong>";
			},
			latitude: "LAT_DD",
			longitude: "LONG_DD",
			getSearchCondition: function(searchString){
				return "UPPER(OFF_NAME) = '" + searchString.toUpperCase() + "'";
			}, 
			isInputFitRequirements: function(searchString){
				var coorsArray = searchString.toUpperCase().split(/\s+/);
				if((coorsArray.length <= 1)||(coorsArray.length >= 4)){
					return false;
				}				
				var str = coorsArray[coorsArray.length - 1];		
				if((str === "RIVER") || (str === "CREEK") || (str === "BROOK") || (str === "LAKE") || (str === "HILL")|| (str === "ISLAND")){
					return true;
				}
				return false;
			}
		}		
	];*/
	/* LOCATOR setting Ends */
	
LOCATOR = (function () {
	var regIsFloat = /^(-?\d+)(\.\d+)?$/;
 
	//http://appdelegateinc.com/blog/2010/05/16/point-in-polygon-checking/
	// Ray Cast Point in Polygon extension for Google Maps GPolygon
	// App Delegate Inc <htttp://appdelegateinc.com> 2010
    function isInPolygon(lat, lng1) {
        var lng = lng1;
        if (lng1 > 0) {
            lng = -lng;
        }
        var poly = globalConfig.regionBoundary;
        var numPoints = poly.length;
        var inPoly = false;
        var j = numPoints - 1;
        for (var i = 0; i < numPoints; i++) {
            var vertex1 = poly[i];
            var vertex2 = poly[j];

            if (vertex1.x < lng && vertex2.x >= lng || vertex2.x < lng && vertex1.x >= lng) {
                if (vertex1.y + (lng - vertex1.x) / (vertex2.x - vertex1.x) * (vertex2.y - vertex1.y) < lat) {
                    inPoly = !inPoly;
                }
            }

            j = i;
        }
        return inPoly;
    }
	
   function validateLatLng(lat, lng) {
        if (isInPolygon(lat, lng)) {
            return {
                latLng: new google.maps.LatLng(lat, lng),
                success: true
            };
        }else {
            return {success: false};
        }
    }
		
    function isInPolygonUTM(easting, northing) {
		var UTMRange = globalConfig.UTMRange;
        return ((easting < UTMRange.maxEasting) && (easting > UTMRange.minEasting) && (northing < UTMRange.maxNorthing) && (northing > UTMRange.minNorthing));
    }
	
    function replaceChar(str, charA, charB) {
        var temp = [];
        temp = str.split(charA);
        var result = temp[0];
        if (temp.length >= 2) {
            for (var i = 1; i < temp.length; i++) {
                result = result + charB + temp[i];
            }
        }
        return result;
    }
/*
    function convertUTMtoLatLng(zone, north, east) {
        var pi = 3.14159265358979; //PI
        var a = 6378137; //equatorial radius for WGS 84
        var k0 = 0.9996; //scale factor
        var e = 0.081819191; //eccentricity
        var e_2 = 0.006694380015894481; //e'2
        //var corrNorth = north; //North Hemishpe
        var estPrime = 500000 - east;
        var arcLength = north / k0;
        var e_4 = e_2 * e_2;
        var e_6 = e_4 * e_2;
        var t1 = Math.sqrt(1 - e_2);
        var e1 = (1 - t1) / (1 + t1);
        var e1_2 = e1 * e1;
        var e1_3 = e1_2 * e1;
        var e1_4 = e1_3 * e1;

        var C1 = 3 * e1 / 2 - 27 * e1_3 / 32;
        var C2 = 21 * e1_2 / 16 - 55 * e1_4 / 32;
        var C3 = 151 * e1_3 / 96;
        var C4 = 1097 * e1_4 / 512;

        var mu = arcLength / (a * (1 - e_2 / 4.0 - 3 * e_4 / 64 - 5 * e_6 / 256));
        var FootprintLat = mu + C1 * Math.sin(2 * mu) + C2 * Math.sin(4 * mu) + C3 * Math.sin(6 * mu) + C4 * Math.sin(8 * mu);
        var FpLatCos = Math.cos(FootprintLat);
        //var C1_an = e_2*FpLatCos*FpLatCos;
        var FpLatTan = Math.tan(FootprintLat);
        var T1 = FpLatTan * FpLatTan;
        var FpLatSin = Math.sin(FootprintLat);
        var FpLatSin_e = e * FpLatSin;
        var t2 = 1 - FpLatSin_e * FpLatSin_e;
        var t3 = Math.sqrt(t2);
        var N1 = a / t3;
        var R1 = a * (1 - e_2) / (t2 * t3);
        var D = estPrime / (N1 * k0);
        var D_2 = D * D;
        var D_4 = D_2 * D_2;
        var D_6 = D_4 * D_2;
        var fact1 = N1 * FpLatTan / R1;
        var fact2 = D_2 / 2;
        var fact3 = (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e_2) * D_4 / 24;
        var fact4 = (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e_2 - 3 * C1 * C1) * D_6 / 720;
        var lofact1 = D;
        var lofact2 = (1 + 2 * T1 + C1) * D_2 * D / 6;
        var lofact3 = (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e_2 + 24 * T1 * T1) * D_4 * D / 120;
        var delta_Long = (lofact1 - lofact2 + lofact3) / FpLatCos;
        var zone_CM = 6 * zone - 183;
        var latitude = 180 * (FootprintLat - fact1 * (fact2 + fact3 + fact4)) / pi;
        var longitude = zone_CM - delta_Long * 180 / pi;
        var res = {
            Latitude: latitude.toFixed(8),
            Longitude: longitude.toFixed(8)
        };
        return res;
    }
	*/
	//Private method: get the centroid and add the polylines

	function returnCentroidAndPolyline(fset, latitude, longitude) {
		var totalX = 0;
		var totalY = 0;
		var totalArea = 0;
		var polylines = [];
		for (var polygonIndex = 0; polygonIndex < fset.features.length; polygonIndex++) {
			var att = fset.features[polygonIndex].attributes;
			var area = 0;
			for (var geometryIndex = 0; geometryIndex < fset.features[polygonIndex].geometry.length; geometryIndex++) {
				var gpolygon = fset.features[polygonIndex].geometry[geometryIndex];
				area = area + google.maps.geometry.spherical.computeArea(gpolygon.getPath());
				polylines.push(gpolygon);
			}
			totalY = totalY + (att[latitude] * area);
			totalX = totalX + (att[longitude] * area);
			totalArea = totalArea + area;
		}
		var gLatLng = new google.maps.LatLng(totalY/totalArea, totalX/totalArea);
		return {
			gLatLng: gLatLng, 
			polylines: polylines
		};
	}
	
	function returnCentroid(fset, latitude, longitude) {
		var totalX = 0;
		var totalY = 0;
		for (var i = 0; i < fset.features.length; i++) {
			var att = fset.features[i].attributes;
			totalY = totalY + att[latitude];
			totalX = totalX + att[longitude];
		}
		var gLatLng = new google.maps.LatLng(totalY/fset.features.length, totalX/fset.features.length);
		return {
			gLatLng: gLatLng
		};
	}
	
	LATLNG_LOCATOR = (function () {

		function processRegionValidation(v1, v2){
			var result = {lat: v1, lng: v2};
			result = globalConfig.validateLatLngWithRegion(v1, v2);
			return result;
		}
		//Private method: parse decimal degree.

		function processDecimalDegree(coorsArray) {
			if (regIsFloat.test(coorsArray[0])&&regIsFloat.test(coorsArray[1])) {					
				var v1 = Math.abs(parseFloat(coorsArray[0]));
				var v2 = Math.abs(parseFloat(coorsArray[1]));
				var result = processRegionValidation(v1, v2);
				return validateLatLng(result.lat, result.lng);
			} else {
				return {success:false};
			}
		}
		
		//Private method: Parse the string. called by parseLatLng

		function parseDMS(s, unparsed) {
			var res = {
				ParsedNum: 0,
				Unparsed: ""
			};
			if (unparsed.length === 0) {
				return res;
			}
			var arr = unparsed.split(s);
			var result = 0;
			if (arr.length <= 2) {
				if (regIsFloat.test(arr[0])) {						
					result = parseFloat(arr[0]);
				}
				if (arr.length === 2) {
					unparsed = arr[1];
				} else {
					unparsed = "";
				}
			}
			res = {
				ParsedNum: result,
				Unparsed: unparsed
			};
			return res;
		}
		
		//Private method: Parse the string by calling parseDMS. Called by processSymbol and processSymbolDMS

		function parseLatLng(val, s1, s2, s3) {
			var result = 0;
			var parsed = parseDMS(s1, val);
			var deg = parsed.ParsedNum;
			parsed = parseDMS(s2, parsed.Unparsed);
			var min = parsed.ParsedNum;
			parsed = parseDMS(s3, parsed.Unparsed);
			var sec = parsed.ParsedNum;
			if (deg > 0) {
				result = deg + min / 60.0 + sec / 3600.0;
			} else {
				result = deg - min / 60.0 - sec / 3600.0;
			}
			result = Math.abs(result);
			return result;
		}
		
		//Private method: parse symbol degree, minute and second. Need to call parseLatLng method.

		function processSymbol(coorsArray) {
			var degreeSym = String.fromCharCode(176);
			if (((coorsArray[0]).indexOf(degreeSym) > 0) && ((coorsArray[1]).indexOf(degreeSym) > 0)) {
				var v1 = parseLatLng(coorsArray[0], degreeSym, "'", "\"");
				var v2 = parseLatLng(coorsArray[1], degreeSym, "'", "\"");
				var result = processRegionValidation(v1, v2);
				return validateLatLng(result.lat, result.lng);
			} else {
				return {success:false};
			}
		}
		
		//Private method: valide whether input contains a number with D. called by processSymbolDMS

		function validateLatLngFormat(str) {
			for (var i = 0; i <= 9; i++) {
				if (str.indexOf(i + "D") > 0) {
					return 1;
				}
			}
			return 0;
		}
		
		//Private method: parse symbol (DMS) degree, minute and second. Need to call parseLatLng and validateLatLngFormat methods.

		function processSymbolDMS(coorsArray) {
			var str1 = (coorsArray[0]).toUpperCase();
			var str2 = (coorsArray[1]).toUpperCase();
			var valid = validateLatLngFormat(str1) * validateLatLngFormat(str2);
			if (valid > 0) {
				var v1 = parseLatLng(str1, "D", "M", "S");
				var v2 = parseLatLng(str2, "D", "M", "S");
				var result = processRegionValidation(v1, v2);
				return validateLatLng(result.lat, result.lng);
			} else {
				return {success:false};
			}
		}


		//Public method: use three methods: decimal degree, DMS, and DMS symbols to parse the input
		function process(queryParams, coorsArray) {
			if (coorsArray.length !== 2) {
				return {success:false};
			}
			var res = processDecimalDegree(coorsArray);
			if (!res.success) {
				res = processSymbol(coorsArray);
			}
			if (!res.success) {
				res = processSymbolDMS(coorsArray);
			}
			
			if (res.success) {
				queryParams.gLatLng = res.latLng;
				queryParams.callback(queryParams);
			}
			return res;
		}
				
		var module = {
			process: process
		};
		return module;
	})();

	//Parse the input as UTM
	UTM_LOCATOR = (function () {

		//Private method: Parse default UTM ZONE with only easting and northing

		function processDefaultZone(coorsArray, defaultZone) {
			if (coorsArray.length !== 2) {
				return {success:false};
			}
			if (regIsFloat.test(coorsArray[0])&&regIsFloat.test(coorsArray[1])) {			
				var v1 = Math.abs(parseFloat(coorsArray[0]));
				var v2 = Math.abs(parseFloat(coorsArray[1]));
				var v3 = Math.min(v1, v2);
				var v4 = Math.max(v1, v2);
				if (isInPolygonUTM(v3, v4)) {
					var latlng = globalConfig.convertUTMtoLatLng(defaultZone, v4, v3);
					return validateLatLng(latlng.Latitude, latlng.Longitude);
				} else {
					return {success:false};
				}
			} else {
				return {success:false};
			}
		}
		//Private method: Parse general UTM with zone, easting and northing

		function processGeneralUTM(coorsArray) {
			var res = {success:false};
			if (coorsArray.length !== 3) {
				return res;
			}
			var a1 = (coorsArray[0]).replace(",", " ").trim();
			var a2 = (coorsArray[1]).replace(",", " ").trim();
			var a3 = (coorsArray[2]).replace(",", " ").trim();
			if (regIsFloat.test(a1)&&regIsFloat.test(a2)&&regIsFloat.test(a3)) {
				var values = [Math.abs(parseFloat(a1)), Math.abs(parseFloat(a2)), Math.abs(parseFloat(a3))];
				values.sort(function (a, b) {
					return a - b;
				});
				var zoneStr = (values[0]).toString(); //zone
				var reg_isInteger = /^\d+$/;
				if (reg_isInteger.test(zoneStr)) {
					if ((values[0] >= 15) && (values[0] <= 18)) {
						if (isInPolygonUTM(values[1], values[2])) {
							var latlng = globalConfig.convertUTMtoLatLng(values[0], values[2], values[1]); //Zone, Northing, Easting
							return validateLatLng(latlng.Latitude, latlng.Longitude);
						}
					}
				}
			}
			return res;
		}
		function process(queryParams, coorsArray) {
			var res = processDefaultZone(coorsArray, globalConfig.defaultZone);
			if (!res.success) {
				res = processGeneralUTM(coorsArray);
			}
			if (res.success) {
				queryParams.gLatLng = res.latLng;
				queryParams.callback(queryParams);
			}
			return res;
		}		
		var module = {
			process: process
		};
		return module;
	})();

	//Parse the input as Township, Lot, Concession
	TWP_LOCATOR = (function () {


		//Private method: parse the input to get Lot, Concession

		function processLotCon(arr1) {
			if (arr1.length !== 2) {
				return {
					TWP: "",
					Lot: "",
					Con: "",
					isTWPOnly: false,
					success: false
				};
			}
			var TWPname = (arr1[0]).trim().split(/\s+/).join(' '); //replace multiple spaces with one space
			var con = "";
			var lot = "";
			if (((arr1[1]).indexOf("LOT") > 0) && ((arr1[1]).indexOf("CON") > 0)) {
				var arr2 = ((arr1[1]).trim()).split("CON");
				if ((arr2[0]).length === 0) {
					var arr3 = (arr2[1]).split("LOT");
					con = (arr3[0]).trim();
					lot = (arr3[1]).trim();
				} else {
					var arr4 = (arr2[0]).split("LOT");
					con = (arr2[1]).trim();
					lot = (arr4[1]).trim();
				}
			}
			var TWPOnly = false;
			if ((con.length === 0) && (lot.length === 0)) {
				TWPOnly = true;
			}
			return {
				TWP: TWPname,
				Lot: lot,
				Con: con,
				isTWPOnly: TWPOnly,
				success: true
			};
		}
		
		//Private method: parse the input to get Township, Lot, Concession by calling processLotCon

		function preprocessTWP(coors_Up) {
			var res = {
				TWP: "",
				Lot: "",
				Con: "",
				isTWPOnly: false,
				success: false
			};
			if (coors_Up.indexOf(' TWP') > 0) {
				res = processLotCon(coors_Up.split(" TWP"));
			}
			if (!res.success) {
				if (coors_Up.indexOf(' TOWNSHIP') > 0) {
					res = processLotCon(coors_Up.split(" TOWNSHIP"));
				}
			}
			if (!res.success) {
				if (coors_Up.indexOf('CANTON ') === 0) {
					var str = coors_Up.substring(7).trim();
					var lotIndex = str.indexOf(" LOT ");
					var conIndex = str.indexOf(" CON ");
					var index = lotIndex;
					if (conIndex < lotIndex) {
						index = conIndex;
					}
					var parsedList = [];
					if (index === -1) {
						parsedList.push(str);
						parsedList.push("");
					} else {
						parsedList.push(str.substring(0, index));
						parsedList.push(str.substring(index));
					}
					res = processLotCon(parsedList);
				}
			}
			return res;
		}
		
		//Public method: parse the input as Township, Lot, Concession information by calling preprocessTWP, getCentroidAndAddPolylines

		function process(queryParams, coorsArray) {
			var coors_Up = coorsArray.join(' ').toUpperCase();
			var twpInfo = preprocessTWP(coors_Up);

			if (twpInfo.success) {
				var geogTwpService = globalConfig.geogTwpService;								
				var params = {
					returnGeometry: true,
					outFields: [geogTwpService.latitude, geogTwpService.longitude]
				};
				var layerId;
				if (twpInfo.isTWPOnly) {
					params.where = geogTwpService.TWPLayerNameField + " = '" + twpInfo.TWP + "'";
					layerId = geogTwpService.TWPLayerID; //Twp layer
					globalConfig.TWPSearch = true;
				} else {
					params.where = geogTwpService.LotLayerNameFields.TownshipField + " = '" + twpInfo.TWP + "' AND " + geogTwpService.LotLayerNameFields.ConField + " = 'CON " + twpInfo.Con + "' AND " + geogTwpService.LotLayerNameFields.LotField + " = 'LOT " + twpInfo.Lot + "'";
					layerId = geogTwpService.LotLayerID; //Lot Con layer
					globalConfig.TWPLotConSearch = true;
				}
				
				var layer = new gmaps.ags.Layer(geogTwpService.url + "/" + layerId);
				layer.query(params, function (fset) {
					if (fset.features.length > 0) {
						var res = returnCentroidAndPolyline(fset, geogTwpService.latitude, geogTwpService.longitude);
						queryParams.gLatLng = res.gLatLng;
						queryParams.polylines = res.polylines;
						queryParams.zoomlevel = (twpInfo.isTWPOnly) ? globalConfig.twpZoomLevel : globalConfig.lotConcessionZoomLevel;
						queryParams.callback(queryParams);
					} else {
						//console.log("1");
						queryParams.totalCount = 0;
						globalConfig.resultFoundSimple(queryParams);
						//globalConfig.noResultFound();
					}
				});
				return {
					success: true
				};
			} else {
				return {success:false};
			}
		}		
		var module = {
			process: process
		};
		return module;
	})();

	ADDRESS_LOCATOR = (function () {
	    //validate the input is a latitude & longitude. 
		function validateLatLngSearch (coorsArray) {
			if (coorsArray.length === 2) {
				if (regIsFloat.test(coorsArray[0])&&regIsFloat.test(coorsArray[1])) {
					return true;
				}
				var degreeSym = String.fromCharCode(176);
				if (((coorsArray[0]).indexOf(degreeSym) > 0) && ((coorsArray[1]).indexOf(degreeSym) > 0)) {
					return true;
				}
				var validateLatLngFormat = function(str) {
					for (var i = 0; i <= 9; i++) {
						if (str.indexOf(i + "D") > 0) {
							return 1;
						}
					}
					return 0;
				};
				var str1 = (coorsArray[0]).toUpperCase();
				var str2 = (coorsArray[1]).toUpperCase();
				var valid = validateLatLngFormat(str1) * validateLatLngFormat(str2);
				if (valid > 0) {
					return true;					
				}
			}
			return false;
		}
		
		//Public method: parse the input as address information by calling isContarionOntario and showRevGeocodeResult		
		function process(queryParams, coorsArray) {
			if (validateLatLngSearch(coorsArray)) {
				queryParams.totalCount = 0;
				globalConfig.resultFoundSimple(queryParams);			
				//globalConfig.noResultFound();
				return;
			}
			
			var geocoder = new google.maps.Geocoder();
			var addressStr = queryParams.address;
			if (addressStr.toUpperCase() === "ONTARIO") {
				queryParams.totalCount = 0;
				globalConfig.resultFoundSimple(queryParams);			
				//globalConfig.noResultFound();
				return;
			}
			addressStr = globalConfig.regionAddressProcess(addressStr);
			geocoder.geocode({
				'address': addressStr
			}, function (results, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					var max = results.length;
					var notMoved = true;
					for (var i = 0; i < max; i++) {
						var point = results[i].geometry.location;
						var failedPositions = globalConfig.failedLocation.positions;
						var failedDifference = globalConfig.failedLocation.difference;
						var isThisPositionFailed = false;
						for (var j = 0; j < failedPositions.length; j ++) {
							var diff = Math.abs(point.lat() - failedPositions[j][0]) + Math.abs(point.lng() - failedPositions[j][1]);
							if (diff < failedDifference){
								isThisPositionFailed = true;
								break;
							}							
						}
						if (isThisPositionFailed) {
							continue;
						} 
						if (isInPolygon(point.lat(), point.lng())) {
							queryParams.gLatLng = point;
							queryParams.returnedAddress = results[i].formatted_address.toString();
							queryParams.callback(queryParams);
							notMoved = false;
							break;
						}
					}
					if (notMoved) {
						queryParams.totalCount = 0;
						globalConfig.resultFoundSimple(queryParams);					
						//globalConfig.noResultFound();
					}
				} else {
					queryParams.totalCount = 0;
					globalConfig.resultFoundSimple(queryParams);				
					//globalConfig.noResultFound();
				}
			});
		}
		var module = {
			process: process
		};
		return module;
	})();
	

	
    function locate(queryParams) {
        var coors = replaceChar(queryParams.address, ',', ' ').trim();
        var coorsArray = coors.split(/\s+/);
		var res = {success: false};
		/*Use the location service defined in configuration to search the user input. */
		if(typeof(globalConfig.locationServicesList) !== "undefined"){
			for (var i = 0; i < globalConfig.locationServicesList.length; i++) {
				var service = globalConfig.locationServicesList[i];
				if((!res.success)&&service.isInputFitRequirements(coors)){
					res.success = true;
					service.returnGeometry = false;
					if(service.displayPolygon){
						service.returnGeometry = true;
					}
					var outFields2 = service.fieldsInInfoWindow;
					outFields2.push(service.latitude);
					outFields2.push(service.longitude);
					var params = {
						returnGeometry: service.returnGeometry,
						where: service.getSearchCondition(coors),
						outFields: outFields2
					};
					var layer = new gmaps.ags.Layer(service.mapService + "/" +  service.layerID);
					var getInfoWindow = service.getInfoWindow;
					var displayPolygon = service.displayPolygon;
					var latField = service.latitude;
					var lngField = service.longitude;
					layer.query(params, function (fset) {
						var size = 0;
						if(fset){
							size = fset.features.length;
							if (size > 0) {
								queryParams.address = getInfoWindow(fset.features[0].attributes);
								if(displayPolygon){
									var centroid = returnCentroidAndPolyline(fset, latField, lngField);
									queryParams.gLatLng = centroid.gLatLng;
									queryParams.polylines = centroid.polylines;
									queryParams.callback(queryParams);
								}else{
									var centroid2 = returnCentroid(fset, latField, lngField);
									queryParams.gLatLng = centroid2.gLatLng;
									queryParams.callback(queryParams);									
								}
							}else{
								return {success: false};
							}
						}else{
							return {success: false};
						}
					});							
				}
			}
		}
		
		var locatorsAvailable = globalConfig.locatorsAvailable;
		if((!res.success)&&locatorsAvailable.latlng){
			res = LATLNG_LOCATOR.process(queryParams, coorsArray);
		}
        if ((!res.success)&&locatorsAvailable.utm) {
            res = UTM_LOCATOR.process(queryParams, coorsArray);
        }
        if ((!res.success)&&locatorsAvailable.township) {
            res = TWP_LOCATOR.process(queryParams, coorsArray);
        }
        if ((!res.success)&&locatorsAvailable.address) {
            res = ADDRESS_LOCATOR.process(queryParams, coorsArray);
        }
    }
    var module = {
        locate: locate
    };
    return module;
})();
