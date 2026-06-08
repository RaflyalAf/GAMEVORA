/**
 * GAMEVORA - Auth Logic (Final Robust Version)
 * Fitur: Sesi Berlapis, Role Management, & Navigasi Mobile-Ready
 */

const SUPABASE_URL = 'https://meruqlvbymsaeaxybxaz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JpMK5MzO-awEkOOvr7t-xg_bBkobHLf'; 
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 1. Pengecekan Sesi & Update UI
 */
async function checkSession() {
    try {
        // Ambil data user dari auth session
        const { data: { user }, error: userError } = await _supabase.auth.getUser();
        
        if (userError || !user) {
            console.log("No active session.");
            return;
        }

        // Ambil data profil tambahan (Role)
        let profileRole = null;
        const { data: profile } = await _supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        if (profile) profileRole = profile.role;

        // Gunakan interval singkat untuk menunggu elemen DOM siap (penting untuk iOS/Slow Network)
        const checkInterval = setInterval(() => {
            const navAuth = document.getElementById('nav-auth');
            const adminLink = document.getElementById('admin-link');
            const authPlaceholder = document.getElementById('auth-placeholder');

            if (navAuth) {
                // Sembunyikan tombol login bawaan
                if (authPlaceholder) authPlaceholder.style.display = 'none';

                // Logika Penentuan Akses Admin
                const isAdmin = 
                    user.app_metadata?.role === 'admin' || 
                    profileRole === 'admin' || 
                    user.email === 'raflyalfazari622@gmail.com'; 
                
                if (isAdmin && adminLink) {
                    adminLink.classList.remove('hidden');
                    // Paksa inline-block untuk layout navigasi flex
                    adminLink.style.display = 'inline-block';
                }

                // Render Menu Logout & Username (Mobile Ready)
                if (!document.getElementById('user-logged-in')) {
                    const userMenu = document.createElement('div');
                    userMenu.id = "user-logged-in";
                    // Menggunakan whitespace-nowrap agar tidak terpotong di HP
                    userMenu.className = "flex items-center gap-3 ml-2 whitespace-nowrap";
                    userMenu.innerHTML = `
                        <div class="flex flex-col items-end hidden sm:flex">
                            <span class="text-[8px] text-gray-500 font-black uppercase tracking-tighter">Verified User</span>
                            <span class="text-[10px] text-white font-bold uppercase tracking-widest">${user.email.split('@')[0]}</span>
                        </div>
                        <button onclick="handleLogout()" class="active-scale text-[9px] font-black text-red-500 hover:bg-red-500 hover:text-white transition border border-red-500/20 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                            LOGOUT
                        </button>
                    `;
                    navAuth.appendChild(userMenu);
                }
                clearInterval(checkInterval);
            }
        }, 50);

        // Proteksi memory leak: stop cek jika elemen tidak ketemu dalam 5 detik
        setTimeout(() => clearInterval(checkInterval), 5000);

    } catch (err) {
        console.error("Auth Logic Error:", err);
    }
}

/**
 * 2. Global Logout Handler
 */
window.handleLogout = async function() {
    if (!confirm("Ingin keluar dari Vault?")) return;
    
    try {
        const { error } = await _supabase.auth.signOut();
        if (error) throw error;
        
        // Redirect ke index dan bersihkan history
        window.location.replace("index.html");
    } catch (err) {
        alert("Gagal Logout: " + err.message);
    }
}

/**
 * 3. Inisialisasi Saat Halaman Dimuat
 */
document.addEventListener('DOMContentLoaded', checkSession);

// Tambahkan proteksi CSS via JS jika diperlukan untuk memastikan 'hidden' terangkat
const style = document.createElement('style');
style.innerHTML = `
    .active-scale:active { transform: scale(0.95); transition: 0.1s; }
    #user-logged-in button { -webkit-tap-highlight-color: transparent; }
`;
document.head.appendChild(style);