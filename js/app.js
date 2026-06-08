/**
 * GAMEVORA - Master App Logic (V99.5 Ultimate Master)
 * FIX: setupHeroSlider Definition, Smart Pagination (20 Items/Page), 
 * ISO Weekly Pass, Stable Inbox, Grid Rating, Scheduled Release.
 */

const SUPABASE_URL = 'https://meruqlvbymsaeaxybxaz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JpMK5MzO-awEkOOvr7t-xg_bBkobHLf'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const gameContainer = document.getElementById('game-list');
const searchInput = document.getElementById('search-input');
const authPlaceholder = document.getElementById('auth-placeholder');
const adminLink = document.getElementById('admin-link');
const adminMobileLink = document.getElementById('admin-link-mobile');
const cartBadge = document.getElementById('cart-badge');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalPriceLabel = document.getElementById('cart-total-price');
const paginationContainer = document.getElementById('pagination-container');

// State Management
let currentFilter = 'all';
let currentPage = 1;
const itemsPerPage = 20; 

// --- 1. SESSION & AUTH MANAGEMENT ---
async function checkSession() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (user) {
            const { data: profile } = await _supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
            
            if (profile?.is_banned) {
                alert("AKUN ANDA DINONAKTIFKAN.");
                await _supabase.auth.signOut();
                window.location.href = 'index.html';
                return;
            }

            // Admin Whitelist Detection
            const isAdmin = ["raflyalfazari622@gmail.com", "fadhilakbar050@gmail.com"].includes(user.email);
            if (isAdmin) {
                if (adminLink) adminLink.classList.remove('hidden');
                if (adminMobileLink) {
                    adminMobileLink.classList.remove('hidden');
                    adminMobileLink.classList.add('flex');
                }
            }

            if (authPlaceholder) {
                const avatarImg = profile?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=6D28D9&color=fff`;
                authPlaceholder.innerHTML = `
                    <div class="flex items-center gap-4 text-white relative z-[2000]" style="pointer-events: auto;">
                        <a href="profile.html" class="flex items-center gap-2 group active-scale cursor-pointer">
                            <div class="w-8 h-8 rounded-full bg-purple-600 border border-white/10 overflow-hidden shadow-lg group-hover:border-purple-400 transition-all text-white text-left">
                                 <img src="${avatarImg}" class="w-full h-full object-cover">
                            </div>
                            <div class="hidden sm:flex flex-col items-start leading-none text-left">
                                <span class="text-[9px] text-gray-400 font-black uppercase tracking-widest group-hover:text-white transition">${profile?.full_name || 'Hunter'}</span>
                                <span class="text-[7px] text-purple-500 font-bold uppercase mt-1">My Vault</span>
                            </div>
                        </a>
                        <button onclick="handleLogout()" class="text-[10px] font-black text-red-500 uppercase border border-red-500/20 px-3 py-1.5 rounded-full hover:bg-red-500 hover:text-white transition-all active-scale">Logout</button>
                    </div>`;
            }
            updateCartBadge();
            loadChatHistory();
            updateInboxBadge();
            subscribeToNotifications(user.id);
        }
    } catch (e) { console.log("Guest Mode Active"); }
}

window.handleLogout = async () => {
    if(!confirm("Keluar dari Vault?")) return;
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
};

// --- 2. GRID RENDERING & SMART PAGINATION ---
const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

async function fetchGames(keyword = '') {
    if (!gameContainer) return;
    gameContainer.innerHTML = '<div class="col-span-full text-center py-20 opacity-50 uppercase text-[10px] font-black animate-pulse text-white text-left">Accessing Vault...</div>';

    try {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        let query = _supabase.from('games').select('*, reviews(rating)', { count: 'exact' })
            .order('is_trending', { ascending: false })
            .order('created_at', { ascending: false });

        if (currentFilter === 'trending') query = query.eq('is_trending', true);
        else if (['Online', 'Offline'].includes(currentFilter)) query = query.eq('connectivity_type', currentFilter);
        else if (currentFilter !== 'all') query = query.ilike('genre', `%${currentFilter}%`);
        
        if (keyword) query = query.ilike('title', `%${keyword}%`);

        const { data: games, count, error } = await query.range(from, to);
        if (error) throw error;

        // Release Logic Filter
        const { data: settings } = await _supabase.from('settings').select('*');
        const releaseTimeStr = settings.find(s => s.key === 'release_time')?.value;
        const now = new Date();
        const target = new Date();
        if (releaseTimeStr) {
            const [h, m, s] = releaseTimeStr.split(':');
            target.setHours(h, m, s || 0);
        }

        const filteredGames = games.filter(g => {
            if (g.release_type === 'scheduled') return now.getTime() >= target.getTime();
            return true;
        });

        // Sync Hero Slider
        if (currentPage === 1 && !keyword && currentFilter === 'all') setupHeroSlider(filteredGames);
        
        renderGamesGrid(filteredGames);
        renderPaginationUI(count); 
    } catch (err) { 
        console.error(err); 
        gameContainer.innerHTML = `<p class="col-span-full text-center py-20 opacity-30 text-[10px] text-white">Transmission Error</p>`;
    }
}

// FIX: Fungsi Hero Slider yang didefinisikan secara utuh
function setupHeroSlider(games) {
    const wrapper = document.getElementById('hero-wrapper');
    if (!wrapper) return;
    const trending = games.filter(g => g.is_trending).slice(0, 3);
    if (trending.length === 0) return;

    wrapper.innerHTML = trending.map((game, index) => `
        <div class="hero-slide ${index === 0 ? 'active' : ''}">
            <img src="${game.thumbnail}" class="w-full h-full object-cover">
            <div class="absolute inset-0 hero-overlay flex flex-col justify-end px-8 md:px-20 pb-20 text-white text-left">
                <span class="text-purple-500 font-black uppercase tracking-[0.5em] text-[10px] mb-2 text-white">🔥 Trending Now</span>
                <h1 class="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 leading-none text-white">${game.title.replace(" ", "<br>")}</h1>
                <p class="max-w-md text-gray-300 text-sm font-medium leading-relaxed mb-8 line-clamp-2 text-white">${game.description || 'Secure encrypted vault access.'}</p>
                <a href="detail.html?id=${game.id}" class="w-fit bg-purple-600 px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest active-scale shadow-[0_0_40px_rgba(168,85,247,0.4)] text-white">View Vault</a>
            </div>
        </div>
    `).join('');
}

function renderGamesGrid(games) {
    if (!gameContainer) return;
    gameContainer.innerHTML = (!games || games.length === 0) ? `<div class="col-span-full text-center py-20 opacity-50 uppercase text-[10px] font-black text-white text-left">No items found</div>` : '';
    
    games?.forEach(game => {
        const priceFinal = game.discount_price > 0 ? game.discount_price : game.price;
        const ratings = game.reviews || [];
        const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1) : "0.0";
        
        const trendingLabel = game.is_trending ? `<div class="bg-red-600 text-white text-[7px] font-black px-2 py-1 rounded-md mb-2 w-fit uppercase animate-pulse">🔥 Trending</div>` : '';
        const saleBadge = game.discount_price > 0 ? `<div class="absolute top-4 left-4 z-10 bg-purple-600 text-white text-[8px] font-black px-3 py-1.5 rounded-full shadow-xl">SALE</div>` : '';

        const connIcon = game.connectivity_type === 'Online' 
            ? `<div class="bg-blue-600/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-lg text-white"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg></div>`
            : `<div class="bg-green-600/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-lg text-white"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18.364 5.636a9 9 0 010 12.728m0-12.728L5.636 18.364m12.728 0a9 9 0 01-12.728 0m12.728 0L5.636 5.636m0 0a9 9 0 0112.728 0"></path></svg></div>`;

        gameContainer.innerHTML += `
            <div class="group relative bg-white/[0.03] border border-white/5 rounded-[35px] overflow-hidden hover:border-purple-500/30 transition-all duration-500 shadow-xl animate-fade-in text-white text-left">
                <div class="aspect-[4/5] relative overflow-hidden bg-black/40 w-full cursor-pointer" onclick="location.href='detail.html?id=${game.id}'">
                    <img src="${game.thumbnail}" loading="lazy" class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-90"></div>
                    ${saleBadge}
                    <div class="absolute top-4 right-4 z-10 text-white">${connIcon}</div>
                </div>
                <div class="p-6 text-white text-left">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[8px] font-black text-purple-500 uppercase tracking-widest opacity-60">${game.genre || 'License'}</span>
                        <div class="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg">
                            <svg class="w-2 h-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            <span class="text-[8px] font-black text-white">${avgRating}</span>
                        </div>
                    </div>
                    ${trendingLabel}
                    <h3 class="font-black text-sm mb-3 uppercase tracking-tighter line-clamp-1 text-white">${game.title}</h3>
                    <div class="mb-5 text-white">
                        <span class="text-xl font-black italic tracking-tight text-white">${formatRupiah(priceFinal)}</span>
                        ${game.discount_price > 0 ? `<span class="text-[10px] text-gray-500 line-through ml-2">${formatRupiah(game.price)}</span>` : ''}
                    </div>
                    <button onclick="addToCart('${game.id}')" class="w-full bg-white text-black py-3.5 rounded-xl text-[9px] font-black uppercase hover:bg-purple-600 hover:text-white transition-all active-scale">Add to Cart 🛒</button>
                </div>
            </div>`;
    });
}

