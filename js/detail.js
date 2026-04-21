/**
 * GAMEVORA - Detail Logic (V18.0 Strict Anti-Fraud AI)
 * Fitur: AI OCR Verification, Unique Payment Code, & Hybrid Access Gate
 */

const SUPABASE_URL = 'https://meruqlvbymsaeaxybxaz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JpMK5MzO-awEkOOvr7t-xg_bBkobHLf'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const params = new URLSearchParams(window.location.search);
const gameId = params.get('id');

const loading = document.getElementById('loading');
const content = document.getElementById('content');
const modal = document.getElementById('payment-modal');

let currentGameData = null;
let currentStatus = null; 
let rejectionMsg = "";
let activeWeeklyPass = ""; 
let finalAmountAfterUniqueCode = 0; // Nominal sakral untuk verifikasi

// --- 1. WEEKLY PASS GENERATOR (OTOMATIS) ---
function getWeeklyAutoPass() {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    return `GV-${now.getFullYear()}-W${weekNumber}`;
}

// --- 2. INISIALISASI DATA UTAMA ---
async function loadGameDetail() {
    if (!gameId) { window.location.href = 'index.html'; return; }

    try {
        const [gameRes, settingsRes] = await Promise.all([
            _supabase.from('games').select('*').eq('id', gameId).single(),
            _supabase.from('app_settings').select('value').eq('key', 'manual_weekly_pass').maybeSingle()
        ]);

        if (gameRes.error || !gameRes.data) throw new Error("Game not found");
        currentGameData = gameRes.data;

        // Tentukan Pass aktif
        const manualPass = settingsRes.data?.value;
        activeWeeklyPass = (manualPass && manualPass.trim() !== "") ? manualPass : getWeeklyAutoPass();

        await checkLibraryStatus();
        renderUI(currentGameData);
        updateAccessUI();

    } catch (err) {
        console.error(err);
        window.location.href = 'index.html';
    } finally {
        if (loading) loading.classList.add('hidden');
        if (content) content.classList.remove('hidden');
    }
}

async function checkLibraryStatus() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;
    const { data: entry } = await _supabase.from('library').select('status, rejection_message').eq('user_id', user.id).eq('game_id', gameId).maybeSingle();
    if (entry) {
        currentStatus = entry.status;
        rejectionMsg = entry.rejection_message || "Bukti tidak valid.";
    }
}

function renderUI(game) {
    document.getElementById('game-title').innerText = game.title;
    document.getElementById('game-img').src = game.thumbnail;
    document.getElementById('game-desc').innerText = game.description;
    document.getElementById('genre-badge').innerText = game.genre || 'Digital Item';
    
    const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
    const basePrice = game.discount_price > 0 ? game.discount_price : game.price;
    
    // GENERATE NOMINAL UNIK (Anti-Fraud)
    const uniqueCode = Math.floor(Math.random() * 900) + 100; // 100 - 999
    finalAmountAfterUniqueCode = basePrice + uniqueCode;

    document.getElementById('game-price').innerText = basePrice === 0 ? "FREE" : formatter.format(basePrice);
    
    // Update Modal dengan Nominal Unik
    const modalTotal = document.getElementById('modal-total-price');
    if(modalTotal) modalTotal.innerText = formatter.format(finalAmountAfterUniqueCode);

    renderSpecs('min-spec', game.specifications?.minimum);
    renderSpecs('rec-spec', game.specifications?.recommended);
}

function renderSpecs(containerId, specObj) {
    const container = document.getElementById(containerId);
    if (!container || !specObj) return;
    container.innerHTML = `
        <li><span class="text-gray-500 uppercase text-[9px]">OS</span><br>${specObj.os || '-'}</li>
        <li><span class="text-gray-500 uppercase text-[9px]">CPU</span><br>${specObj.cpu || '-'}</li>
        <li><span class="text-gray-500 uppercase text-[9px]">RAM</span><br>${specObj.ram || '-'}</li>
        <li><span class="text-gray-500 uppercase text-[9px]">GPU</span><br>${specObj.gpu || '-'}</li>
    `;
}

