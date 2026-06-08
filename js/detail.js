/**
 * GAMEVORA - Detail Logic (V23.0 Final Optimized)
 * Fitur: Relational Review, Manual Weekly Pass, Multi-Item Cart, AI OCR Verification, Storage Bucket Integration
 * Status Update: "Game sudah masuk ke library ✔"
 */

const SUPABASE_URL = 'https://meruqlvbymsaeaxybxaz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JpMK5MzO-awEkOOvr7t-xg_bBkobHLf'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const params = new URLSearchParams(window.location.search);
const gameId = params.get('id');

const loading = document.getElementById('loading');
const content = document.getElementById('content');
const modal = document.getElementById('payment-modal');
const cartModal = document.getElementById('cart-modal');

let currentGameData = null;
let currentStatus = null; 
let activeWeeklyPass = ""; 
let finalAmountAfterUniqueCode = 0; 
let isCartCheckout = false;
window.selectedRating = 0; 

// --- 1. UTILS ---
const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

function getWeeklyAutoPass() {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((((now - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
    return `GV-${now.getFullYear()}-W${weekNumber}`;
}

// --- 2. CORE INITIALIZATION ---
async function loadGameDetail() {
    if (!gameId) { window.location.href = 'index.html'; return; }

    try {
        const [gameRes, settingsRes] = await Promise.all([
            _supabase.from('games').select('*').eq('id', gameId).single(),
            _supabase.from('settings').select('value').eq('key', 'manual_weekly_pass').maybeSingle()
        ]);

        if (gameRes.error || !gameRes.data) throw new Error("Game not found");
        currentGameData = gameRes.data;

        const manualPass = settingsRes.data?.value;
        activeWeeklyPass = (manualPass && manualPass.trim() !== "") ? manualPass : getWeeklyAutoPass();

        const { data: { user } } = await _supabase.auth.getUser();
        if (user) {
            document.getElementById('review-form-container')?.classList.remove('hidden');
        }

        await checkLibraryStatus();
        await updateCartBadge();
        renderUI(currentGameData);
        updateAccessUI();
        
        await loadReviews();
        subscribeToReviews();

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
    const { data: entry } = await _supabase.from('library').select('status').eq('user_id', user.id).eq('game_id', gameId).maybeSingle();
    if (entry) currentStatus = entry.status;
}

function renderUI(game) {
    document.getElementById('game-title').innerText = game.title;
    document.getElementById('game-img').src = game.thumbnail;
    document.getElementById('game-desc').innerText = game.description;
    document.getElementById('genre-badge').innerText = game.genre || 'License';
    
    const basePrice = game.discount_price > 0 ? game.discount_price : game.price;
    document.getElementById('game-price').innerText = basePrice === 0 ? "FREE" : formatRupiah(basePrice);
    
    if (game.discount_price > 0) {
        const oldPriceEl = document.getElementById('old-price');
        if (oldPriceEl) {
            oldPriceEl.innerText = formatRupiah(game.price);
            oldPriceEl.classList.remove('hidden');
        }
    }

    renderSpecs('min-spec', game.specifications?.minimum);
    renderSpecs('rec-spec', game.specifications?.recommended);

    if (game.manual_guide) {
        const guideBox = document.getElementById('manual-guide-box');
        const guideContent = document.getElementById('guide-content');
        if (guideBox && guideContent) {
            guideBox.classList.remove('hidden');
            guideContent.innerText = game.manual_guide;
        }
    }
}

function renderSpecs(containerId, specObj) {
    const container = document.getElementById(containerId);
    if (!container || !specObj) return;
    container.innerHTML = `
        <li><span class="text-gray-500 uppercase text-[8px] font-black">OS:</span> ${specObj.os || '-'}</li>
        <li><span class="text-gray-500 uppercase text-[8px] font-black">CPU:</span> ${specObj.cpu || '-'}</li>
        <li><span class="text-gray-500 uppercase text-[8px] font-black">RAM:</span> ${specObj.ram || '-'}</li>
        <li><span class="text-gray-500 uppercase text-[8px] font-black">GPU:</span> ${specObj.gpu || '-'}</li>
    `;
}

// --- 3. REVIEW SYSTEM ---
window.setRating = (n) => {
    window.selectedRating = n;
    const stars = document.querySelectorAll('#star-rating-input .star-btn');
    stars.forEach((s, i) => {
        if (i < n) {
            s.style.opacity = "1";
            s.classList.add('active');
        } else {
            s.style.opacity = "0.2";
            s.classList.remove('active');
        }
    });
};

window.submitReview = async () => {
    const commentInput = document.getElementById('review-comment');
    const comment = commentInput.value.trim();
    
    if (window.selectedRating === 0) return alert("Pilih bintang terlebih dahulu!");
    
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return alert("Silakan login untuk mengirim ulasan.");

    const btn = document.getElementById('btn-submit-review');
    btn.disabled = true;
    btn.innerText = "POSTING...";

    const { error } = await _supabase.from('reviews').insert([{
        game_id: gameId,
        user_id: user.id,
        rating: window.selectedRating,
        comment: comment
    }]);

    if (error) {
        if(error.code === '23505') alert("Anda sudah mereview game ini.");
        else alert("Gagal mengirim: " + error.message);
    } else {
        commentInput.value = "";
        window.setRating(0);
        await loadReviews(); 
    }
    btn.disabled = false;
    btn.innerText = "POST REVIEW";
};

async function loadReviews() {
    try {
        const { data: reviews, error } = await _supabase
            .from('reviews')
            .select(`
                id, rating, comment, created_at,
                profiles:user_id ( full_name, avatar_url )
            `)
            .eq('game_id', gameId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderReviewList(reviews);
        calculateAvgRating(reviews);
    } catch (e) { console.error("Review Load Error:", e); }
}

function renderReviewList(reviews) {
    const container = document.getElementById('reviews-list');
    if(!container) return;
    
    container.innerHTML = reviews.length === 0 ? 
        `<p class="col-span-full text-center py-10 opacity-30 text-[10px] font-black uppercase italic">No Feedback Yet</p>` : '';
    
    reviews.forEach(rev => {
        const stars = "⭐".repeat(rev.rating);
        const name = rev.profiles?.full_name || "Vault Hunter";
        const avatar = rev.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${name}&background=A855F7&color=fff`;

        container.innerHTML += `
            <div class="glass-card p-6 rounded-[30px] border border-white/5 animate-fade-in text-left">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <img src="${avatar}" class="w-10 h-10 rounded-full border border-white/10 object-cover">
                        <div>
                            <p class="text-[10px] font-black uppercase text-white">${name}</p>
                            <p class="text-[7px] text-gray-500 font-bold uppercase">${new Date(rev.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="text-[9px]">${stars}</div>
                </div>
                <p class="text-xs text-gray-400 leading-relaxed font-medium">"${rev.comment || 'No comment.'}"</p>
            </div>`;
    });
}

function calculateAvgRating(reviews) {
    const valDisplay = document.getElementById('avg-rating-value');
    if (!valDisplay) return;
    if (reviews.length === 0) { valDisplay.innerText = "0.0"; return; }
    const total = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    valDisplay.innerText = (total / reviews.length).toFixed(1);
}

function subscribeToReviews() {
    _supabase.channel(`reviews_${gameId}`).on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'reviews', filter: `game_id=eq.${gameId}` 
    }, () => loadReviews()).subscribe();
}

// --- 4. CART SYSTEM ---
window.addToCart = async (gid) => {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) { alert("Login Required!"); return window.location.href = 'login.html'; }

    const { error } = await _supabase.from('cart').insert([{ user_id: user.id, game_id: gid }]);
    if (error) {
        if (error.code === '23505') return alert("Already in cart!");
        return alert("Error: " + error.message);
    }
    
    alert("Added to Cart! 🛒");
    updateCartBadge();
};

async function updateCartBadge() {
    const { data: { user } } = await _supabase.auth.getUser();
    const badge = document.getElementById('cart-badge');
    if (!user || !badge) return;
    const { count } = await _supabase.from('cart').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    badge.innerText = count || 0;
    badge.classList.toggle('hidden', !count);
}

window.openCart = () => { 
    if (cartModal) {
        cartModal.classList.remove('hidden'); 
        cartModal.classList.add('flex'); 
        renderCartItems(); 
    }
};

window.closeCart = () => { 
    if (cartModal) {
        cartModal.classList.add('hidden'); 
        cartModal.classList.remove('flex'); 
    }
};

window.renderCartItems = async () => {
    const { data: { user } } = await _supabase.auth.getUser();
    const container = document.getElementById('cart-items');
    if (!container) return;

    const { data: items } = await _supabase.from('cart').select('id, games(*)').eq('user_id', user.id);
    
    container.innerHTML = (!items || items.length === 0) ? `<p class="text-center py-10 opacity-30 text-[10px] font-black uppercase">Cart Empty</p>` : '';
    let subtotal = 0;
    items?.forEach(item => {
        const p = item.games.discount_price || item.games.price;
        subtotal += p;
        container.innerHTML += `
            <div class="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5 mb-2">
                <div class="flex items-center gap-4 text-left">
                    <img src="${item.games.thumbnail}" class="w-12 h-12 rounded-xl object-cover">
                    <div>
                        <p class="text-[11px] font-black uppercase leading-none text-white">${item.games.title}</p>
                        <p class="text-[10px] font-bold text-purple-400 mt-1">${formatRupiah(p)}</p>
                    </div>
                </div>
                <button onclick="removeFromCart('${item.id}')" class="text-red-500 p-2">×</button>
            </div>`;
    });
    const totalEl = document.getElementById('cart-total-price');
    if (totalEl) totalEl.innerText = formatRupiah(subtotal);
};

window.removeFromCart = async (cid) => { 
    await _supabase.from('cart').delete().eq('id', cid); 
    renderCartItems(); 
    updateCartBadge(); 
};

// --- 5. CHECKOUT & PAYMENT ---
window.handleBuy = async () => {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return window.location.href = 'login.html';
    isCartCheckout = false;
    setupPayment(currentGameData.discount_price > 0 ? currentGameData.discount_price : currentGameData.price);
};

window.handleCartCheckout = async () => {
    const { data: { user } } = await _supabase.auth.getUser();
    const { data: items } = await _supabase.from('cart').select('games(price, discount_price)').eq('user_id', user.id);
    if (!items?.length) return alert("Cart is empty!");
    isCartCheckout = true;
    let total = items.reduce((sum, i) => sum + (i.games.discount_price || i.games.price), 0);
    closeCart(); 
    setupPayment(total);
};

function setupPayment(amount) {
    const uniqueCode = Math.floor(Math.random() * 899) + 100;
    finalAmountAfterUniqueCode = amount + uniqueCode;
    const priceDisplay = document.getElementById('modal-total-price');
    if (priceDisplay) priceDisplay.innerText = formatRupiah(finalAmountAfterUniqueCode);
    if (modal) {
        modal.classList.remove('hidden'); 
        modal.classList.add('flex');
    }
}

window.processStrictVerification = async (event) => {
    const btn = document.getElementById('confirm-payment-btn');
    const fileInput = document.getElementById('payment-proof');
    const { data: { user } } = await _supabase.auth.getUser();

    if (!fileInput.files[0]) return alert("Upload receipt first!");
    btn.innerText = "AI SCANNING..."; btn.disabled = true;

    try {
        const file = fileInput.files[0];
        const { data: { text } } = await Tesseract.recognize(file, 'eng');
        const cleanOcr = text.replace(/[^0-9]/g, "");

        if (cleanOcr.includes(finalAmountAfterUniqueCode.toString())) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            
            // STORAGE UPLOAD TO 'payments' BUCKET
            const { error: uploadError } = await _supabase.storage.from('payments').upload(`proofs/${fileName}`, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = _supabase.storage.from('payments').getPublicUrl(`proofs/${fileName}`);

            if (isCartCheckout) {
                const { data: items } = await _supabase.from('cart').select('game_id, games(title)').eq('user_id', user.id);
                for (const item of items) {
                    await _supabase.from('library').upsert({ user_id: user.id, game_id: item.game_id, status: 'approved', payment_proof: publicUrl });
                    await _supabase.from('orders').insert({ user_id: user.id, game_id: item.game_id, item_name: item.games.title, amount: finalAmountAfterUniqueCode, status: 'success' });
                }
                await _supabase.from('cart').delete().eq('user_id', user.id);
            } else {
                await _supabase.from('library').upsert({ user_id: user.id, game_id: gameId, status: 'approved', payment_proof: publicUrl });
                await _supabase.from('orders').insert({ user_id: user.id, game_id: gameId, item_name: currentGameData.title, amount: finalAmountAfterUniqueCode, status: 'success' });
            }
            
            // Send Notification
            await _supabase.from('vault_notifications').insert([{ 
                user_id: user.id, 
                title: 'Vault Unlocked', 
                message: isCartCheckout ? 'Multiple items added to library.' : `${currentGameData.title} is now available.` 
            }]);

            alert("VERIFIED! Vault Unlocked. 🚀"); 
            location.reload();
        } else {
            alert(`AI REJECTED: Nominal Rp${finalAmountAfterUniqueCode} not detected.`);
            btn.disabled = false; btn.innerText = "Verify Identity";
        }
    } catch (err) { 
        console.error(err);
        alert("Verification System Error: " + err.message); 
        btn.disabled = false; 
        btn.innerText = "Verify Identity";
    }
};

// --- 6. ACCESS GATE ---
window.verifyAccess = () => {
    const inputVal = document.getElementById('input-verify-pass').value.trim().toUpperCase();
    if (inputVal === activeWeeklyPass.toUpperCase()) {
        document.getElementById('verification-gate').classList.add('hidden');
        document.getElementById('real-download-links').classList.remove('hidden');
        const container = document.getElementById('links-container');
        container.innerHTML = '';
        currentGameData.download_links?.forEach(link => {
            const icon = link.icon === 'tool' ? '🛠️' : (link.icon === 'fix' ? '🔧' : '📦');
            container.innerHTML += `
                <a href="${link.url}" target="_blank" class="flex items-center justify-between bg-white/5 border border-white/5 p-5 rounded-3xl hover:bg-purple-600 transition-all group active-scale">
                    <div class="flex items-center gap-4">
                        <span class="text-2xl">${icon}</span>
                        <div class="flex flex-col text-left">
                            <span class="text-[8px] font-black uppercase opacity-50">Cloud Access</span>
                            <span class="text-xs font-bold uppercase text-white">${link.label}</span>
                        </div>
                    </div>
                    <span class="text-[10px] font-black text-purple-400 group-hover:text-white">GET →</span>
                </a>`;
        });
    } else { alert("PASSCODE INVALID!"); }
};

function updateAccessUI() {
    const actionArea = document.getElementById('action-area');
    const mobileActionBar = document.getElementById('mobile-action-area');

    if (currentStatus === 'approved') {
        const downloadSection = document.getElementById('download-section');
        if (downloadSection) downloadSection.classList.remove('hidden');
        
        const successHTML = `
            <div class="w-full bg-green-500/10 text-green-400 p-6 rounded-[32px] text-center border border-green-500/20 font-black uppercase text-[11px] italic animate-fade-in flex items-center justify-center gap-3">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
                Game sudah masuk ke library
            </div>
        `;

        if (actionArea) actionArea.innerHTML = successHTML;
        if (mobileActionBar) mobileActionBar.innerHTML = successHTML;
    }
}

window.closeModal = () => { 
    if (modal) {
        modal.classList.add('hidden'); 
        modal.classList.remove('flex'); 
    }
};

document.addEventListener('DOMContentLoaded', loadGameDetail);