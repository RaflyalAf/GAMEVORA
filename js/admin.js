/**
 * GAMEVORA - Master App Logic (V89.0 Master Logic)
 * Fitur: Weekly Pass Synchronizer, Auto-Upload Proof to Storage, 
 * Fix Edit Download Links, AI OCR, Automated Countdown Sync, & Live Chat.
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
                        <a href="profile.html" class="flex items-center gap-2 group active-scale cursor-pointer" style="display: flex; align-items: center; text-decoration: none;">
                            <div class="w-8 h-8 rounded-full bg-purple-600 border border-white/10 overflow-hidden shadow-lg group-hover:border-purple-400 transition-all text-white">
                                 <img src="${avatarImg}" class="w-full h-full object-cover">
                            </div>
                            <div class="hidden sm:flex flex-col items-start leading-none">
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
        }
    } catch (e) { console.log("Guest Mode Active"); }
}

window.handleLogout = async () => {
    if(!confirm("Keluar dari Vault?")) return;
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
};

// --- 2. GRID RENDERING ---
const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

async function fetchGames(keyword = '') {
    if (!gameContainer) return;
    gameContainer.innerHTML = '<div class="col-span-full text-center py-20 opacity-50 uppercase text-[10px] font-black animate-pulse text-white">Accessing Vault...</div>';

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

        if (currentPage === 1 && !keyword && currentFilter === 'all') setupHeroSlider(games);
        renderGamesGrid(games);
        renderPaginationUI(count);
    } catch (err) { console.error(err); }
}

function setupHeroSlider(games) {
    const wrapper = document.getElementById('hero-wrapper');
    if (!wrapper) return;
    const trending = games.filter(g => g.is_trending).slice(0, 3);
    if (trending.length === 0) return;

    wrapper.innerHTML = trending.map((game, index) => `
        <div class="hero-slide ${index === 0 ? 'active' : ''}">
            <img src="${game.thumbnail}" class="w-full h-full object-cover">
            <div class="absolute inset-0 hero-overlay flex flex-col justify-end px-8 md:px-20 pb-20 text-white text-left">
                <span class="text-purple-500 font-black uppercase tracking-[0.5em] text-[10px] mb-2">🔥 Trending Now</span>
                <h1 class="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 leading-none text-white">${game.title.replace(" ", "<br>")}</h1>
                <p class="max-w-md text-gray-300 text-sm font-medium leading-relaxed mb-8 line-clamp-2">${game.description || 'Secure encrypted vault access.'}</p>
                <a href="detail.html?id=${game.id}" class="w-fit bg-purple-600 px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest active-scale shadow-[0_0_40px_rgba(168,85,247,0.4)] text-white">View Vault</a>
            </div>
        </div>
    `).join('');
}

function renderGamesGrid(games) {
    if (!gameContainer) return;
    gameContainer.innerHTML = (!games || games.length === 0) ? `<div class="col-span-full text-center py-20 opacity-50 uppercase text-[10px] font-black text-white">No items found</div>` : '';
    
    games?.forEach(game => {
        const priceFinal = game.discount_price > 0 ? game.discount_price : game.price;
        const connIcon = game.connectivity_type === 'Online' 
            ? `<div class="bg-blue-600/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-lg text-white"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg></div>`
            : `<div class="bg-green-600/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-lg text-white"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18.364 5.636a9 9 0 010 12.728m0-12.728L5.636 18.364m12.728 0a9 9 0 01-12.728 0m12.728 0L5.636 5.636m0 0a9 9 0 0112.728 0"></path></svg></div>`;

        gameContainer.innerHTML += `
            <div class="group relative bg-white/[0.03] border border-white/5 rounded-[35px] overflow-hidden hover:border-purple-500/30 transition-all duration-500 shadow-xl animate-fade-in text-white text-left">
                <div class="aspect-[4/5] relative overflow-hidden bg-black/40 w-full cursor-pointer" onclick="location.href='detail.html?id=${game.id}'">
                    <img src="${game.thumbnail}" loading="lazy" class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-90"></div>
                    <div class="absolute top-4 right-4 z-10">${connIcon}</div>
                </div>
                <div class="p-6 text-white text-left">
                    <span class="text-[8px] font-black text-purple-500 uppercase tracking-widest mb-1 block opacity-60">${game.genre || 'License'}</span>
                    <h3 class="font-black text-sm mb-3 uppercase tracking-tighter line-clamp-1">${game.title}</h3>
                    <div class="mb-5 text-white"><span class="text-xl font-black italic tracking-tight">${formatRupiah(priceFinal)}</span></div>
                    <button onclick="addToCart('${game.id}')" class="w-full bg-white text-black py-3.5 rounded-xl text-[9px] font-black uppercase hover:bg-purple-600 hover:text-white transition-all active-scale">Add to Cart 🛒</button>
                </div>
            </div>`;
    });
}

function renderPaginationUI(totalItems) {
    if (!paginationContainer) return;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) { paginationContainer.innerHTML = ''; return; }
    let html = `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white transition-all">Previous</button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button onclick="changePage(${i})" class="w-10 h-10 rounded-xl text-[10px] font-black border ${i === currentPage ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'} text-white">${i}</button>`;
        }
    }
    html += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white transition-all">Next</button>`;
    paginationContainer.innerHTML = html;
}

window.changePage = (page) => { currentPage = page; fetchGames(searchInput?.value || ''); window.scrollTo({top: 0, behavior: 'smooth'}); };

// --- 3. WEEKLY PASS SYSTEM ---
function getWeeklyAutoPass() {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((now - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
    return `GV-${now.getFullYear()}-W${weekNumber}`;
}

async function getCurrentPass() {
    const { data } = await _supabase.from('settings').select('value').eq('key', 'manual_weekly_pass').maybeSingle();
    return data?.value || getWeeklyAutoPass();
}

window.saveManualPass = async () => {
    const val = document.getElementById('input-manual-pass').value.trim();
    const { error } = await _supabase.from('settings').upsert({ key: 'manual_weekly_pass', value: val === "" ? null : val });
    if (!error) {
        alert(val === "" ? "Reverted to Auto-Pass" : "Weekly Pass Updated!");
        syncWeeklyPassDisplay();
    }
};

// --- 4. CART & CHECKOUT ---
async function updateCartBadge() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user || !cartBadge) return;
    const { count } = await _supabase.from('cart').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    cartBadge.innerText = count || 0;
    cartBadge.classList.toggle('hidden', !count);
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
    cartItemsContainer.innerHTML = (!items || items.length === 0) ? `<p class="text-center py-10 opacity-30 uppercase text-[10px] font-black italic text-white">Empty Cart</p>` : '';
    let total = 0;
    items?.forEach(item => {
        const p = item.games.discount_price || item.games.price;
        total += p;
        cartItemsContainer.innerHTML += `
            <div class="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5 mb-2 text-white text-left">
                <div class="flex items-center gap-4 text-left">
                    <img src="${item.games.thumbnail}" class="w-12 h-12 rounded-xl object-cover">
                    <div class="text-left">
                        <p class="text-[11px] font-black uppercase leading-none">${item.games.title}</p>
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
        const finalAmount = subtotal + uniqueCode;
        localStorage.setItem('pending_payment_amount', finalAmount);
        if (document.getElementById('modal-total-price')) document.getElementById('modal-total-price').innerText = formatRupiah(finalAmount);
        
        // Open Payment Modal
        if (typeof closeCart === 'function') closeCart();
        const pModal = document.getElementById('payment-modal');
        if (pModal) { pModal.classList.remove('hidden'); pModal.classList.add('flex'); }
    } catch (err) { console.error(err); }
};

window.processCartPayment = async () => {
    const btn = document.getElementById('confirm-payment-btn');
    const fileInput = document.getElementById('payment-proof');
    const target = localStorage.getItem('pending_payment_amount');
    const { data: { user } } = await _supabase.auth.getUser();

    if (!fileInput.files[0] || !target) return alert("Silakan unggah bukti transfer!");
    btn.innerText = "🕵️ AI SCANNING..."; btn.disabled = true;

    try {
        const { data: { text } } = await Tesseract.recognize(fileInput.files[0], 'eng');
        const cleanOcr = text.replace(/[^0-9]/g, "");

        if (cleanOcr.includes(target.toString())) {
            const file = fileInput.files[0];
            const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
            
            await _supabase.storage.from('payments').upload(`proofs/${fileName}`, file);
            const { data: { publicUrl } } = _supabase.storage.from('payments').getPublicUrl(`proofs/${fileName}`);

            const { data: cartItems } = await _supabase.from('cart').select('game_id, games(title)').eq('user_id', user.id);
            for (const item of cartItems) {
                await _supabase.from('library').upsert({ 
                    user_id: user.id, game_id: item.game_id, status: 'approved', payment_proof: publicUrl 
                });
                await _supabase.from('orders').insert([{ user_id: user.id, game_id: item.game_id, item_name: item.games.title, amount: parseInt(target), status: 'success' }]);
                await _supabase.from('vault_notifications').insert([{ user_id: user.id, title: 'Vault Unlocked', message: `${item.games.title} is available.` }]);
            }
            await _supabase.from('cart').delete().eq('user_id', user.id);
            alert("✅ VERIFIED!");
            localStorage.removeItem('pending_payment_amount');
            location.href = 'profile.html';
        } else {
            alert(`❌ Nominal Rp${target} tidak ditemukan.`);
            btn.disabled = false; btn.innerText = "Confirm Payment";
        }
    } catch (e) { alert("Error: " + e.message); btn.disabled = false; }
};

// --- 5. AUTOMATED COUNTDOWN ---
async function initCountdown() {
    try {
        const { data: settings } = await _supabase.from('settings').select('*');
        const releaseTime = settings.find(s => s.key === 'release_time')?.value; // Format HH:MM:SS
        const gameId = settings.find(s => s.key === 'countdown_game_id')?.value;
        
        if (!releaseTime) return;

        if (gameId) {
            const { data: game } = await _supabase.from('games').select('title').eq('id', gameId).single();
            if (game && document.getElementById('next-game-title')) document.getElementById('next-game-title').innerText = game.title;
        }

        // Logic countdown berdasarkan waktu hari ini + target jam
        const timerInterval = setInterval(() => {
            const now = new Date();
            const target = new Date();
            const [h, m, s] = releaseTime.split(':');
            target.setHours(h, m, s || 0);

            let dist = target.getTime() - now.getTime();
            if (dist < 0) dist += 86400000; // Jika sudah lewat, target besok

            if(document.getElementById('hours')) document.getElementById('hours').innerText = Math.floor((dist % 864e5) / 36e5).toString().padStart(2, '0');
            if(document.getElementById('minutes')) document.getElementById('minutes').innerText = Math.floor((dist % 36e5) / 6e4).toString().padStart(2, '0');
            if(document.getElementById('seconds')) document.getElementById('seconds').innerText = Math.floor((dist % 6e4) / 1000).toString().padStart(2, '0');
        }, 1000);
    } catch (e) {}
}

// --- 6. ADMIN HELPER ---
window.prepareEdit = async (g) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('edit-id').value = g.id;
    document.getElementById('title').value = g.title;
    document.getElementById('genre').value = g.genre;
    document.getElementById('price').value = g.price;
    document.getElementById('discount_price').value = g.discount_price || 0;
    document.getElementById('thumbnail').value = g.thumbnail;
    document.getElementById('description').value = g.description;
    document.getElementById('manual_guide').value = g.manual_guide || '';
    document.getElementById('is_trending').checked = g.is_trending;
    document.getElementById('connectivity_type').value = g.connectivity_type || 'Offline';
    
    // Fill Specs
    if(g.specifications) {
        document.getElementById('min_os').value = g.specifications.minimum?.os || '';
        document.getElementById('min_cpu').value = g.specifications.minimum?.cpu || '';
        document.getElementById('min_ram').value = g.specifications.minimum?.ram || '';
        document.getElementById('min_gpu').value = g.specifications.minimum?.gpu || '';
        document.getElementById('rec_os').value = g.specifications.recommended?.os || '';
        document.getElementById('rec_cpu').value = g.specifications.recommended?.cpu || '';
        document.getElementById('rec_ram').value = g.specifications.recommended?.ram || '';
        document.getElementById('rec_gpu').value = g.specifications.recommended?.gpu || '';
    }

    const wrapper = document.getElementById('links-wrapper');
    if (wrapper) {
        wrapper.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const linkData = (g.download_links && g.download_links[i]) ? g.download_links[i] : null;
            const div = document.createElement('div');
            div.className = "link-row grid grid-cols-12 gap-2 bg-black/40 p-3 rounded-2xl border border-white/5 mb-2";
            div.innerHTML = `
                <select class="col-span-3 rounded-xl py-2 text-[8px] font-bold uppercase text-white bg-transparent border-none">
                    <option value="box" ${linkData?.icon === 'box' ? 'selected' : ''}>📦 File</option>
                    <option value="tool" ${linkData?.icon === 'tool' ? 'selected' : ''}>🛠️ Tool</option>
                    <option value="guide" ${linkData?.icon === 'guide' ? 'selected' : ''}>📖 Guide</option>
                    <option value="fix" ${linkData?.icon === 'fix' ? 'selected' : ''}>🔧 Fix</option>
                </select>
                <input type="text" placeholder="Label" class="col-span-3 rounded-xl px-3 py-2 text-[9px] uppercase text-white bg-transparent" value="${linkData?.label || ''}">
                <input type="url" placeholder="Direct URL" class="col-span-6 rounded-xl px-3 py-2 text-[9px] text-white bg-transparent" value="${linkData?.url || ''}">`;
            wrapper.appendChild(div);
        }
    }

    if (typeof switchTab === 'function') switchTab('upload');
    document.getElementById('form-title').innerText = "Update: " + g.title;
    document.getElementById('main-upload-btn').innerText = "Apply Updates";
};

// --- 7. NEWS, NOTIF, & CHAT ---
async function fetchVaultNews() {
    const { data: news } = await _supabase.from('vault_news').select('*').order('created_at', { ascending: false }).limit(3);
    const container = document.getElementById('news-container');
    if (container && news) {
        container.innerHTML = news.map(item => `
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
                <div><span class="text-[7px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase mr-2">${item.category}</span>
                <span class="text-[11px] font-bold text-white uppercase">${item.title}</span>
                <p class="text-[9px] text-gray-500 truncate max-w-xs">${item.content}</p></div>
                <span class="text-[8px] text-gray-600 font-black uppercase">${new Date(item.created_at).toLocaleDateString()}</span>
            </div>`).join('');
    }
}

async function updateInboxBadge() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;
    const { count } = await _supabase.from('vault_notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
    const badge = document.getElementById('inbox-badge');
    if (badge) { badge.innerText = count || 0; badge.classList.toggle('hidden', !count); }
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
    if(container) container.innerHTML = data?.map(msg => `<div class="${!msg.is_admin_reply ? 'self-end bg-purple-600' : 'self-start bg-white/10'} p-3 rounded-[20px] max-w-[85%] text-[10px] font-bold text-white mb-2 text-left">${msg.message}</div>`).join('') || '';
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
    checkSession(); fetchGames(); fetchVaultNews(); updateInboxBadge(); initCountdown();
});

// --- ADMIN REQUEST MANAGEMENT ---

async function fetchAdminRequests() {
    const container = document.getElementById('admin-request-table');
    
    const { data, error } = await _supabase
        .from('game_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    document.getElementById('admin-req-count').innerText = `${data.length} Requests`;

    if (data.length === 0) {
        container.innerHTML = `<tr><td colspan="5" class="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">No signals detected</td></tr>`;
        return;
    }

    container.innerHTML = data.map(req => `
        <tr class="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
            <td class="px-8 py-6">
                <p class="text-[10px] font-black uppercase text-white">${req.user_email.split('@')[0]}</p>
                <p class="text-[8px] text-gray-600 font-bold">${req.user_email}</p>
            </td>
            <td class="px-8 py-6 text-xs font-bold text-blue-400 uppercase tracking-tight text-left">${req.game_title}</td>
            <td class="px-8 py-6">
                <span class="text-[9px] font-black uppercase bg-white/5 px-3 py-1 rounded-lg text-gray-400">${req.platform}</span>
            </td>
            <td class="px-8 py-6">
                <select onchange="updateRequestStatus('${req.id}', this.value)" 
                    class="bg-black border border-white/10 rounded-xl px-3 py-2 text-[9px] font-black uppercase outline-none focus:border-blue-500 cursor-pointer text-white">
                    <option value="pending" ${req.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="process" ${req.status === 'process' ? 'selected' : ''}>Process</option>
                    <option value="fulfilled" ${req.status === 'fulfilled' ? 'selected' : ''}>Fulfilled</option>
                </select>
            </td>
            <td class="px-8 py-6 text-right text-white">
                <button onclick="deleteRequest('${req.id}')" class="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

// Fungsi Update Status
async function updateRequestStatus(id, newStatus) {
    const { error } = await _supabase
        .from('game_requests')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) {
        alert("Gagal update status!");
    } else {
        // Optional: Beri notifikasi ke user via tabel vault_notifications
        if(newStatus === 'fulfilled') {
             // Kamu bisa tambahkan logic kirim notif otomatis ke user di sini
        }
        fetchAdminRequests(); // Refresh tabel
    }
}

// Fungsi Hapus Request
async function deleteRequest(id) {
    if(!confirm("Hapus signal request ini?")) return;
    const { error } = await _supabase.from('game_requests').delete().eq('id', id);
    if (!error) fetchAdminRequests();
}

// Panggil fungsi saat halaman admin dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Pastikan pengecekan admin sudah selesai dulu
    setTimeout(fetchAdminRequests, 1000);
});

window.filterBy = (cat) => { currentFilter = cat; currentPage = 1; fetchGames(); };
window.handleSearch = () => { currentPage = 1; fetchGames(searchInput?.value || ''); };