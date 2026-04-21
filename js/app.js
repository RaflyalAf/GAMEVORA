/**
 * GAMEVORA - Master App Logic (V11.4 Optimized Sync & Security Gate)
 * Bagian Lengkap: Auth Sync, Weekly Pass Generator, Hero Slider, Hybrid Filter, Search & FAQ
 */

const SUPABASE_URL = 'https://meruqlvbymsaeaxybxaz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JpMK5MzO-awEkOOvr7t-xg_bBkobHLf'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const gameContainer = document.getElementById('game-list');
const searchInput = document.getElementById('search-input');
const authPlaceholder = document.getElementById('auth-placeholder');
const adminLink = document.getElementById('admin-link');
const heroWrapper = document.getElementById('hero-wrapper');
const heroDots = document.getElementById('hero-dots');

// State Management
let currentSlide = 0;
let totalSlides = 0;
let sliderInterval = null;
let currentFilter = 'all';

// --- 1. WEEKLY PASS GENERATOR (OTOMATIS) ---
/**
 * Menghasilkan kode unik yang berubah otomatis setiap hari Senin pukul 00:00
 * Digunakan sebagai kunci sinkronisasi global untuk akses Vault.
 */
function getWeeklyAutoPass() {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
    const year = now.getFullYear();
    return `GV-${year}-W${weekNumber}`;
}

// --- 2. SESSION & AUTH MANAGEMENT ---
async function checkSession() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        
        if (user) {
            // Cek apakah user di-banned (Integrasi User Control)
            const { data: profile } = await _supabase
                .from('profiles')
                .select('full_name, avatar_url, is_banned')
                .eq('id', user.id)
                .maybeSingle();

            if (profile?.is_banned) {
                alert("AKUN ANDA DINONAKTIFKAN KARENA PELANGGARAN.");
                await _supabase.auth.signOut();
                window.location.href = 'index.html';
                return;
            }

            // Update UI Profile di Navbar
            if (authPlaceholder) {
                const displayName = profile?.full_name || user.email.split('@')[0];
                const avatarImg = profile?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=6D28D9&color=fff`;

                authPlaceholder.innerHTML = `
                    <div class="flex items-center gap-4">
                        <a href="./profile.html" class="flex items-center gap-2 group active-scale">
                            <div class="w-8 h-8 rounded-full bg-purple-600 border border-white/10 overflow-hidden shadow-lg transition-transform group-hover:scale-110">
                                 <img src="${avatarImg}" class="w-full h-full object-cover">
                            </div>
                            <div class="hidden sm:flex flex-col items-start leading-none text-left">
                                <span class="text-[9px] text-gray-400 font-black uppercase tracking-widest group-hover:text-white transition">${displayName}</span>
                                <span class="text-[7px] text-purple-500 font-bold uppercase mt-1">My Vault</span>
                            </div>
                        </a>
                        <button onclick="handleLogout()" class="text-[10px] font-black text-red-500 hover:text-white transition-all border border-red-500/20 px-4 py-1.5 rounded-full uppercase active:scale-95">Logout</button>
                    </div>`;
            }

            // Admin Whitelist Check
            const isAdmin = user.app_metadata?.role === 'admin' || 
                            ["raflyalfazari622@gmail.com", "fadhilakbar050@gmail.com"].includes(user.email);
                            
            if (isAdmin && adminLink) {
                adminLink.classList.remove('hidden');
                adminLink.classList.add('flex');
            }
        }
    } catch (e) { console.log("Auth System: Offline/Guest Mode"); }
}

window.handleLogout = async () => {
    if(!confirm("Sign out from vault?")) return;
    await _supabase.auth.signOut();
    window.location.href = "index.html";
};

// --- 3. HERO SLIDER LOGIC ---
async function fetchHeroTrending() {
    if (!heroWrapper || !heroDots) return;
    try {
        const { data: trendingGames, error } = await _supabase
            .from('games')
            .select('*')
            .eq('is_trending', true)
            .limit(5);
        
        if (error || !trendingGames || trendingGames.length === 0) {
            const sliderSection = document.getElementById('hero-slider');
            if (sliderSection) sliderSection.parentElement.classList.add('hidden');
            return;
        }

        totalSlides = trendingGames.length;
        heroWrapper.innerHTML = ''; 
        heroDots.innerHTML = '';

        trendingGames.forEach((game, index) => {
            const price = game.discount_price > 0 ? game.discount_price : game.price;
            const priceText = price === 0 ? "FREE" : "Rp" + price.toLocaleString('id-ID');
            
            heroWrapper.innerHTML += `
                <div class="min-w-full h-full relative group flex-shrink-0">
                    <img src="${game.thumbnail}" class="absolute inset-0 w-full h-full object-cover transition duration-1000">
                    <div class="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent"></div>
                    <div class="absolute inset-0 flex flex-col justify-center px-8 md:px-20 space-y-4">
                        <span class="bg-red-600 text-white text-[8px] font-black px-3 py-1 rounded-full w-fit uppercase tracking-widest animate-pulse">🔥 Trending</span>
                        <h2 class="text-4xl md:text-7xl font-black italic uppercase leading-none max-w-2xl">${game.title}</h2>
                        <p class="text-gray-400 text-xs max-w-xs line-clamp-2 uppercase font-bold opacity-80">${game.description || ''}</p>
                        <div class="flex items-center gap-6 pt-4">
                            <a href="detail.html?id=${game.id}" class="bg-white text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all transform hover:scale-105 shadow-2xl active-scale">Get Access</a>
                            <span class="text-xl font-black italic text-white">${priceText}</span>
                        </div>
                    </div>
                </div>`;
            heroDots.innerHTML += `<div class="dot h-1.5 rounded-full bg-white/20 transition-all duration-500 ${index === 0 ? 'w-8 bg-purple-500' : 'w-2'}"></div>`;
        });

        if(sliderInterval) clearInterval(sliderInterval);
        sliderInterval = setInterval(nextSlide, 6000);
    } catch (e) { console.error("Slider Error:", e); }
}

window.nextSlide = () => { if (totalSlides > 0) { currentSlide = (currentSlide + 1) % totalSlides; updateSliderUI(); } };
window.prevSlide = () => { if (totalSlides > 0) { currentSlide = (currentSlide - 1 + totalSlides) % totalSlides; updateSliderUI(); } };

function updateSliderUI() {
    if (heroWrapper) {
        heroWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, i) => {
            dot.className = `dot h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-purple-500' : 'w-2 bg-white/20'}`;
        });
    }
}

