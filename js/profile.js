/**
 * GAMEVORA - Profile Logic (V145.5 Ultimate Fix)
 * Fitur: Weekly Pass Sync, Automated Order Tracking, Wishlist Sync, 
 * Password Update, Profile Sync, & Manual Guide Integration.
 */

const SUPABASE_URL = 'https://meruqlvbymsaeaxybxaz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JpMK5MzO-awEkOOvr7t-xg_bBkobHLf';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 1. GENERATOR WEEKLY PASS OTOMATIS (ISO-8601 Fallback)
 */
function getWeeklyAutoPass() {
    const target = new Date();
    const dayNr = (target.getDay() + 6) % 7; 
    target.setDate(target.getDate() - dayNr + 3); 
    const firstThursday = target.valueOf(); 
    target.setMonth(0, 1); 
    if (target.getDay() !== 4) { target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7); } 
    const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
    return `GV-${target.getFullYear()}-W${weekNumber}`;
}

/**
 * 2. INISIALISASI UTAMA PROFIL
 */
async function initProfile() {
    const { data: { user } } = await _supabase.auth.getUser();
    
    if (!user) { 
        window.location.href = 'login.html'; 
        return; 
    }

    try {
        // Ambil Data Profil, Library, Settings, dan Orders secara paralel
        const [profileRes, libraryRes, settingsRes, ordersRes] = await Promise.all([
            _supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
            _supabase.from('library').select('*, games(*)').eq('user_id', user.id).eq('status', 'approved'),
            _supabase.from('settings').select('value').eq('key', 'manual_weekly_pass').maybeSingle(),
            _supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        ]);

        const profile = profileRes.data;
        const library = libraryRes.data || [];
        const orders = ordersRes.data || [];

        // --- UPDATE UI IDENTITY ---
        const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=6D28D9&color=fff&size=256`;
        if (document.getElementById('display-name')) document.getElementById('display-name').innerText = profile?.full_name || user.email.split('@')[0];
        if (document.getElementById('display-email')) document.getElementById('display-email').innerText = user.email;
        if (document.getElementById('display-avatar')) document.getElementById('display-avatar').src = avatarUrl;

        // Weekly Pass Logic
        const manualPass = settingsRes.data?.value;
        if (document.getElementById('display-weekly-pass')) {
            document.getElementById('display-weekly-pass').innerText = (manualPass && manualPass.trim() !== "") ? manualPass : getWeeklyAutoPass();
        }

        // --- UPDATE UI STATISTIK UTAMA ---
        // 1. Total Orders (Menghitung jumlah baris di tabel orders)
        if (document.getElementById('stat-orders')) {
            document.getElementById('stat-orders').innerText = orders.length;
        }

        // 2. Total Spending (Hanya hitung yang statusnya 'success')
        const totalSpending = orders
            .filter(o => o.status === 'success')
            .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

        if (document.getElementById('stat-spending')) {
            document.getElementById('stat-spending').innerText = new Intl.NumberFormat('id-ID', { 
                style: 'currency', currency: 'IDR', minimumFractionDigits: 0 
            }).format(totalSpending);
        }

        // 3. Collection (Dari tabel library)
        if (document.getElementById('stat-games')) {
            document.getElementById('stat-games').innerText = library.length;
        }

        // --- SYNC FORM PENGATURAN ---
        if (document.getElementById('input-fullname')) document.getElementById('input-fullname').value = profile?.full_name || '';
        if (document.getElementById('input-username')) document.getElementById('input-username').value = profile?.username || '';
        if (document.getElementById('input-avatar-url')) document.getElementById('input-avatar-url').value = profile?.avatar_url || '';

        // --- RENDER SEMUA LIST ---
        renderMyGames(library);
        renderOrderHistory(orders);
        fetchWishlist(user.id);

    } catch (err) {
        console.error("Vault Sync Error:", err);
    }
}

/**
 * 3. RENDER GAME INVENTORY & TUTORIAL
 */
function renderMyGames(library) {
    const list = document.getElementById('my-games-list');
    if (!list) return;

    if (library.length === 0) {
        list.innerHTML = `<div class="opacity-30 text-center py-10 text-[10px] font-black uppercase italic text-white">No collection found in vault</div>`;
        return;
    }

    list.innerHTML = library.map(item => `
        <div class="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5 animate-fade-in mb-2">
            <div class="flex items-center gap-4 text-left">
                <img src="${item.games?.thumbnail}" class="w-12 h-12 rounded-xl object-cover shadow-lg border border-white/10">
                <div class="text-left">
                    <h5 class="text-[11px] font-black uppercase text-white leading-tight">${item.games?.title || 'Unknown Asset'}</h5>
                    <p class="text-[8px] text-purple-400 font-bold uppercase mt-1 tracking-widest">Vault Granted</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="showTutorial('${item.games?.id}')" class="px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-full font-black text-[8px] uppercase border border-yellow-500/20 active-scale">Tutorial</button>
                <a href="dashboard.html" class="px-4 py-2 bg-white text-black rounded-full font-black text-[8px] uppercase active-scale">Access</a>
            </div>
        </div>
    `).join('');
}

/**
 * 4. FUNGSI TAMPILKAN MANUAL GUIDE (TUTORIAL)
 */
window.showTutorial = async (gameId) => {
    try {
        const { data: game, error } = await _supabase.from('games').select('title, manual_guide').eq('id', gameId).single();
        if (error) throw error;

        const modal = document.getElementById('tutorial-modal');
        const content = document.getElementById('tutorial-content');
        const title = document.getElementById('tutorial-title');

        if (modal && content && title) {
            title.innerText = `MANUAL: ${game.title}`;
            content.innerText = game.manual_guide || "Hunter, admin belum menulis panduan instalasi untuk arsip ini.";
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else {
            alert(game.manual_guide || "No tutorial available.");
        }
    } catch (err) {
        alert("Failed to load guide signal.");
    }
};

/**
 * 5. RENDER RIWAYAT TRANSAKSI (AUTOMATED ORDER TRACKING)
 */
function renderOrderHistory(orders) {
    const container = document.getElementById('transaction-list');
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = `<tr><td colspan="4" class="py-10 text-center opacity-20 text-[10px] font-black uppercase italic tracking-widest text-white">No Signals Detected</td></tr>`;
        return;
    }

    container.innerHTML = orders.map(order => {
        let statusCol = order.status === 'success' ? 'text-green-500 bg-green-500/10' : (order.status === 'pending' ? 'text-yellow-500 bg-yellow-500/10' : 'text-red-500 bg-red-500/10');
        return `
        <tr class="hover:bg-white/[0.01] transition-all border-b border-white/[0.02]">
            <td class="py-5 px-2 font-mono text-[9px] text-gray-500 uppercase tracking-tighter">#GV-${order.id.split('-')[0].toUpperCase()}</td>
            <td class="py-5 px-2 text-left">
                <p class="text-[10px] font-black uppercase text-white truncate max-w-[150px] leading-none">${order.item_name || 'Package Archive'}</p>
                <p class="text-[8px] font-bold text-purple-400 mt-1">Rp ${Number(order.amount).toLocaleString('id-ID')}</p>
            </td>
            <td class="py-5 px-2 text-center">
                <span class="px-2 py-1 rounded text-[7px] font-black border border-current uppercase ${statusCol}">${order.status}</span>
            </td>
            <td class="py-5 px-2 text-right text-[8px] font-bold text-gray-600 uppercase">
                ${new Date(order.created_at).toLocaleDateString('id-ID')}
            </td>
        </tr>`;
    }).join('');
}

/**
 * 6. FETCH WISHLIST (DARI TABEL CART)
 */
async function fetchWishlist(userId) {
    const container = document.getElementById('wishlist-list');
    if (!container) return;

    const { data: wishlist, error } = await _supabase
        .from('cart')
        .select('*, games(*)')
        .eq('user_id', userId);

    if (error || !wishlist || wishlist.length === 0) {
        container.innerHTML = `<div class="opacity-30 text-center py-10 text-[10px] font-black uppercase italic text-white">Wishlist is empty</div>`;
        return;
    }

    container.innerHTML = wishlist.map(item => `
        <div class="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5 mb-2 text-left animate-fade-in">
            <div class="flex items-center gap-4 text-left">
                <img src="${item.games?.thumbnail}" class="w-10 h-10 rounded-xl object-cover border border-white/5">
                <div class="text-left">
                    <h4 class="text-[10px] font-black uppercase text-white leading-tight">${item.games?.title || 'Unknown Item'}</h4>
                    <p class="text-[8px] text-pink-500 font-bold uppercase mt-0.5">Stored in Cart</p>
                </div>
            </div>
            <button onclick="location.href='index.html'" class="px-4 py-2 bg-white text-black rounded-xl text-[8px] font-black uppercase active-scale shadow-lg">VIEW</button>
        </div>
    `).join('');
}

/**
 * 7. UPDATE PROFIL (IDENTITY SYNC)
 */
window.saveProfile = async () => {
    const btn = document.getElementById('btn-save-profile');
    const { data: { user } } = await _supabase.auth.getUser();
    
    if (!user) return;
    
    const fullName = document.getElementById('input-fullname').value.trim();
    const username = document.getElementById('input-username').value.trim();
    const avatarUrl = document.getElementById('input-avatar-url').value.trim();

    if(!fullName) return alert("Full Name cannot be empty!");

    btn.innerText = "SYNCING..."; btn.disabled = true;

    const payload = {
        id: user.id,
        full_name: fullName,
        username: username,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
    };

    const { error } = await _supabase.from('profiles').upsert(payload);
    
    if (!error) {
        alert("Vault Identity Synchronized! 🚀");
        initProfile(); 
    } else {
        alert("Sync Error: " + error.message);
    }
    btn.innerText = "Save Profile"; btn.disabled = false;
};

/**
 * 8. UPDATE PASSWORD (SECURITY GATE)
 */
window.updatePassword = async () => {
    const p1 = document.getElementById('new-password').value;
    const p2 = document.getElementById('confirm-password').value;

    if (!p1 || p1 !== p2) return alert("Passwords do not match!");
    if (p1.length < 6) return alert("Password too weak (Min 6 chars)!");

    try {
        const { error } = await _supabase.auth.updateUser({ password: p1 });
        if (error) throw error;

        alert("Security Key Updated! ✅");
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    } catch (err) {
        alert("Security Error: " + err.message);
    }
};

/**
 * 9. LOGOUT HANDLER (SESSION DESTRUCTION)
 */
window.handleLogout = async () => {
    if(!confirm("Destroy this session and logout from vault?")) return;
    await _supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'index.html';
};

/**
 * 10. MODAL HELPERS
 */
window.closeTutorial = () => {
    const modal = document.getElementById('tutorial-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
    initProfile();
    const saveBtn = document.getElementById('btn-save-profile');
    if (saveBtn) saveBtn.onclick = window.saveProfile;
});