// LOGIKA PAGINATION PROFESIONAL (SESUAI GAMBAR)
function renderPaginationUI(totalItems) {
    if (!paginationContainer) return;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) { paginationContainer.innerHTML = ''; return; }

    let html = '';

    // Tombol Sebelumnya
    html += `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} 
            class="flex items-center gap-2 px-6 py-4 rounded-[20px] bg-white/5 border border-white/10 text-[10px] font-black uppercase text-gray-400 transition-all active-scale disabled:opacity-10">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="3" d="M15 19l-7-7 7-7"></path></svg>
            Sebelumnya
        </button>`;

    // Generate Array Halaman
    const pages = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) pages.push(i);
        }

        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }

    // Render Tombol Nomor
    pages.forEach(p => {
        if (p === '...') {
            html += `<span class="px-2 text-gray-600 font-black">...</span>`;
        } else {
            html += `
                <button onclick="changePage(${p})" 
                    class="w-12 h-12 rounded-[18px] text-[11px] font-black transition-all active-scale 
                    ${p === currentPage ? 'bg-[#ff0080] text-white shadow-[0_0_20px_rgba(255,0,128,0.5)]' : 'bg-white/5 border border-white/10 text-gray-500 hover:text-white'}">
                    ${p}
                </button>`;
        }
    });

    // Tombol Selanjutnya
    html += `
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} 
            class="flex items-center gap-2 px-6 py-4 rounded-[20px] bg-white/5 border border-white/10 text-[10px] font-black uppercase text-gray-400 transition-all active-scale disabled:opacity-10">
            Selanjutnya
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="3" d="M9 5l7 7-7 7"></path></svg>
        </button>`;

    paginationContainer.innerHTML = html;
}