// --- 4. FILTER & SEARCH LOGIC ---
const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

window.filterBy = (category) => {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const isMatch = btn.innerText.toLowerCase().includes(category.toLowerCase()) || 
                       (category === 'all' && btn.innerText.toLowerCase().includes('all'));
        btn.classList.toggle('bg-purple-600', isMatch);
        btn.classList.toggle('bg-white/5', !isMatch);
    });
    fetchGames(searchInput ? searchInput.value : '');
};

async function fetchGames(keyword = '') {
    if (!gameContainer) return;
    try {
        gameContainer.innerHTML = `<div class="col-span-full text-center py-20"><div class="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>`;
        
        let query = _supabase.from('games').select('*').order('is_trending', { ascending: false }).order('created_at', { ascending: false });

        if (currentFilter === 'trending') query = query.eq('is_trending', true);
        else if (['Online', 'Offline'].includes(currentFilter)) query = query.eq('connectivity_type', currentFilter);
        else if (currentFilter !== 'all') query = query.ilike('genre', `%${currentFilter}%`);

        if (keyword) query = query.or(`title.ilike.%${keyword}%,genre.ilike.%${keyword}%`);

        const { data: games, error } = await query;
        if (error) throw error;
        renderGamesGrid(games);
    } catch (err) {
        console.error("Fetch Games Error:", err);
        gameContainer.innerHTML = `<p class="col-span-full text-center text-red-500 font-black uppercase text-xs tracking-widest">Sync Error: Database Connection</p>`;
    }
}

