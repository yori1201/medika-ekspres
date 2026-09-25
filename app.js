const C=window.MEDIKA_CONFIG,$=id=>document.getElementById(id);
let estimatedDistance=null,roadDistanceVerified=false,selectedAddressId="",livePatientPrice=null,currentStep=0,addressTimer=null,deliverySeq=0,qrisTimer=null,qrisSeconds=600,activeVoucherCode="";
const steps=[...document.querySelectorAll(".wizard-step")];
const DEPOK_AREAS={
  "Pancoran Mas":["Depok","Depok Jaya","Pancoran Mas","Mampang","Rangkapan Jaya Baru","Rangkapan Jaya"],
  "Cimanggis":["Harjamukti","Curug","Tugu","Mekarsari","Pasir Gunung Selatan","Cisalak Pasar"],
  "Sawangan":["Pasir Putih","Bedahan","Pengasinan","Cinangka","Sawangan","Sawangan Baru","Kedaung"],
  "Limo":["Grogol","Krukut","Limo","Meruyung"],
  "Sukmajaya":["Sukmajaya","Abadijaya","Mekarjaya","Baktijaya","Cisalak","Tirtajaya"],
  "Beji":["Beji","Kukusan","Tanah Baru","Kemiri Muka","Pondok Cina","Beji Timur"],
  "Cipayung":["Cipayung","Cipayung Jaya","Ratu Jaya","Bojong Pondok Terong","Pondok Jaya"],
  "Cilodong":["Sukamaju","Cilodong","Kalibaru","Kalimulya","Jatimulya"],
  "Cinere":["Cinere","Gandul","Pangkalan Jati","Pangkalan Jati Baru"],
  "Tapos":["Tapos","Leuwinanggung","Sukatani","Sukamaju Baru","Jatijajar","Cilangkap","Cimpaeun"],
  "Bojongsari":["Bojongsari","Bojongsari Baru","Serua","Pondok Petir","Curug","Duren Mekar","Duren Seribu"]
};
function initDepokAreas(){
  const kec=$("kecamatan"),kel=$("kelurahan"); if(!kec||!kel)return;
  Object.keys(DEPOK_AREAS).sort((a,b)=>a.localeCompare(b,"id")).forEach(name=>kec.add(new Option(name,name)));
  kec.addEventListener("change",()=>{
    kel.innerHTML=""; const area=DEPOK_AREAS[kec.value]||[];
    kel.add(new Option(area.length?"Pilih kelurahan":"Pilih kecamatan terlebih dahulu",""));
    area.forEach(name=>kel.add(new Option(name,name))); kel.disabled=!area.length; kel.value=""; scheduleAddressCalculation();
  });
}


function rupiah(n){return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n||0))}
function normalizePhone(v){let s=String(v||"").replace(/\D/g,"");if(s.startsWith("0"))s="62"+s.slice(1);return s}
async function apiPost(payload){if(!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(C.SHEETS_ENDPOINT||""))throw Error("Endpoint backend belum dikonfigurasi.");const r=await fetch(C.SHEETS_ENDPOINT,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload),redirect:"follow"});if(!r.ok)throw Error("Backend HTTP "+r.status);const j=await r.json();if(!j.success&&!j.ok)throw Error(j.error||"Backend gagal memproses permintaan.");return j.data!==undefined?j.data:j}