window.changePage = (page) => { 
    currentPage = page; 
    fetchGames(searchInput?.value || ''); 
    const storeEl = document.getElementById('store');
    if(storeEl) window.scrollTo({ top: storeEl.offsetTop - 100, behavior: 'smooth' }); 
};

// --- 3. WEEKLY PASS SYSTEM (ISO LOGIC) ---
function getWeeklyISO() {
    const target = new Date();
    const dayNr = (target.getDay() + 6) % 7; 
    target.setDate(target.getDate() - dayNr + 3); 
    const firstThursday = target.valueOf(); 
    target.setMonth(0, 1); 
    if (target.getDay() !== 4) { target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7); } 
    const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
    return `GV-${target.getFullYear()}-W${weekNumber}`;
}

window.checkVaultAccess = async (userInput) => {
    try {
        const { data } = await _supabase.from('settings').select('value').eq('key', 'manual_weekly_pass').maybeSingle();
        const correctPass = (data?.value && data.value.trim() !== "") ? data.value.trim() : getWeeklyISO();
        return userInput.trim() === correctPass;
    } catch (e) { return false; }
};

// --- 4. CART & CHECKOUT LOGIC ---
async function updateCartBadge() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user || !cartBadge) return;
    const { count } = await _supabase.from('cart').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    cartBadge.innerText = count || 0;
    cartBadge.classList.toggle('hidden', !count || count === 0);
}