function renderGamesGrid(games) {
    gameContainer.innerHTML = '';
    if (games.length === 0) {
        gameContainer.innerHTML = `<div class="col-span-full text-center py-20 opacity-50 uppercase text-[10px] font-black tracking-widest italic">No matching vaults found in database</div>`;
        return;
    }

    games.forEach(game => {
        const isOnline = game.connectivity_type === 'Online';
        const priceFinal = game.discount_price > 0 && game.discount_price < game.price ? game.discount_price : game.price;
        const priceHTML = priceFinal === 0 ? "FREE" : formatRupiah(priceFinal);

        gameContainer.innerHTML += `
            <div class="group relative bg-white/[0.03] border border-white/5 rounded-[30px] sm:rounded-[40px] overflow-hidden hover:border-purple-500/30 transition-all duration-500 shadow-xl active-scale">
                <div class="aspect-[4/5] relative overflow-hidden bg-black/40 w-full">
                    <img src="${game.thumbnail}" alt="${game.title}" loading="lazy" class="object-cover w-full h-full group-hover:scale-110 transition-transform duration-1000 ease-out">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent opacity-90"></div>
                    
                    <div class="absolute top-3 right-3 z-30 sm:top-5 sm:right-5">
                        <span class="flex items-center gap-1.5 backdrop-blur-md border px-2.5 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-tighter ${isOnline ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}">
                            <span class="w-1 h-1 rounded-full ${isOnline ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}"></span>
                            ${isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>

                    ${game.is_trending ? `<div class="absolute top-3 left-3 z-20 sm:top-5 sm:left-5 bg-red-600 text-white text-[8px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-widest shadow-xl animate-pulse">Trending</div>` : ''}
                </div>
                <div class="p-5 sm:p-8 text-left">
                    <span class="text-[8px] md:text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1 block opacity-60">${game.genre || 'Digital Item'}</span>
                    <h3 class="font-black text-sm sm:text-lg mb-3 md:mb-4 group-hover:text-purple-400 transition italic uppercase tracking-tighter line-clamp-1 leading-tight text-white">${game.title}</h3>
                    <div class="mb-6 md:mb-8 flex flex-col justify-end min-h-[35px] md:min-h-[40px]">
                        ${game.discount_price > 0 ? `<span class="text-[8px] md:text-[9px] text-gray-500 line-through block font-bold opacity-60">Rp${game.price.toLocaleString('id-ID')}</span>` : ''}
                        <span class="text-xl md:text-2xl font-black text-white italic tracking-tight leading-none">${priceHTML}</span>
                    </div>
                    <a href="detail.html?id=${game.id}" class="block text-center bg-white text-black py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] md:text-[10px] font-black transition-all uppercase tracking-[0.2em] hover:bg-purple-600 hover:text-white active:scale-95 shadow-xl">
                        View Details
                    </a>
                </div>
            </div>`;
    });
}

// --- 5. FAQ LOGIC ---
window.toggleFAQ = (element) => {
    const content = element.nextElementSibling;
    const icon = element.querySelector('.faq-icon');
    const allItems = document.querySelectorAll('.faq-content');

    allItems.forEach((item) => {
        if (item !== content) {
            item.classList.add('hidden');
            const otherIcon = item.previousElementSibling.querySelector('.faq-icon');
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            item.parentElement.classList.remove('border-purple-500/30', 'bg-purple-500/5');
        }
    });

    const isHidden = content.classList.contains('hidden');
    content.classList.toggle('hidden', !isHidden);
    icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
    element.parentElement.classList.toggle('border-purple-500/30', isHidden);
    element.parentElement.classList.toggle('bg-purple-500/5', isHidden);
};

// --- 6. INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    fetchHeroTrending();
    fetchGames();
    
    // Logic Search dengan Debounce (Anti-Spam Database)
    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fetchGames(e.target.value), 500);
        });
    }
});