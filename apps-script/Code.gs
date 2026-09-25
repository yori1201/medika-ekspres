/** MEDIKA EKSPRES PILOT API — V2.2
 * Dispatcher-controlled vouchers + visible final tariff for >10 km after courier quotation.
 */
const SHEETS={ORDERS:'ORDERS',PATIENTS:'PATIENTS',ADDRESSES:'ADDRESSES',CONFIG:'Config',VOUCHERS:'VOUCHERS'};
const ORDER_HEADERS=['Order ID','Timestamp','Patient ID','Nama','WhatsApp','Poli / Dokter','Address ID','Alamat','Area','Lat','Lng','Jarak Jalan (KM)','Zona Tarif','Zona Pengiriman','Tarif Pasien','Manual Quote','Ongkir Provider','Service Fee','Payment Method','Payment Status','Pharmacy Status','Delivery Status','Batch ID','Courier Provider','Catatan','Voucher Code','Discount Amount','Base Fare'];
const PATIENT_HEADERS=['Patient ID','Nama','WhatsApp','Created At','Last Order At','Status'];
const ADDRESS_HEADERS=['Address ID','Patient ID','Label','Alamat','Patokan','Area','Lat','Lng','Jarak Jalan (KM)','Zona Pengiriman','Verified','Created At','Last Used At'];
const VOUCHER_HEADERS=['Code','Type','Value','Min Transaction','Max Discount','Start At','End At','Quota','Used','Active','Notes'];
function out_(x,cb){const j=JSON.stringify(x);if(cb){if(!/^medikaCallback_[a-zA-Z0-9_]{8,80}$/.test(cb))return ContentService.createTextOutput('{}').setMimeType(ContentService.MimeType.JSON);return ContentService.createTextOutput(cb+'('+j+')').setMimeType(ContentService.MimeType.JAVASCRIPT);}return ContentService.createTextOutput(j).setMimeType(ContentService.MimeType.JSON);}
function ss_(){return SpreadsheetApp.getActiveSpreadsheet();}
function sheet_(name,headers){let sh=ss_().getSheetByName(name);if(!sh){sh=ss_().insertSheet(name);sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);sh.getRange(1,1,1,headers.length).setFontWeight('bold');}else{if(sh.getLastRow()===0)sh.getRange(1,1,1,headers.length).setValues([headers]);const existing=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getValues()[0];headers.forEach(h=>{if(existing.indexOf(h)<0){sh.getRange(1,sh.getLastColumn()+1).setValue(h);existing.push(h);}});}return sh;}
function cfg_(){const base={HOSPITAL:{name:'RSUI',pickupLabel:'Instalasi Farmasi RSUI',lat:-6.374,lng:106.829},REGULAR_RADIUS_KM:5,AUTO_RADIUS_MAX_KM:15,REGULAR_CHARGE:25000,EXTRA_KM_RATE:4000,OUTER_ZONE_SERVICE_FEE:10000,PIC_WHATSAPP:'6285159991286'};const sh=ss_().getSheetByName(SHEETS.CONFIG);if(!sh||sh.getLastRow()<2)return base;const vals=sh.getDataRange().getValues(),m={};vals.slice(1).forEach(r=>{if(r[0]!==''&&r[0]!=null)m[String(r[0]).trim()]=r[1];});base.HOSPITAL.name=m.HOSPITAL_NAME||base.HOSPITAL.name;base.HOSPITAL.pickupLabel=m.PICKUP_LABEL||base.HOSPITAL.pickupLabel;base.HOSPITAL.lat=Number(m.HOSPITAL_LAT)||base.HOSPITAL.lat;base.HOSPITAL.lng=Number(m.HOSPITAL_LNG)||base.HOSPITAL.lng;['REGULAR_RADIUS_KM','AUTO_RADIUS_MAX_KM','REGULAR_CHARGE','EXTRA_KM_RATE','OUTER_ZONE_SERVICE_FEE'].forEach(k=>{if(m[k]!==undefined&&m[k]!=='')base[k]=Number(m[k]);});if(m.PIC_WHATSAPP)base.PIC_WHATSAPP=String(m.PIC_WHATSAPP);return base;}
function doGet(e){const p=(e&&e.parameter)||{};try{if(p.action==='config')return out_({ok:true,config:cfg_()},p.callback);if(p.action==='status')return out_(orderStatus_(p),p.callback);if(p.action==='route')return out_(route_(p),p.callback);if(p.action==='patientLookup')return out_(patientLookup_(p),p.callback);if(p.action==='readyOrders')return out_(readyOrders_(),p.callback);if(p.action==='vouchers')return out_({ok:true,vouchers:activeVouchers_()},p.callback);return out_({ok:true,service:'MEDIKA EKSPRES',version:'2.2'},p.callback);}catch(err){return out_({ok:false,error:String(err.message||err)},p.callback);}}
function doPost(e){const lock=LockService.getScriptLock();try{lock.waitLock(15000);const p=JSON.parse((e&&e.postData&&e.postData.contents)||'{}');if((p.action||'createOrder')==='createOrder')return out_(createOrder_(p));if(p.action==='dispatcherUpdate')return out_(dispatcherUpdate_(p));if(p.action==='voucherApply')return out_(voucherApply_(p));if(p.action==='calculateDelivery')return out_(calculateDelivery_(p));if(p.action==='getCourierQuotePreview')return out_(getCourierQuotePreview_(p));throw Error('Action tidak dikenal.');}catch(err){return out_({ok:false,error:String(err.message||err)});}finally{try{lock.releaseLock();}catch(_){}}}
function route_(p){const c=cfg_();let lat=Number(p.lat),lng=Number(p.lng),formatted='';if(!Number.isFinite(lat)||!Number.isFinite(lng)){const query=[p.address,p.area,'Depok','Indonesia'].filter(Boolean).join(', ');const geo=Maps.newGeocoder().setRegion('id').geocode(query);if(!geo.results||!geo.results.length)throw Error('Alamat tidak ditemukan.');const loc=geo.results[0].geometry.location;lat=loc.lat;lng=loc.lng;formatted=geo.results[0].formatted_address||String(p.address||'');}const dir=Maps.newDirectionFinder().setOrigin(c.HOSPITAL.lat,c.HOSPITAL.lng).setDestination(lat,lng).setMode(Maps.DirectionFinder.Mode.DRIVING).getDirections();if(!dir.routes||!dir.routes.length)throw Error('Rute jalan tidak ditemukan.');const km=dir.routes[0].legs[0].distance.value/1000;return {ok:true,lat,lng,distanceKm:Math.round(km*100)/100,formattedAddress:formatted,operationalZone:zone_(lat,lng,p.area)};}
function zone_(lat,lng,area){const a=String(area||'').trim();if(a)return a.toUpperCase();const c=cfg_(),dy=lat-c.HOSPITAL.lat,dx=lng-c.HOSPITAL.lng,ang=(Math.atan2(dx,dy)*180/Math.PI+360)%360;if(ang<45||ang>=315)return 'UTARA';if(ang<135)return 'TIMUR';if(ang<225)return 'SELATAN';return 'BARAT';}
function patientLookup_(p){const wa=phone_(p.whatsapp),name=String(p.name||'').trim().toLowerCase();if(wa.length<10||name.length<2)return {ok:false,addresses:[]};const ps=sheet_(SHEETS.PATIENTS,PATIENT_HEADERS),as=sheet_(SHEETS.ADDRESSES,ADDRESS_HEADERS);if(ps.getLastRow()<2)return {ok:true,addresses:[]};const pv=ps.getRange(2,1,ps.getLastRow()-1,PATIENT_HEADERS.length).getValues(),patient=pv.find(r=>phone_(r[2])===wa&&String(r[1]||'').trim().toLowerCase()===name);if(!patient)return {ok:true,addresses:[]};const av=as.getLastRow()<2?[]:as.getRange(2,1,as.getLastRow()-1,ADDRESS_HEADERS.length).getValues();return {ok:true,patientId:patient[0],addresses:av.filter(r=>r[1]===patient[0]&&String(r[10]).toLowerCase()!=='no').map(r=>({addressId:r[0],label:r[2],address:r[3],landmark:r[4],area:r[5],lat:r[6],lng:r[7],distanceKm:r[8],operationalZone:r[9]}))};}
function createOrder_(p){['orderId','name','whatsapp','doctor','address','area','paymentMethod'].forEach(k=>{if(!String(p[k]||'').trim())throw Error('Data wajib belum lengkap: '+k);});if(p.consent!==true)throw Error('Persetujuan data wajib.');const km=Number(p.distanceKm);if(!Number.isFinite(km)||km<=0)throw Error('Jarak jalan belum tervalidasi.');const c=cfg_();let base=km<=c.REGULAR_RADIUS_KM?c.REGULAR_CHARGE:(km<=c.AUTO_RADIUS_MAX_KM?c.REGULAR_CHARGE+Math.ceil(km-c.REGULAR_RADIUS_KM)*c.EXTRA_KM_RATE:'');const manual=km>c.AUTO_RADIUS_MAX_KM;let discount=0,voucherCode='';if(!manual&&p.voucherCode){voucherCode=String(p.voucherCode).trim();try{discount=voucherDiscount_(voucherCode,Number(base));}catch(e){throw Error('Voucher: '+e.message);}}const finalCharge=manual?'':Number(base)-discount;const operationalZone=zone_(Number(p.lat),Number(p.lng),p.area);p.operationalZone=operationalZone;const orders=sheet_(SHEETS.ORDERS,ORDER_HEADERS);if(find_(orders,1,p.orderId))return {ok:true,duplicate:true,orderId:p.orderId};const patient=upsertPatient_(p),address=upsertAddress_(p,patient.id);orders.appendRow([p.orderId,new Date(),patient.id,safe_(p.name),phone_(p.whatsapp),safe_(p.doctor),address.id,safe_(p.address),safe_(p.area),Number(p.lat),Number(p.lng),km,safe_(operationalZone),safe_(operationalZone),manual?'':finalCharge,manual?'Ya':'Tidak','',manual?c.OUTER_ZONE_SERVICE_FEE:0,safe_(p.paymentMethod),'Pending','Waiting','Pending','','',safe_(voucherCode),discount,manual?'':base]);return {ok:true,orderId:p.orderId,patientId:patient.id,addressId:address.id,finalFare:finalCharge,discountAmount:discount,operationalZone:operationalZone};}
function upsertPatient_(p){const sh=sheet_(SHEETS.PATIENTS,PATIENT_HEADERS),wa=phone_(p.whatsapp);let row=0;if(sh.getLastRow()>=2){const v=sh.getRange(2,1,sh.getLastRow()-1,PATIENT_HEADERS.length).getValues(),i=v.findIndex(r=>phone_(r[2])===wa);if(i>=0)row=i+2;}if(row){sh.getRange(row,2).setValue(safe_(p.name));sh.getRange(row,5).setValue(new Date());return {id:sh.getRange(row,1).getValue(),row};}const id='PT-'+Utilities.getUuid().slice(0,8).toUpperCase();sh.appendRow([id,safe_(p.name),wa,new Date(),new Date(),'Active']);return {id,row:sh.getLastRow()};}
function upsertAddress_(p,patientId){const sh=sheet_(SHEETS.ADDRESSES,ADDRESS_HEADERS);if(p.addressId){const row=find_(sh,1,String(p.addressId));if(row&&sh.getRange(row,2).getValue()===patientId){sh.getRange(row,13).setValue(new Date());return {id:p.addressId,row};}}let row=0;if(sh.getLastRow()>=2){const v=sh.getRange(2,1,sh.getLastRow()-1,ADDRESS_HEADERS.length).getValues(),key=norm_(p.address),i=v.findIndex(r=>r[1]===patientId&&norm_(r[3])===key);if(i>=0)row=i+2;}if(row){sh.getRange(row,4,1,9).setValues([[safe_(p.address),safe_(p.landmark),safe_(p.area),Number(p.lat),Number(p.lng),Number(p.distanceKm),safe_(p.operationalZone),'Yes',new Date()]]);return {id:sh.getRange(row,1).getValue(),row};}const id='ADR-'+Utilities.getUuid().slice(0,8).toUpperCase();sh.appendRow([id,patientId,'Rumah',safe_(p.address),safe_(p.landmark),safe_(p.area),Number(p.lat),Number(p.lng),Number(p.distanceKm),safe_(p.operationalZone),'Yes',new Date(),new Date()]);return {id,row:sh.getLastRow()};}
function activeVouchers_(){const sh=sheet_(SHEETS.VOUCHERS,VOUCHER_HEADERS);if(sh.getLastRow()<2){sh.appendRow(['PILOT10K','NOMINAL',10000,25000,10000,new Date(),new Date(Date.now()+90*86400000),100,0,'Yes','Promo pilot']);}const now=new Date();return sh.getRange(2,1,sh.getLastRow()-1,VOUCHER_HEADERS.length).getValues().filter(r=>String(r[9]).toLowerCase()==='yes'&&(!r[5]||new Date(r[5])<=now)&&(!r[6]||new Date(r[6])>=now)&&(Number(r[7]||0)===0||Number(r[8]||0)<Number(r[7]))).map(r=>({code:r[0],type:String(r[1]).toUpperCase(),value:Number(r[2]),minTransaction:Number(r[3]||0),maxDiscount:Number(r[4]||0)}));}
function voucherDiscount_(code,baseFare){if(!code)return 0;const v=activeVouchers_().find(x=>String(x.code).toUpperCase()===String(code).toUpperCase());if(!v)throw Error('Voucher tidak aktif / tidak tersedia.');if(Number(baseFare)<v.minTransaction)throw Error('Minimum transaksi voucher belum terpenuhi.');let d=v.type==='PERCENT'?Math.floor(Number(baseFare)*v.value/100):v.value;if(v.maxDiscount>0)d=Math.min(d,v.maxDiscount);return Math.max(0,Math.min(Number(baseFare),Math.round(d)));}
function readyOrders_(){const sh=sheet_(SHEETS.ORDERS,ORDER_HEADERS);if(sh.getLastRow()<2)return {ok:true,groups:{}};const v=sh.getRange(2,1,sh.getLastRow()-1,ORDER_HEADERS.length).getValues(),groups={};v.filter(r=>String(r[20]).toLowerCase()==='ready'&&String(r[21]).toLowerCase()!=='delivered').forEach(r=>{const z=r[13]||'BELUM ADA ZONA';(groups[z]||(groups[z]=[])).push({orderId:r[0],name:r[3],address:r[7],distanceKm:r[11],finalFare:r[14],manualQuote:String(r[15]).toLowerCase()==='ya',providerFare:r[16],serviceFee:r[17],batchId:r[22],courierProvider:r[23],voucherCode:r[25],discountAmount:r[26],baseFare:r[27]||r[14]});});return {ok:true,groups};}
function dispatcherUpdate_(p){const sh=sheet_(SHEETS.ORDERS,ORDER_HEADERS),row=find_(sh,1,String(p.orderId||''));if(!row)throw Error('Order tidak ditemukan.');if(p.providerFare!==undefined){const providerFare=Number(p.providerFare);if(!Number.isFinite(providerFare)||providerFare<=0)throw Error('Ongkir provider tidak valid.');sh.getRange(row,17).setValue(providerFare);if(p.courierProvider!==undefined)sh.getRange(row,24).setValue(safe_(p.courierProvider));if(String(sh.getRange(row,16).getValue()).toLowerCase()==='ya'){const c=cfg_(),base=Math.ceil((providerFare+c.OUTER_ZONE_SERVICE_FEE)/1000)*1000;sh.getRange(row,18).setValue(c.OUTER_ZONE_SERVICE_FEE);sh.getRange(row,28).setValue(base);recalcVoucher_(sh,row);}}
  if(p.voucherCode!==undefined){sh.getRange(row,26).setValue(safe_(p.voucherCode));recalcVoucher_(sh,row);}const map={batchId:23,deliveryStatus:22,pharmacyStatus:21,paymentStatus:20};Object.keys(map).forEach(k=>{if(p[k]!==undefined)sh.getRange(row,map[k]).setValue(safe_(p[k]));});return {ok:true,orderId:p.orderId,finalFare:sh.getRange(row,15).getValue(),discountAmount:sh.getRange(row,27).getValue(),deliveryStatus:sh.getRange(row,22).getValue()};}