function resetDelivery(){estimatedDistance=null;roadDistanceVerified=false;livePatientPrice=null;activeVoucherCode="";const z=$("zoneHint");z.hidden=true;z.textContent="";renderFare()}
function renderFare(){const el=$("fareText"),help=$("fareHelp");if(!el)return;if(!Number.isFinite(estimatedDistance)){el.innerHTML="Jarak dan tarif belum tersedia.";help.textContent="Tarif dihitung otomatis setelah alamat lengkap diisi.";return}if(estimatedDistance>15||!Number.isFinite(livePatientPrice)){el.innerHTML=`<span>Jarak Pengantaran</span><strong>${estimatedDistance.toFixed(2)} km</strong><hr><b>Tarif memerlukan konfirmasi petugas.</b>`;help.textContent="Pembayaran belum dapat dilanjutkan.";return}let fh=`<span>Jarak Pengantaran</span><strong>${estimatedDistance.toFixed(2)} km</strong><hr><span>Tarif Pengantaran</span><strong class="price">${rupiah(livePatientPrice)}</strong>`;if(activeVoucherCode)fh+=`<hr><small class="voucher-tag">Voucher: ${activeVoucherCode}</small>`;el.innerHTML=fh;help.textContent=""}
function showCalculating(){const el=$("fareText"),help=$("fareHelp");if(el)el.innerHTML="<span>Menghitung jarak dan tarif…</span>";if(help)help.textContent="";const z=$("zoneHint");z.hidden=false;z.textContent="Menghitung jarak dan tarif…"}
async function calculateDelivery(address){const seq=++deliverySeq;showCalculating();try{const payload={action:"calculateDelivery",full_address:address};const r=await apiPost(payload);if(seq!==deliverySeq)return;const dist=Number(r.distance_km),price=Number(r.patient_price);estimatedDistance=dist;livePatientPrice=Number.isFinite(price)&&price>0?price:null;roadDistanceVerified=Number.isFinite(dist);lat=r.lat||null;lng=r.lng||null;$("summaryAddress").textContent=address||"Lokasi perangkat";renderFare();const z=$("zoneHint");z.hidden=false;z.textContent=dist>15?`Jarak ${dist.toFixed(2)} km — memerlukan konfirmasi petugas.`:`Jarak ${dist.toFixed(2)} km • Tarif ${rupiah(livePatientPrice)}`}
catch(e){if(seq!==deliverySeq)return;resetDelivery();const z=$("zoneHint");z.hidden=false;z.textContent="Jarak dan tarif belum dapat dihitung. Periksa kembali alamat.";console.warn(e)}}
function deliveryAddress(){return [$("address").value.trim(), $("kelurahan").value.trim(), $("kecamatan").value.trim()].filter(Boolean).join(", ")}
function scheduleAddressCalculation(){selectedAddressId="";resetDelivery();clearTimeout(addressTimer);const address=deliveryAddress();if($("address").value.trim().length<8||!$("kelurahan").value.trim()||!$("kecamatan").value.trim())return;addressTimer=setTimeout(()=>calculateDelivery(address),900)}
["address","kelurahan","kecamatan"].forEach(id=>$(id)?.addEventListener("input",scheduleAddressCalculation));
["kelurahan","kecamatan"].forEach(id=>$(id)?.addEventListener("change",scheduleAddressCalculation));
["address","kelurahan","kecamatan"].forEach(id=>$(id)?.addEventListener("blur",()=>{clearTimeout(addressTimer);const address=deliveryAddress();if($("address").value.trim().length>=8&&$("kelurahan").value.trim()&&$("kecamatan").value.trim()&&!roadDistanceVerified)calculateDelivery(address)}));
document.querySelectorAll('input[name="payment"]').forEach(x=>x.addEventListener("change",()=>{
  $("paymentDetail").textContent=C.PAYMENT[x.value]||"";
  $("sendOrder").textContent=x.value==="QRIS"?"Lanjut ke Pembayaran QRIS":"Kirim Pesanan";
}));
$("applyVoucher")?.addEventListener("click",applyVoucher);

function renderStep(){steps.forEach((el,i)=>el.hidden=i!==currentStep);$("prevStep").hidden=currentStep===0;$("nextStep").hidden=currentStep===3;$("sendOrder").hidden=currentStep!==3;if(currentStep===2){$("summaryAddress").textContent=deliveryAddress()||"—";renderFare()}window.scrollTo({top:0,behavior:"smooth"})}
async function applyVoucher(){
  const code=$("voucherCode").value.trim();
  if(!code){alert("Masukkan kode voucher dulu.");return}
  if(!roadDistanceVerified||!livePatientPrice){alert("Hitung tarif dulu sebelum pakai voucher.");return}
  try{
    const r=await apiPost({action:"voucherApply",voucherCode:code,baseFare:livePatientPrice});
    console.log("Voucher apply response:",r);
    if(r&&r.ok&&r.discount!==undefined){
      activeVoucherCode=code;
      livePatientPrice=Number(r.finalFare);
      renderFare();
      $("#voucherCode").value="";
      alert("Voucher diterapkan! Diskon: "+rupiah(r.discount)+". Harga menjadi: "+rupiah(livePatientPrice));
    }else{
      alert(r&&r.error?r.error:"Voucher tidak valid atau tidak dapat digunakan.");
    }
  }catch(e){alert("Gagal memproses voucher: "+e.message);}
}
function validateStep(){for(const input of [...steps[currentStep].querySelectorAll("input,textarea,select")].filter(x=>x.required)){if(!input.checkValidity()){input.reportValidity();input.focus();return false}}return true}
$("nextStep")?.addEventListener("click",async()=>{if(!validateStep())return;if(currentStep===1){const address=deliveryAddress();if(!roadDistanceVerified){clearTimeout(addressTimer);await calculateDelivery(address)}if(!roadDistanceVerified){alert("Jarak dan tarif belum dapat dihitung. Periksa kembali alamat.");return}if(estimatedDistance>15||!Number.isFinite(livePatientPrice)){alert("Tarif alamat ini memerlukan konfirmasi petugas dan belum dapat dilanjutkan ke pembayaran.");return}}if(currentStep<3){currentStep++;renderStep()}});
$("prevStep")?.addEventListener("click",()=>{if(currentStep>0){currentStep--;renderStep()}});

