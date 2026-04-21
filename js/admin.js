/**
 * GAMEVORA - Admin Logic (V10.4 Automated Sync System)
 * Fitur: Master User Control, Ban System, Order Management, & Inventory CRUD
 */

const SUPABASE_URL = 'https://meruqlvbymsaeaxybxaz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JpMK5MzO-awEkOOvr7t-xg_bBkobHLf'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
const gameForm = document.getElementById('master-upload-form');
const btnSubmit = document.getElementById('main-upload-btn');
const adminTableBody = document.getElementById('inventory-list');
const orderTableBody = document.getElementById('order-list');
const userTableBody = document.getElementById('user-master-list');
const formTitle = document.getElementById('form-title');

let isEditMode = false;
let editTargetId = null;
let allUsersMaster = []; // Cache untuk fitur search

// --- 1. PASSWORD & HELPER ---

function getWeeklyAutoPass() {
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((now - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
    return `GV-${now.getFullYear()}-W${weekNumber}`;
}

const showToast = (message) => alert(message);

// --- 2. USER MANAGEMENT (MASTER CONTROL) ---

window.fetchMasterUsers = async () => {
    if (!userTableBody) return;

    try {
        // Ambil profil sebagai data utama, gabungkan dengan library untuk hitung item
        const { data: users, error } = await _supabase
            .from('profiles')
            .select('*, library(id, status, games(title))');

        if (error) throw error;

        allUsersMaster = users || [];
        renderUserTable(allUsersMaster);

    } catch (err) {
        console.error("User Fetch Error:", err);
        userTableBody.innerHTML = '<tr><td colspan="4" class="p-10 text-center text-red-500 uppercase text-[10px] font-black">Failed to load users</td></tr>';
    }
};

function renderUserTable(data) {
    userTableBody.innerHTML = data.map(u => {
        const approved = u.library ? u.library.filter(l => l.status === 'approved') : [];
        const isBanned = u.is_banned || false;
        
        return `
        <tr class="hover:bg-white/[0.02] border-b border-white/5 transition ${isBanned ? 'opacity-40' : ''}">
            <td class="px-8 py-5 text-left">
                <p class="text-xs font-bold text-white uppercase">${u.full_name || 'Anonymous'}</p>
                <p class="text-[8px] font-mono text-gray-500">${u.id}</p>
            </td>
            <td class="px-8 py-5 text-left">
                <button onclick="showUserHistory('${u.id}')" class="text-purple-400 font-black text-[10px] uppercase underline decoration-purple-500/30">
                    ${approved.length} Items Owned
                </button>
            </td>
            <td class="px-8 py-5 text-left">
                <span class="px-3 py-1 rounded-full text-[8px] font-black uppercase ${isBanned ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}">
                    ${isBanned ? 'Banned' : 'Active'}
                </span>
            </td>
            <td class="px-8 py-5 text-right">
                <button onclick="toggleBan('${u.id}', ${isBanned})" class="text-[9px] font-black uppercase underline ${isBanned ? 'text-green-400' : 'text-red-500'} transition-all">
                    ${isBanned ? 'Unban User' : 'Ban User'}
                </button>
            </td>
        </tr>`;
    }).join('');
}

// Search User Logic
const searchUserInput = document.getElementById('search-user-input');
if (searchUserInput) {
    searchUserInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        const filtered = allUsersMaster.filter(u => 
            (u.full_name || '').toLowerCase().includes(val) || 
            u.id.toLowerCase().includes(val)
        );
        renderUserTable(filtered);
    });
}

window.toggleBan = async (uid, status) => {
    if(!confirm(status ? "Restore account access?" : "Permanently BAN this user?")) return;
    try {
        const { error } = await _supabase.from('profiles').update({ is_banned: !status }).eq('id', uid);
        if (error) throw error;
        fetchMasterUsers();
    } catch (err) { alert(err.message); }
};

