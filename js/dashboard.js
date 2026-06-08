/**
 * GAMEVORA - Dashboard Logic (V17.0 - Full Integrated)
 * Fitur: Instant Search, Status Sync, Rejection Message, Banned Check & Lock Animation
 */

const SUPABASE_URL = 'https://meruqlvbymsaeaxybxaz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JpMK5MzO-awEkOOvr7t-xg_bBkobHLf'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const libraryList = document.getElementById('library-list');
const searchInput = document.getElementById('search-library');
const downloadModal = document.getElementById('download-modal');
const lockModal = document.getElementById('dashboard-lock-modal');
const linksContainer = document.getElementById('links-container');
const modalTitle = document.getElementById('modal-title');
const dashVerifyInput = document.getElementById('dash-verify-pass');
const btnUnlockDash = document.getElementById('btn-unlock-dash');

// State Global
let allLibraryData = []; 
let currentActiveGameId = null;

// --- 1. WEEKLY PASS GENERATOR (OTOMATIS) ---
function getWeeklyAutoPass() {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    const year = now.getFullYear();
    return `GV-${year}-W${weekNumber}`;
}

/**
 * 2. Load Data Library dari Database
 */
async function loadLibrary() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Cek status banned user terlebih dahulu
        const { data: profile } = await _supabase.from('profiles').select('is_banned').eq('id', user.id).single();
        if (profile?.is_banned) {
            alert("AKUN ANDA DINONAKTIFKAN.");
            await _supabase.auth.signOut();
            window.location.href = 'index.html';
            return;
        }

        const { data: libraryData, error } = await _supabase
            .from('library')
            .select(`
                status,
                rejection_message,
                games ( id, title, thumbnail, genre )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // ISI DATA KE VARIABEL GLOBAL UNTUK SEARCH
        allLibraryData = libraryData || [];

        if (allLibraryData.length === 0) {
            libraryList.innerHTML = `
                <div class="col-span-full text-center py-24 border border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                    <div class="text-4xl mb-4 opacity-20">📂</div>
                    <p class="text-gray-600 font-bold uppercase tracking-widest text-[10px] italic">Koleksi Vault kamu masih kosong.</p>
                    <a href="index.html" class="inline-block mt-6 px-8 py-3 bg-white text-black rounded-full font-black text-[9px] uppercase tracking-widest active-scale">Mulai Belanja</a>
                </div>`;
            return;
        }

        renderLibrary(allLibraryData);

    } catch (err) {
        console.error("Dashboard Error:", err);
        libraryList.innerHTML = `<p class="col-span-full text-center text-red-500 uppercase text-[10px] font-black">Database Connection Interrupted</p>`;
    }
}

/**
 * 3. Render Kartu Game ke UI
 */
function renderLibrary(items) {
    if (!libraryList) return;
    libraryList.innerHTML = '';
    
    if (items.length === 0) {
        libraryList.innerHTML = `<div class="col-span-full text-center py-20 opacity-30 text-[10px] font-black uppercase tracking-[0.4em] italic text-white">No Matching Records Found</div>`;
        return;
    }

    items.forEach(item => {
        const game = item.games;
        if (!game) return;

        const isApproved = item.status === 'approved';
        const isPending = item.status === 'pending';
        const isRejected = item.status === 'rejected';

        let badgeClass = isApproved ? 'badge-approved' : (isPending ? 'badge-pending' : 'badge-rejected');
        let badgeText = isApproved ? '✔ Access Granted' : (isPending ? '⌛ Verifying...' : '❌ Access Denied');

        let btnAction = '';
        if (isApproved) {
            btnAction = `<button onclick="handleVaultGate('${game.id}')" class="w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all active-scale shadow-xl">Open Vault 🔓</button>`;
        } else if (isRejected) {
            btnAction = `
                <div class="space-y-3">
                    <p class="text-[8px] text-center text-red-500/60 uppercase font-black italic">Reason: "${item.rejection_message || 'Invalid Proof'}"</p>
                    <a href="detail.html?id=${game.id}" class="block text-center w-full py-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase active-scale">Fix Issue</a>
                </div>`;
        } else {
            btnAction = `<button disabled class="w-full py-4 rounded-2xl bg-white/5 text-gray-600 text-[10px] font-black uppercase tracking-widest cursor-wait">Processing...</button>`;
        }

        libraryList.innerHTML += `
            <div class="game-card rounded-[40px] overflow-hidden flex flex-col group animate-fade-in">
                <div class="aspect-square relative overflow-hidden bg-white/[0.02]">
                    <img src="${game.thumbnail}" class="w-full h-full object-cover transition duration-1000 ${isApproved ? 'group-hover:scale-110' : 'grayscale opacity-40'}">
                    <div class="absolute top-5 left-5">
                        <span class="px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border backdrop-blur-xl ${badgeClass}">
                            ${badgeText}
                        </span>
                    </div>
                </div>
                <div class="p-8 flex flex-col flex-1 bg-gradient-to-b from-transparent to-white/[0.01]">
                    <span class="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-2 opacity-60">${game.genre || 'License'}</span>
                    <h3 class="text-xl font-black italic tracking-tighter uppercase mb-8 line-clamp-1 text-white">${game.title}</h3>
                    <div class="mt-auto">${btnAction}</div>
                </div>
            </div>`;
    });
}

/**
 * 4. LOGIKA SEARCH (Instant Client-side Filtering)
 */
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        const filteredData = allLibraryData.filter(item => {
            const title = item.games?.title?.toLowerCase() || "";
            const genre = item.games?.genre?.toLowerCase() || "";
            return title.includes(keyword) || genre.includes(keyword);
        });
        renderLibrary(filteredData);
    });
}

/**
 * 5. Pintu Gerbang (Verification Gate)
 */
window.handleVaultGate = async (gameId) => {
    currentActiveGameId = gameId;

    const { data: settings } = await _supabase.from('app_settings').select('value').eq('key', 'manual_weekly_pass').maybeSingle();
    const currentCorrectPass = (settings && settings.value) ? settings.value.toUpperCase() : getWeeklyAutoPass().toUpperCase();

    const savedPass = sessionStorage.getItem('dash_unlocked_session');

    if (savedPass === currentCorrectPass) {
        openRealVault(gameId);
    } else {
        // Tampilkan modal lock
        lockModal.classList.remove('hidden');
        lockModal.classList.add('flex');
        dashVerifyInput.focus();
    }
};

window.closeLockModal = () => {
    lockModal.classList.add('hidden');
    lockModal.classList.remove('flex');
    dashVerifyInput.value = "";
    // Reset visual ikon gembok ke terkunci
    const lockEmoji = document.querySelector('#dashboard-lock-modal .lock-emoji');
    const lockIconContainer = document.querySelector('#dashboard-lock-modal .lock-icon-container');
    if(lockEmoji) lockEmoji.innerText = "🔐";
    if(lockIconContainer) {
        lockIconContainer.className = "lock-icon-container w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-500/20 text-2xl transition-all duration-500";
    }
};

// Eksekusi Tombol Unlock dengan Animasi Gembok
if (btnUnlockDash) {
    btnUnlockDash.onclick = async () => {
        const inputVal = dashVerifyInput.value.trim().toUpperCase();
        const lockEmoji = document.querySelector('#dashboard-lock-modal .lock-emoji');
        const lockIconContainer = document.querySelector('#dashboard-lock-modal .lock-icon-container');
        
        btnUnlockDash.innerText = "VERIFYING...";
        
        const { data: settings } = await _supabase.from('app_settings').select('value').eq('key', 'manual_weekly_pass').maybeSingle();
        const currentCorrectPass = (settings && settings.value) ? settings.value.toUpperCase() : getWeeklyAutoPass().toUpperCase();

        if (inputVal === currentCorrectPass) {
            // EFEK VISUAL: Gembok Terbuka
            if (lockEmoji) lockEmoji.innerText = "🔓";
            if (lockIconContainer) {
                lockIconContainer.classList.remove('bg-purple-500/10', 'border-purple-500/20');
                lockIconContainer.classList.add('bg-green-500/20', 'border-green-500/40', 'scale-110');
            }
            
            btnUnlockDash.innerText = "ACCESS GRANTED!";
            btnUnlockDash.className = "w-full bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest";

            sessionStorage.setItem('dash_unlocked_session', currentCorrectPass);

            // Jeda agar user melihat animasi gembok terbuka
            setTimeout(() => {
                lockModal.classList.add('hidden');
                lockModal.classList.remove('flex');
                openRealVault(currentActiveGameId);
            }, 800);
        } else {
            // Animasi Bounce jika salah
            if (lockIconContainer) {
                lockIconContainer.classList.add('animate-bounce');
                setTimeout(() => lockIconContainer.classList.remove('animate-bounce'), 500);
            }
            alert("KODE SALAH! Cek Weekly Pass terbaru di Profile Vault anda.");
            btnUnlockDash.innerText = "Confirm Access";
        }
    };
}

/**
 * 6. Real Vault Content (Link Download)
 */
async function openRealVault(gameId) {
    const { data: game, error } = await _supabase.from('games').select('title, download_links').eq('id', gameId).single();

    if (error || !game) return alert("Gagal mengambil data akses.");

    modalTitle.innerText = game.title;
    linksContainer.innerHTML = '';
    const icons = { box: "📦", tool: "🛠️", fix: "🔧", book: "📖", link: "🔗" };

    if (game.download_links && game.download_links.length > 0) {
        game.download_links.forEach(link => {
            linksContainer.innerHTML += `
                <a href="${link.url}" target="_blank" class="flex items-center justify-between bg-white/[0.03] border border-white/5 p-5 rounded-2xl hover:bg-white hover:text-black transition-all group active-scale">
                    <div class="flex items-center gap-4">
                        <span class="text-2xl transition-transform group-hover:scale-110">${icons[link.icon] || "🔗"}</span>
                        <div class="flex flex-col text-left">
                            <span class="text-[8px] font-black uppercase tracking-widest opacity-40">Secured Server</span>
                            <span class="text-[12px] font-bold uppercase tracking-tight text-inherit">${link.label || 'Download'}</span>
                        </div>
                    </div>
                    <span class="text-[10px] font-black opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">GET →</span>
                </a>`;
        });
    } else {
        linksContainer.innerHTML = `<p class="text-center text-gray-500 py-6 italic text-[10px] uppercase font-black">Link belum tersedia di database.</p>`;
    }

    downloadModal.classList.remove('hidden');
    downloadModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

window.closeDownloadModal = () => {
    downloadModal.classList.add('hidden');
    downloadModal.classList.remove('flex');
    document.body.style.overflow = '';
};

// Jalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', loadLibrary);