function recalcVoucher_(sh,row){const base=Number(sh.getRange(row,28).getValue()||sh.getRange(row,15).getValue()||0),code=String(sh.getRange(row,26).getValue()||'').trim();if(!base){sh.getRange(row,27).setValue(0);return;}const oldCode=String(sh.getRange(row,26).getValue()||'').trim(),discount=voucherDiscount_(oldCode,base);sh.getRange(row,27).setValue(discount);sh.getRange(row,15).setValue(Math.max(0,base-discount));}
function orderStatus_(p){const sh=sheet_(SHEETS.ORDERS,ORDER_HEADERS),id=String(p.orderId||''),row=find_(sh,1,id);if(!row)return {ok:true,found:false,orderId:id};return {ok:true,found:true,orderId:id,finalFare:sh.getRange(row,15).getValue(),manualQuote:String(sh.getRange(row,16).getValue()).toLowerCase()==='ya',providerFare:sh.getRange(row,17).getValue(),serviceFee:sh.getRange(row,18).getValue(),voucherCode:sh.getRange(row,26).getValue(),discountAmount:sh.getRange(row,27).getValue(),baseFare:sh.getRange(row,28).getValue(),pharmacyStatus:sh.getRange(row,21).getValue(),deliveryStatus:sh.getRange(row,22).getValue()};}
function find_(sh,col,val){if(!val||sh.getLastRow()<2)return 0;const r=sh.getRange(2,col,sh.getLastRow()-1,1).createTextFinder(String(val)).matchEntireCell(true).findNext();return r?r.getRow():0;}
function phone_(v){let s=String(v||'').replace(/\D/g,'');if(s.startsWith('0'))s='62'+s.slice(1);return s;}function norm_(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim();}function calculateDelivery_(p){
  const addr=p.full_address||'';
  if(!addr||addr.trim().length<5)throw Error('Alamat tidak valid.');
  const c=cfg_();
  const query=[addr,'Depok','Indonesia'].filter(Boolean).join(', ');
  const geo=Maps.newGeocoder().setRegion('id').geocode(query);
  if(!geo.results||!geo.results.length)throw Error('Alamat tidak ditemukan.');
  const loc=geo.results[0].geometry.location;
  const dir=Maps.newDirectionFinder()
    .setOrigin(c.HOSPITAL.lat,c.HOSPITAL.lng)
    .setDestination(loc.lat,loc.lng)
    .setMode(Maps.DirectionFinder.Mode.DRIVING)
    .getDirections();
  if(!dir.routes||!dir.routes.length)throw Error('Rute tidak ditemukan.');
  const km=dir.routes[0].legs[0].distance.value/1000;
  const dist=Math.round(km*100)/100;
  let price='';
  if(dist<=c.REGULAR_RADIUS_KM){
    price=c.REGULAR_CHARGE;
  }else if(dist<=c.AUTO_RADIUS_MAX_KM){
    price=c.REGULAR_CHARGE+Math.ceil(dist-c.REGULAR_RADIUS_KM)*c.EXTRA_KM_RATE;
  }
  return {ok:true,distance_km:dist,patient_price:price,formatted_address:geo.results[0].formatted_address||addr,lat:loc.lat,lng:loc.lng};
}