window.showUserHistory = async (uid) => {
    const modal = document.getElementById('history-modal');
    const content = document.getElementById('history-content');
    
    try {
        const { data: history, error } = await _supabase.from('library').select('*, games(title)').eq('user_id', uid);
        if (error) throw error;

        content.innerHTML = (!history || history.length === 0) ? 
            '<p class="text-center opacity-30 py-10 uppercase text-[10px] font-black">No purchase history found</p>' : 
            history.map(h => `
                <div class="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                        <p class="font-black uppercase text-xs text-white">${h.games?.title || 'Game Deleted'}</p>
                        <p class="text-[8px] opacity-40 uppercase tracking-widest">${new Date(h.created_at).toLocaleDateString()}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-[8px] font-black uppercase ${h.status === 'approved' ? 'text-green-500' : 'text-yellow-500'}">${h.status}</span>
                        <button onclick="deletePurchase('${h.id}', '${uid}')" class="text-red-500 text-[10px] font-black uppercase hover:underline">Revoke</button>
                    </div>
                </div>`).join('');
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (err) { alert(err.message); }
};

window.deletePurchase = async (id, uid) => {
    if(!confirm("Revoke this item from user library?")) return;
    await _supabase.from('library').delete().eq('id', id);
    closeHistory();
    fetchMasterUsers(); // Refresh counts
};

window.closeHistory = () => document.getElementById('history-modal').classList.add('hidden');

// --- 3. ORDER MANAGEMENT ---

window.fetchOrders = async () => {
    if(!orderTableBody) return;
    const { data: orders, error } = await _supabase.from('library').select('*, games(title)').eq('status', 'pending').order('created_at', { ascending: false });
    if (error) return console.error(error);

    orderTableBody.innerHTML = (orders.length === 0) ? '<tr><td colspan="3" class="p-10 text-center opacity-50 uppercase text-[10px] font-black italic text-white">No pending orders</td></tr>' : '';

    orders.forEach(order => {
        orderTableBody.innerHTML += `
            <tr class="hover:bg-white/[0.02] transition">
                <td class="px-8 py-5 text-left">
                    <p class="text-[10px] text-white font-bold mb-1 uppercase tracking-tighter">UID: ${order.user_id.substring(0,8)}...</p>
                    <a href="${order.proof_url}" target="_blank" class="text-purple-400 font-black text-[9px] uppercase underline hover:text-white transition">Lihat Bukti Bayar 👁️</a>
                </td>
                <td class="px-8 py-5 text-left">
                    <span class="text-xs font-black uppercase italic text-white tracking-tight">${order.games?.title || 'Unknown Game'}</span>
                </td>
                <td class="px-8 py-5 text-right space-x-2">
                    <button onclick="updateStatus('${order.id}', 'approved')" class="bg-green-500 hover:bg-green-400 text-black px-5 py-2 rounded-xl text-[9px] font-black uppercase transition active-scale">Approve</button>
                    <button onclick="updateStatus('${order.id}', 'rejected')" class="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase border border-red-500/20 transition active-scale">Reject</button>
                </td>
            </tr>`;
    });
};

window.updateStatus = async (id, newStatus) => {
    let msg = newStatus === 'rejected' ? prompt("Reason:", "Invalid receipt.") : null;
    if(newStatus === 'rejected' && msg === null) return;
    
    await _supabase.from('library').update({ status: newStatus, rejection_message: msg, updated_at: new Date().toISOString() }).eq('id', id);
    showToast(`Order ${newStatus.toUpperCase()}!`);
    fetchOrders();
    fetchMasterUsers();
};

// --- 4. INVENTORY CRUD ---

window.fetchInventory = async () => {
    if(!adminTableBody) return;
    const { data: games, error } = await _supabase.from('games').select('*').order('created_at', { ascending: false });
    if (error) return console.error(error);

    adminTableBody.innerHTML = '';
    const pass = getWeeklyAutoPass();

    games.forEach(game => {
        adminTableBody.innerHTML += `
            <tr class="hover:bg-white/[0.02] transition border-b border-white/5">
                <td class="px-8 py-5 flex items-center gap-4 text-left">
                    <img src="${game.thumbnail}" class="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-lg">
                    <div>
                        <p class="text-xs font-black uppercase italic text-white leading-tight">${game.title}</p>
                        <p class="text-[8px] text-green-400 font-mono mt-1">PASS: ${pass}</p>
                    </div>
                </td>
                <td class="px-8 py-5 text-left">
                    <span class="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-400/10 px-3 py-1.5 rounded-lg border border-purple-400/20">${game.genre || 'UNSET'}</span>
                </td>
                <td class="px-8 py-5 text-right">
                    <div class="flex justify-end gap-4">
                        <button onclick='prepareEdit(${JSON.stringify(game)})' class="text-blue-400 font-black text-[9px] uppercase hover:text-white transition">Edit</button>
                        <button onclick="deleteGame('${game.id}')" class="text-red-500 font-black text-[9px] uppercase hover:text-white transition">Delete</button>
                    </div>
                </td>
            </tr>`;
    });
};

window.deleteGame = async (id) => {
    if (!confirm("Delete permanently?")) return;
    await _supabase.from('games').delete().eq('id', id);
    fetchInventory();
};

window.prepareEdit = (game) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    isEditMode = true;
    editTargetId = game.id;
    formTitle.innerText = "Edit Mode: " + game.title;
    btnSubmit.innerText = "Update Existing Record";

    document.getElementById('title').value = game.title;
    document.getElementById('genre').value = game.genre || '';
    document.getElementById('connectivity_type').value = game.connectivity_type || 'Offline';
    document.getElementById('is_trending').checked = game.is_trending || false;
    document.getElementById('price').value = game.price;
    document.getElementById('discount_price').value = game.discount_price || '';
    document.getElementById('thumbnail').value = game.thumbnail;
    document.getElementById('description').value = game.description;
};