window.addToCart = async (gameId) => {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return window.location.href = 'login.html';
    const { error } = await _supabase.from('cart').insert([{ user_id: user.id, game_id: gameId }]);
    if (error) return alert("Item already in vault!");
    alert("Added to Vault! 🛒");
    updateCartBadge();
}

window.renderCartItems = async () => {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user || !cartItemsContainer) return;
    const { data: items } = await _supabase.from('cart').select('id, games(*)').eq('user_id', user.id);
    cartItemsContainer.innerHTML = (!items || items.length === 0) ? `<p class="text-center py-10 opacity-30 uppercase text-[10px] font-black italic text-white text-left">Empty Cart</p>` : '';
    let total = 0;
    items?.forEach(item => {
        const p = item.games.discount_price || item.games.price;
        total += p;
        cartItemsContainer.innerHTML += `
            <div class="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5 mb-2 text-white text-left">
                <div class="flex items-center gap-4 text-left">
                    <img src="${item.games.thumbnail}" class="w-12 h-12 rounded-xl object-cover">
                    <div class="text-left">
                        <p class="text-[11px] font-black uppercase leading-none text-white">${item.games.title}</p>
                        <p class="text-[10px] font-bold text-purple-400 mt-1">${formatRupiah(p)}</p>
                    </div>
                </div>
                <button onclick="removeFromCart('${item.id}')" class="text-red-500 p-2 active-scale"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>`;
    });
    if (cartTotalPriceLabel) cartTotalPriceLabel.innerText = formatRupiah(total);
};

window.removeFromCart = async (cid) => { await _supabase.from('cart').delete().eq('id', cid); renderCartItems(); updateCartBadge(); };

window.checkoutCart = async () => {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return (window.location.href = 'login.html');
        const { data: items } = await _supabase.from('cart').select('games(price, discount_price)').eq('user_id', user.id);
        if (!items || items.length === 0) return alert("Cart is empty!");
        let subtotal = items.reduce((sum, i) => sum + (i.games.discount_price || i.games.price), 0);
        const uniqueCode = Math.floor(Math.random() * 899) + 100;
        const finalAmount = (Math.floor(subtotal / 1000) * 1000) + uniqueCode;
        localStorage.setItem('pending_payment_amount', finalAmount);
        if (document.getElementById('modal-total-price')) document.getElementById('modal-total-price').innerText = formatRupiah(finalAmount);
        
        if (typeof closeCart === 'function') closeCart();
        const pModal = document.getElementById('payment-modal');
        if (pModal) pModal.classList.replace('hidden', 'flex');
    } catch (err) { console.error(err); }
};

window.processCartPayment = async () => {
    const btn = document.getElementById('confirm-payment-btn');
    const target = localStorage.getItem('pending_payment_amount');
    const { data: { user } } = await _supabase.auth.getUser();
    const fileInput = document.getElementById('payment-proof');

    if (!fileInput.files[0] || !target) return alert("Upload receipt!");
    btn.innerText = "🕵️ AI SCANNING..."; btn.disabled = true;

    try {
        const { data: { text } } = await Tesseract.recognize(fileInput.files[0], 'eng');
        const cleanOcr = text.replace(/[^0-9]/g, "");

        if (cleanOcr.includes(target.toString())) {
            const fileName = `${user.id}-${Date.now()}.png`;
            await _supabase.storage.from('payments').upload(`proofs/${fileName}`, fileInput.files[0]);
            const { data: { publicUrl } } = _supabase.storage.from('payments').getPublicUrl(`proofs/${fileName}`);

            const { data: cartItems } = await _supabase.from('cart').select('game_id, games(title)').eq('user_id', user.id);

            for (const item of cartItems) {
                // 1. Tambahkan ke Library (Agar bisa di download)
                await _supabase.from('library').upsert({ user_id: user.id, game_id: item.game_id, status: 'approved', payment_proof: publicUrl });

                // 2. WAJIB: Tambahkan ke Tabel Orders (Agar muncul di Riwayat Pembelian)
                await _supabase.from('orders').insert([{ 
                    user_id: user.id, 
                    game_id: item.game_id, 
                    item_name: item.games.title, 
                    amount: parseInt(target), 
                    status: 'success' 
                }]);

                // 3. Notifikasi Inbox
                await _supabase.from('vault_notifications').insert([{ user_id: user.id, title: 'Vault Unlocked', message: `${item.games.title} is available.` }]);
            }

            await _supabase.from('cart').delete().eq('user_id', user.id);
            alert("✅ VERIFIED! Archive unlocked."); 
            location.href = 'profile.html';
        } else {
            alert(`❌ Nominal Rp${target} tidak terdeteksi.`);
            btn.disabled = false; btn.innerText = "Confirm Sync AI";
        }
    } catch (e) { alert(e.message); btn.disabled = false; }
};