function buildOrderPayload(payment){
  const payload={action:"createOrder",orderId:"ME-"+Date.now().toString(36).toUpperCase()+"-"+Math.floor(Math.random()*9999),name:$("name").value.trim(),whatsapp:normalizePhone($("whatsapp").value),doctor:$("doctor").value.trim(),address:deliveryAddress(),area:$("kecamatan").value.trim(),paymentMethod:payment,distanceKm:roadDistanceVerified?estimatedDistance:0,lat:lat||0,lng:lng||0,consent:$("consent").checked};
  if(activeVoucherCode)payload.voucherCode=activeVoucherCode;
  return payload;
}
function showSuccess(r,payment){
  $("successOrderId").textContent=r.orderId;
  $("successTitle").textContent=payment==="QRIS"?"Konfirmasi pembayaran diterima":"Pesanan berhasil diterima";
  $("successPaymentNote").textContent=payment==="QRIS"?"Pembayaran QRIS menunggu verifikasi petugas. Pengantaran akan dikoordinasikan setelah obat dinyatakan READY oleh Instalasi Farmasi.":"Pembayaran tunai dicatat untuk pesanan ini. Pengantaran akan dikoordinasikan setelah obat dinyatakan READY oleh Instalasi Farmasi.";
  $("successWa").href=`https://wa.me/${C.PIC_WHATSAPP}?text=${encodeURIComponent(`Halo MEDIKA EKSPRES, saya sudah membuat order ${r.orderId} atas nama ${$("name").value.trim()}.`)}`;
  $("successModal").classList.remove("hidden");
}
async function createOrder(payment,button){
  const original=button?.textContent||""; if(button){button.disabled=true;button.textContent="Memproses…"}
  try{
    const r=await apiPost(buildOrderPayload(payment));
    if(r.duplicate){
      alert("Pesanan ini sudah pernah dikirim. Nomor: "+r.orderId);
      return false;
    }
    showSuccess(r,payment);
    return true;
  }catch(err){alert("Pesanan belum tersimpan: "+err.message);return false}
  finally{if(button){button.disabled=false;button.textContent=original}}
}
function updateQrisCountdown(){
  const m=String(Math.floor(qrisSeconds/60)).padStart(2,"0"),sec=String(qrisSeconds%60).padStart(2,"0");
  $("qrisCountdown").textContent=`${m}:${sec}`;
  if(qrisSeconds<=0){clearInterval(qrisTimer);qrisTimer=null;$("confirmQris").disabled=true;$("qrisStatus").textContent="Waktu pembayaran berakhir. Tutup halaman ini lalu pilih QRIS kembali untuk memulai ulang.";return}
  qrisSeconds--;
}
function openQris(){
  clearInterval(qrisTimer);qrisSeconds=600;$("qrisAmount").textContent=rupiah(livePatientPrice);$("confirmQris").disabled=false;$("qrisStatus").textContent="Setelah dikonfirmasi, pesanan dibuat dan pembayaran menunggu verifikasi petugas.";updateQrisCountdown();qrisTimer=setInterval(updateQrisCountdown,1000);$("qrisModal").classList.remove("hidden");
}
function closeQris(){clearInterval(qrisTimer);qrisTimer=null;$("qrisModal").classList.add("hidden")}
$("orderForm")?.addEventListener("submit",async e=>{
  e.preventDefault();if(!validateStep()||!roadDistanceVerified||!Number.isFinite(livePatientPrice)){alert("Lengkapi data, jarak, dan tarif terlebih dahulu.");return}
  const payment=document.querySelector('input[name="payment"]:checked')?.value;
  if(payment==="QRIS"){openQris();return}
  await createOrder(payment,$("sendOrder"));
});
$("confirmQris")?.addEventListener("click",async()=>{if(qrisSeconds<=0)return;const ok=await createOrder("QRIS",$("confirmQris"));if(ok)closeQris()});
$("closeQris")?.addEventListener("click",closeQris);
$("closeModal")?.addEventListener("click",()=>$("successModal").classList.add("hidden"));
initDepokAreas();renderFare();renderStep();