function voucherApply_(p){
  const code=String(p.voucherCode||'').trim();
  const baseFare=Number(p.baseFare||0);
  if(!code)return {ok:false,error:'Kode voucher wajib diisi.'};
  if(!baseFare||baseFare<=0)return {ok:false,error:'Base fare tidak valid.'};
  const discount=voucherDiscount_(code,baseFare);
  return {ok:true,discount:discount,finalFare:baseFare-discount};
}

function safe_(v){const s=String(v==null?'':v).trim().slice(0,500);return /^[=+@\-@\t\r]/.test(s)?"'"+s:s;}
function getCourierQuotePreview_(p){
  const lat=Number(p.latitude||0),lng=Number(p.longitude||0),distanceKm=Number(p.distance_km||0),fullAddress=String(p.full_address||'').trim();
  if(!Number.isFinite(lat)||!Number.isFinite(lng))throw Error('Koordinat tujuan tidak valid.');
  if(!Number.isFinite(distanceKm)||distanceKm<=0)throw Error('Jarak pengantaran tidak valid.');
  if(distanceKm>15)throw Error('Di luar radius layanan maksimal 15 km.');
  const c=cfg_();
  const additionalKm=Math.max(0,Math.ceil(distanceKm-c.REGULAR_RADIUS_KM));
  const referenceFare=c.REGULAR_CHARGE+additionalKm*c.EXTRA_KM_RATE;
  const pickup=c.HOSPITAL;
  const destination={lat,lng,address:fullAddress};
  if(typeof courierQuote_==='function'){
    const quote=courierQuote_(pickup,destination);
    const courierCost=Number(quote.courier_cost??quote.price??quote.amount??quote.total??quote.totalFee??0);
    if(!Number.isFinite(courierCost)||courierCost<0)throw Error('Ongkir aktual kurir tidak valid.');
    const patientPrice=Math.min(referenceFare,courierCost+c.OUTER_ZONE_SERVICE_FEE);
    const margin=patientPrice-courierCost;
    if(margin>c.OUTER_ZONE_SERVICE_FEE)throw Error('Margin melebihi batas.');
    return{ok:true,distance_km:distanceKm,patient_price:Math.round(patientPrice)};
  }
  return{ok:true,distance_km:distanceKm,patient_price:referenceFare};
}
