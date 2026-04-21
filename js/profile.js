/**
 * GAMEVORA - Profile Logic (V7.1 Hybrid Weekly Pass & Real Statistics)
 * Fitur: Kalkulasi Riil Belanja, Inventory Game, Update Profil, & Hybrid Auto Pass Sync
 */

const SUPABASE_URL = 'https://meruqlvbymsaeaxybxaz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JpMK5MzO-awEkOOvr7t-xg_bBkobHLf';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * GENERATOR WEEKLY PASS OTOMATIS (Fallback)
 * Digunakan jika Admin tidak mengatur kode manual di database.
 */
function getWeeklyAutoPass() {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    const year = now.getFullYear();
    return `GV-${year}-W${weekNumber}`;
}

async function initProfile() {
    const { data: { user } } = await _supabase.auth.getUser();
    
    // Proteksi jika belum login
    if (!user) { 
        window.location.href = 'login.html'; 
        return; 
    }

    try {
        // 1. Ambil Data Profil, Library, dan Setting Manual secara paralel
        const [profileRes, libraryRes, settingsRes] = await Promise.all([
            _supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
            _supabase.from('library').select('*, games(*)').eq('user_id', user.id),
            _supabase.from('app_settings').select('value').eq('key', 'manual_weekly_pass').maybeSingle()
        ]);

        const profile = profileRes.data;
        const library = libraryRes.data || [];

        // 2. Logika Penentuan Weekly Pass (Hybrid)
        // Gunakan nilai dari database jika ada, jika null/kosong gunakan otomatis
        const manualPass = settingsRes.data?.value;
        const finalPass = manualPass && manualPass.trim() !== "" ? manualPass : getWeeklyAutoPass();

        // 3. Hitung Statistik & Pengeluaran Riil
        const totalOrders = library.length;
        const approvedGames = library.filter(item => item.status === 'approved');
        
        const totalSpending = approvedGames.reduce((acc, curr) => {
            const game = curr.games;
            if (game) {
                const activePrice = (game.discount_price > 0) ? game.discount_price : game.price;
                return acc + (activePrice || 0);
            }
            return acc;
        }, 0);

        // 4. Update UI Header
        const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=6D28D9&color=fff&size=256`;
        document.getElementById('display-name').innerText = profile?.full_name || user.email.split('@')[0];
        document.getElementById('display-email').innerText = user.email;
        document.getElementById('display-avatar').src = avatarUrl;
        
        // 5. Update UI Statistik
        document.getElementById('stat-orders').innerText = totalOrders;
        document.getElementById('stat-spending').innerText = new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR', 
            minimumFractionDigits: 0 
        }).format(totalSpending);
        
        const statGames = document.getElementById('stat-games');
        if (statGames) statGames.innerText = approvedGames.length;

        const countBadge = document.getElementById('inventory-count-badge');
        if (countBadge) countBadge.innerText = `${approvedGames.length} Items`;

        // 6. Isi Form Pengaturan
        if (document.getElementById('input-fullname')) document.getElementById('input-fullname').value = profile?.full_name || '';
        if (document.getElementById('input-username')) document.getElementById('input-username').value = profile?.username || '';
        if (document.getElementById('input-avatar-url')) document.getElementById('input-avatar-url').value = profile?.avatar_url || '';

        // 7. Render Inventory dengan Pass yang sudah ditentukan
        renderMyGames(approvedGames, finalPass);

    } catch (err) {
        console.error("Initialization Error:", err);
    }
}

/**
 * Merender daftar game ke UI dengan kode Pass dinamis
 */
function renderMyGames(games, currentPass) {
    const list = document.getElementById('my-games-list');
    if (!list) return;

    if (games.length === 0) {
        list.innerHTML = `
            <div class="text-center py-20 opacity-40">
                <p class="text-[10px] font-black uppercase italic tracking-widest">Belum ada game di vault anda.</p>
                <a href="index.html#store" class="text-[9px] text-purple-400 underline mt-2 block uppercase font-bold">Buka Store →</a>
            </div>`;
        return;
    }

    list.innerHTML = games.map(item => `
        <div class="glass-card p-5 rounded-[30px] border border-white/5 shadow-xl transition hover:border-purple-500/30 mb-4">
            <div class="flex items-center gap-5">
                <img src="${item.games.thumbnail}" class="w-16 h-16 rounded-2xl object-cover shadow-2xl">
                <div class="flex-grow">
                    <p class="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1">${item.games.genre || 'Digital Item'}</p>
                    <h4 class="font-black uppercase italic text-sm text-white">${item.games.title}</h4>
                </div>
                <div class="text-right">
                    <span class="text-[10px] font-black text-green-400 uppercase tracking-tighter">Granted</span>
                </div>
            </div>
            
            <div class="mt-4 p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                <div class="flex justify-between items-center">
                    <div class="min-w-0">
                        <p class="text-[7px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Active Weekly Pass</p>
                        <p class="text-xs font-mono font-black text-green-400 tracking-wider truncate">${currentPass}</p>
                    </div>
                    <button onclick="copyPass('${currentPass}')" class="bg-white text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-purple-600 hover:text-white transition active-scale shadow-lg flex-shrink-0 ml-4">
                        COPY
                    </button>
                </div>
                <div class="mt-3 flex items-center gap-2 opacity-50">
                    <div class="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                    <p class="text-[6px] font-bold text-gray-400 uppercase tracking-widest italic leading-none">
                        Verifikasi instalasi aktif untuk minggu ini
                    </p>
                </div>
            </div>
        </div>
    `).join('');
}

// Fungsi copy pass
window.copyPass = (code) => {
    navigator.clipboard.writeText(code);
    alert("Weekly Pass Berhasil di Copy! Gunakan kode ini untuk akses instalasi.");
};

// --- FUNGSI UPDATE PROFIL ---
const profileForm = document.getElementById('profile-form');
if (profileForm) {
    profileForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-profile');
        
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return alert("Sesi berakhir.");

        btn.innerText = "SAVING...";
        btn.disabled = true;

        try {
            const payload = {
                id: user.id,
                full_name: document.getElementById('input-fullname').value || null,
                username: document.getElementById('input-username').value || null,
                avatar_url: document.getElementById('input-avatar-url').value || null,
                updated_at: new Date().toISOString()
            };

            const { error } = await _supabase.from('profiles').upsert(payload);
            if (error) throw error;
            
            alert("Vault Profil berhasil diperbarui! 🚀");
            await initProfile(); 
        } catch (err) {
            alert("Gagal: " + err.message);
        } finally {
            btn.innerText = "Save Changes";
            btn.disabled = false;
        }
    };
}

// --- FUNGSI GANTI PASSWORD ---
const passwordForm = document.getElementById('password-form');
if (passwordForm) {
    passwordForm.onsubmit = async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;
        const btn = document.getElementById('btn-save-password');

        if (newPass !== confirmPass) {
            alert("Password tidak cocok!");
            return;
        }

        btn.innerText = "RESETTING...";
        btn.disabled = true;

        try {
            const { error } = await _supabase.auth.updateUser({ password: newPass });
            if (error) throw error;
            alert("Password berhasil diganti!");
            passwordForm.reset();
        } catch (err) {
            alert("Gagal: " + err.message);
        } finally {
            btn.innerText = "Update Password";
            btn.disabled = false;
        }
    };
}

document.addEventListener('DOMContentLoaded', initProfile);