// --- 3. VERIFICATION GATE LOGIC ---
window.verifyAccess = () => {
    const inputVal = document.getElementById('input-verify-pass').value.trim().toUpperCase();
    const gate = document.getElementById('verification-gate');
    const realLinks = document.getElementById('real-download-links');
    const container = document.getElementById('links-container');

    if (inputVal === activeWeeklyPass.toUpperCase()) {
        gate.classList.add('hidden');
        realLinks.classList.remove('hidden');
        container.innerHTML = '';
        currentGameData.download_links?.forEach(link => {
            container.innerHTML += `
                <a href="${link.url}" target="_blank" class="flex items-center justify-between bg-white/5 border border-white/5 p-5 rounded-3xl hover:bg-white hover:text-black transition-all group active-scale">
                    <div class="flex items-center gap-4">
                        <span class="text-2xl">🔗</span>
                        <div class="flex flex-col text-left">
                            <span class="text-[9px] font-black uppercase opacity-50">Secure Server</span>
                            <span class="text-xs font-bold uppercase">${link.label}</span>
                        </div>
                    </div>
                    <span class="text-xs font-black opacity-0 group-hover:opacity-100 transition mr-2">GET →</span>
                </a>`;
        });
    } else {
        alert("KODE SALAH!");
    }
};

// --- 4. BOT CHECKER & OCR SYSTEM ---
window.processStrictVerification = async (event) => {
    const btn = event.target;
    const fileInput = document.getElementById('payment-proof');
    const statusText = document.getElementById('ocr-status');
    const { data: { user } } = await _supabase.auth.getUser();

    if (!fileInput.files[0]) return alert("Unggah bukti bayar!");

    btn.innerText = "🕵️ BOT CHECKING...";
    btn.disabled = true;
    statusText.innerText = "AI is scanning your receipt...";
    statusText.classList.remove('hidden');

    try {
        const file = fileInput.files[0];

        // 1. AI SCANNING (Tesseract.js)
        const worker = await Tesseract.createWorker('eng'); // 'eng' cukup untuk angka
        const { data: { text } } = await worker.recognize(file);
        await worker.terminate();

        // 2. CLEANING DATA (Hanya ambil angka)
        const detectedDigits = text.replace(/[^0-9]/g, "");
        const targetString = finalAmountAfterUniqueCode.toString();

        console.log("OCR Result:", detectedDigits);
        console.log("Target:", targetString);

        // 3. STRICT VALIDATION
        if (detectedDigits.includes(targetString)) {
            statusText.innerText = "✅ NOMINAL VALIDATED!";
            btn.innerText = "UPLOADING PROOF...";
            await finalizePayment(file, user, 'approved');
        } else {
            statusText.innerText = "❌ NOMINAL MISMATCH!";
            alert(`SISTEM MENOLAK: Nominal ${targetString} tidak ditemukan pada bukti transfer. Harap upload ulang bukti yang benar.`);
            btn.innerText = "Validate & Confirm";
            btn.disabled = false;
        }

    } catch (err) {
        console.error(err);
        alert("AI Bot Error. Silakan coba lagi atau pastikan gambar jelas.");
        btn.innerText = "Validate & Confirm";
        btn.disabled = false;
    }
};

async function finalizePayment(file, user, statusType) {
    const filePath = `proofs/proof_${Date.now()}_${user.id.substring(0, 5)}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await _supabase.storage.from('game-assets').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = _supabase.storage.from('game-assets').getPublicUrl(filePath);
    
    await _supabase.from('library').upsert([{ 
        user_id: user.id, 
        game_id: gameId, 
        status: statusType, 
        proof_url: urlData.publicUrl 
    }], { onConflict: 'user_id, game_id' });

    alert("Transaksi Berhasil! Vault Anda telah terbuka secara otomatis. 🚀");
    location.reload();
}

// --- UI HELPERS ---
function updateAccessUI() {
    const actionArea = document.getElementById('action-area');
    if (currentStatus === 'approved') {
        document.getElementById('download-section').classList.remove('hidden');
        actionArea.innerHTML = `<div class="bg-green-500/10 text-green-400 p-6 rounded-[32px] text-center border border-green-500/20">Verified ✔</div>`;
    } else if (currentStatus === 'pending') {
        actionArea.innerHTML = `<div class="bg-yellow-500/10 text-yellow-500 p-6 rounded-[32px] text-center">⌛ Verifying...</div>`;
    }
}

window.handleBuy = async () => {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return window.location.href = 'login.html';
    modal.classList.remove('hidden');
};

window.selectMethod = (name, icon) => {
    document.getElementById('payment-step-1').classList.add('hidden');
    document.getElementById('payment-step-2').classList.remove('hidden');
    document.getElementById('selected-method-title').innerText = name;
    document.getElementById('method-icon').innerText = icon;
};

window.resetPaymentStep = () => {
    document.getElementById('payment-step-1').classList.remove('hidden');
    document.getElementById('payment-step-2').classList.add('hidden');
};

window.closeModal = () => { if (modal) modal.classList.add('hidden'); resetPaymentStep(); };

document.addEventListener('DOMContentLoaded', loadGameDetail);