// --- 5. AUTOMATED COUNTDOWN ---
async function initCountdown() {
    try {
        const { data: settings } = await _supabase.from('settings').select('*');
        const releaseTime = settings.find(s => s.key === 'release_time')?.value; 
        const gameId = settings.find(s => s.key === 'countdown_game_id')?.value;
        if (!releaseTime) return;

        if (gameId) {
            const { data: game } = await _supabase.from('games').select('title').eq('id', gameId).single();
            if (game && document.getElementById('next-game-title')) document.getElementById('next-game-title').innerText = game.title;
        }

        const timerInterval = setInterval(() => {
            const now = new Date();
            const target = new Date();
            const [h, m, s] = releaseTime.split(':');
            target.setHours(h, m, s || 0);
            let dist = target.getTime() - now.getTime();
            if (dist < 0) dist += 86400000;

            if(document.getElementById('hours')) document.getElementById('hours').innerText = Math.floor((dist % 864e5) / 36e5).toString().padStart(2, '0');
            if(document.getElementById('minutes')) document.getElementById('minutes').innerText = Math.floor((dist % 36e5) / 6e4).toString().padStart(2, '0');
            if(document.getElementById('seconds')) document.getElementById('seconds').innerText = Math.floor((dist % 6e4) / 1000).toString().padStart(2, '0');
        }, 1000);
    } catch (e) {}
}

// --- 6. INBOX & NOTIFICATIONS ---
async function fetchInboxList(userId) {
    const container = document.getElementById('inbox-list');
    if (!container) return;

    const { data: notifs, error } = await _supabase
        .from('vault_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) return;

    if (!notifs || notifs.length === 0) {
        container.innerHTML = `<p class="text-center py-10 opacity-30 text-[10px] font-black uppercase italic text-white text-left">Inbox Empty</p>`;
    } else {
        container.innerHTML = notifs.map(n => `
            <div class="p-5 rounded-[25px] bg-white/5 border ${n.is_read ? 'border-white/5 opacity-50' : 'border-blue-500/30 bg-blue-500/5'} transition-all mb-3 text-left">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="text-[11px] font-black uppercase tracking-tight text-white">${n.title}</h4>
                    ${!n.is_read ? '<span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>' : ''}
                </div>
                <p class="text-[10px] text-gray-400 leading-relaxed text-left text-white">${n.message}</p>
                <span class="text-[7px] text-gray-600 mt-3 block font-bold uppercase text-left text-white">${new Date(n.created_at).toLocaleString()}</span>
            </div>
        `).join('');
    }
}

async function updateInboxBadge() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;
        const { count, error } = await _supabase.from('vault_notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
        if (error) throw error;
        const badge = document.getElementById('inbox-badge');
        if (badge) {
            badge.innerText = count || 0;
            badge.classList.toggle('hidden', !count || count === 0);
        }
    } catch (err) { console.error("Badge Error:", err); }
}