const resetForm = () => {
    gameForm.reset();
    isEditMode = false;
    editTargetId = null;
    formTitle.innerText = "Vault Uploader";
    btnSubmit.innerText = "Push to Database";
};

gameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    btnSubmit.innerText = "⏳ PROCESSING...";
    btnSubmit.disabled = true;

    try {
        const customLinks = [];
        document.querySelectorAll('.link-row').forEach(row => {
            const icon = row.querySelector('select').value;
            const label = row.querySelector('input[type="text"]').value.trim();
            const url = row.querySelector('input[type="url"]').value.trim();
            if (url) customLinks.push({ icon, label: label || "Download", url });
        });

        const gameData = {
            title: document.getElementById('title').value,
            genre: document.getElementById('genre').value,
            connectivity_type: document.getElementById('connectivity_type').value,
            is_trending: document.getElementById('is_trending').checked,
            price: parseInt(document.getElementById('price').value) || 0,
            discount_price: parseInt(document.getElementById('discount_price').value) || 0,
            description: document.getElementById('description').value,
            thumbnail: document.getElementById('thumbnail').value,
            download_links: customLinks,
            updated_at: new Date().toISOString()
        };

        const { error } = isEditMode ? 
            await _supabase.from('games').update(gameData).eq('id', editTargetId) : 
            await _supabase.from('games').insert([gameData]);

        if (error) throw error;
        showToast("Success!"); resetForm(); fetchInventory();
    } catch (err) { alert(err.message); } finally {
        btnSubmit.innerText = "Push to Database"; btnSubmit.disabled = false;
    }
});

// --- 5. INITIALIZE ---

document.addEventListener('DOMContentLoaded', () => {
    fetchInventory(); fetchOrders(); fetchMasterUsers();
    
    _supabase.channel('admin-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'library' }, () => {
        fetchOrders(); fetchMasterUsers();
    })
    .subscribe();
});