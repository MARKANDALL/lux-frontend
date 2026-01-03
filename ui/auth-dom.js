import { supabase } from "../src/supabase.js";
import { API_BASE } from "/src/api/util.js";

export function initAuthUI() {
  renderAuthButton();
  handleAuthStateChange();
}

// 1. Render Top-Right Button
function renderAuthButton() {
  if (document.getElementById("lux-auth-btn")) return;

  const btn = document.createElement("button");
  btn.id = "lux-auth-btn";
  
btn.style.cssText = `
  position: fixed; top: 16px; right: 16px;
  z-index: 900; padding: 8px 16px;
  background: #fff; border: 1px solid #cbd5e1; border-radius: 20px;
  color: #475569; font-size: 0.85rem; font-weight: 700;
  cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  transition: all 0.2s; display: flex; align-items: center; gap: 6px;
`;

  
  btn.onmouseover = () => { btn.style.transform = "translateY(-1px)"; btn.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)"; };
  btn.onmouseout = () => { btn.style.transform = "translateY(0)"; btn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.05)"; };

  btn.textContent = "💾 Save Progress";
  btn.onclick = openLoginModal;
  document.body.appendChild(btn);
}

// 2. Login Modal
function openLoginModal() {
  if (document.getElementById("lux-auth-modal")) return;

  const modal = document.createElement("div");
  modal.id = "lux-auth-modal";
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease-out;
  `;
  
  if (!document.getElementById("auth-anim")) {
    const s = document.createElement("style");
    s.id = "auth-anim";
    s.textContent = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
    document.head.appendChild(s);
  }

  modal.innerHTML = `
    <div style="background:#fff; padding:24px; border-radius:16px; width:90%; max-width:340px; text-align:center; box-shadow:0 10px 25px rgba(0,0,0,0.2); position:relative;">
      <button id="lux-auth-close" style="position:absolute; top:12px; right:12px; border:none; background:none; font-size:1.2rem; cursor:pointer; color:#94a3b8;">&times;</button>
      
      <h3 style="margin:0 0 8px 0; color:#1e293b; font-size:1.4rem;">Save Your Progress</h3>
      <p style="font-size:0.95em; color:#64748b; margin-bottom:24px; line-height:1.5;">
        Sign in to keep your history safe and access it from any device.
      </p>
      
      <input type="email" id="lux-auth-email" placeholder="name@email.com" 
        style="width:100%; padding:12px; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:16px; font-size:1rem; box-sizing:border-box;">
        
      <button id="lux-auth-submit" style="width:100%; padding:12px; background:#0078d7; color:#fff; border:none; border-radius:8px; font-weight:700; font-size:1rem; cursor:pointer; transition:background 0.2s;">
        Send Magic Link 🪄
      </button>
      
      <div style="margin-top:16px; font-size:0.8rem; color:#94a3b8;">
        We'll email you a login link. No password needed.
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById("lux-auth-close").onclick = () => modal.remove();
  
  document.getElementById("lux-auth-submit").onclick = async () => {
    const email = document.getElementById("lux-auth-email").value.trim();
    const btn = document.getElementById("lux-auth-submit");
    
    if(!email || !email.includes("@")) return alert("Please enter a valid email address.");
    
    btn.textContent = "Sending...";
    btn.disabled = true;
    btn.style.opacity = "0.7";
    
    const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: { emailRedirectTo: window.location.origin }
    });
    
    if (error) {
      alert("Login Error: " + error.message);
      btn.textContent = "Try Again";
      btn.disabled = false;
      btn.style.opacity = "1";
    } else {
      modal.querySelector("div").innerHTML = `
        <div style="padding:20px;">
          <div style="font-size:3rem; margin-bottom:16px;">📧</div>
          <h3 style="color:#10b981; margin:0 0 12px 0;">Check your email!</h3>
          <p style="color:#475569; margin-bottom:20px; line-height:1.5;">
            We sent a magic link to <strong>${email}</strong>.<br>
            Click it to log in.
          </p>
          <button onclick="document.getElementById('lux-auth-modal').remove()" 
            style="padding:10px 24px; background:#f1f5f9; border:none; border-radius:8px; color:#475569; font-weight:600; cursor:pointer;">
            Close
          </button>
        </div>
      `;
    }
  };
}

// 3. Auth State Handler + Migration Trigger
function handleAuthStateChange() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    const btn = document.getElementById("lux-auth-btn");
    if (!btn) return;

    if (session?.user) {
      // LOGGED IN
      const email = session.user.email;
      const name = email.split("@")[0];
      const realUid = session.user.id;
      
      btn.textContent = `👤 ${name}`;
      btn.style.borderColor = "#bbf7d0";
      btn.style.background = "#f0fdf4";
      btn.style.color = "#166534";
      
      btn.onclick = () => {
        if(confirm(`Signed in as ${email}.\n\nDo you want to log out?`)) {
          supabase.auth.signOut();
          window.location.reload(); // Hard reload to clear state
        }
      };
      
      // --- THE MIGRATION CHECK ---
      const guestUid = localStorage.getItem("LUX_USER_ID");
      
      // If we have a guest ID, and it's NOT the same as our new Real ID, migrate!
      if (guestUid && guestUid !== realUid) {
          console.log("[Auth] Migrating guest history...", guestUid, "->", realUid);
          await migrateHistory(guestUid, realUid);
      }

      // Update global ID to the Real ID
      window.LUX_USER_ID = realUid;
      localStorage.setItem("LUX_USER_ID", realUid); // Persist the Real ID

      // Refresh Dashboard
      if (window.refreshDashboard) window.refreshDashboard();
      else {
          import('../features/dashboard/index.js').then(mod => {
              if (mod.refreshHistory) mod.refreshHistory();
          });
      }
      
    } else {
      // LOGGED OUT / GUEST
      btn.textContent = "💾 Save Progress";
      btn.style.borderColor = "#cbd5e1";
      btn.style.background = "#fff";
      btn.style.color = "#475569";
      btn.onclick = openLoginModal;
    }
  });
}

// 4. Migration API Call
async function migrateHistory(guestUid, userUid) {
    try {
        const res = await fetch(`${API_BASE}/api/migrate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestUid, userUid })
        });
        const data = await res.json();
        console.log("[Auth] Migration result:", data);
    } catch (e) {
        console.error("[Auth] Migration failed:", e);
    }
}