window.toggleInbox = async () => {
    const modal = document.getElementById('inbox-modal');
    if (!modal) return;

    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) { alert("Please login first"); modal.classList.add('hidden'); return; }
        document.getElementById('inbox-list').innerHTML = '<p class="text-center py-10 opacity-30 text-[10px] animate-pulse uppercase font-black italic text-white text-left">Syncing Vault...</p>';
        await fetchInboxList(user.id);
        await _supabase.from('vault_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
        updateInboxBadge();
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

function subscribeToNotifications(userId) {
    _supabase
        .channel(`inbox-realtime-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vault_notifications', filter: `user_id=eq.${userId}` }, () => {
            updateInboxBadge();
            const modal = document.getElementById('inbox-modal');
            if (modal && !modal.classList.contains('hidden')) fetchInboxList(userId);
        })
        .subscribe();
}

// --- 7. NEWS & CHAT ---
async function fetchVaultNews() {
    const { data: news } = await _supabase.from('vault_news').select('*').order('created_at', { ascending: false }).limit(3);
    const container = document.getElementById('news-container');
    if (container && news) {
        container.innerHTML = news.map(item => `
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
                <div class="text-white text-left text-white text-white">
                    <span class="text-[7px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase mr-2">${item.category}</span>
                    <span class="text-[11px] font-bold text-white uppercase">${item.title}</span>
                    <p class="text-[9px] text-gray-500 truncate max-w-xs text-left">${item.content}</p>
                </div>
                <span class="text-[8px] text-gray-600 font-black uppercase text-white">${new Date(item.created_at).toLocaleDateString()}</span>
            </div>`).join('');
    }
}

window.toggleChat = () => {
    const win = document.getElementById('chat-window');
    if(!win) return;
    win.classList.toggle('hidden');
    if(!win.classList.contains('hidden')) { win.classList.add('flex'); loadChatHistory(); }
};

async function loadChatHistory() {
    const { data: { user } } = await _supabase.auth.getUser();
    if(!user) return;
    const { data } = await _supabase.from('chats').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
    const container = document.getElementById('chat-messages');
    if(container) container.innerHTML = data?.map(msg => `<div class="${!msg.is_admin_reply ? 'self-end bg-purple-600 text-right' : 'self-start bg-white/10 text-left'} p-3 rounded-[20px] max-w-[85%] text-[10px] font-bold text-white mb-2 text-white">${msg.message}</div>`).join('') || '';
    if(container) container.scrollTop = container.scrollHeight;
}

window.sendChatMessage = async () => {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    const { data: { user } } = await _supabase.auth.getUser();
    if (!msg || !user) return;
    await _supabase.from('chats').insert([{ user_id: user.id, sender_name: user.email.split('@')[0], message: msg, is_admin_reply: false }]);
    input.value = ''; loadChatHistory();
};

// --- 8. INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    checkSession(); fetchGames(); fetchVaultNews(); initCountdown();
});

// --- SURVEY LOGIC ---

async function checkLoginSurvey(uid) {
    // Jika user sudah menjawab survei di TAB ini, jangan tanya lagi
    if (sessionStorage.getItem('gv_survey_session_done')) return;

    // Ambil data referal dari database
    const { data: profile, error } = await _supabase
        .from('profiles')
        .select('referral_source')
        .eq('id', uid)
        .maybeSingle();

    // Jika kolom referral_source masih NULL, munculkan modal
    if (!profile || profile.referral_source === null) {
        const modal = document.getElementById('survey-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            console.log("Survey Required: User has no referral source.");
        }
    } else {
        // Jika sudah ada isinya di DB, tandai di session tab ini agar tidak query terus
        sessionStorage.setItem('gv_survey_session_done', 'true');
    }
}

window.handleSurveySubmit = async (source) => {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    const { error } = await _supabase
        .from('profiles')
        .update({ referral_source: source })
        .eq('id', user.id);

    if (!error) {
        sessionStorage.setItem('gv_survey_session_done', 'true');
        document.getElementById('survey-modal').classList.replace('flex', 'hidden');
        alert("Signal Sinkron! Terima kasih Hunter.");
    }
};



// Panggil fungsi checkLoginSurvey di dalam DOMContentLoaded atau di akhir checkSession
// Contoh integrasi di dalam checkSession yang sudah ada:
// ... kode checkSession lama ...
// updateInboxBadge();
// checkLoginSurvey(); // Tambahkan ini di akhir fungsi checkSession


window.filterBy = (cat) => { currentFilter = cat; currentPage = 1; fetchGames(); };
window.handleSearch = () => { currentPage = 1; fetchGames(searchInput?.value || ''); };