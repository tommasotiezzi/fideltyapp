// programs.js - Handle loyalty programs display and QR discovery flow

// Global variables
let currentUser = null;
let selectedCardForAuth = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, initializing...');
    
    // Check authentication
    await checkAuth();
    
    // Load programs from database
    await loadPrograms();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for QR redirect
    handleQRRedirect();
});

/**
 * Check if user is authenticated
 */
async function checkAuth() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
        
        const authBtn = document.getElementById('auth-btn');
        const userMenu = document.getElementById('user-menu');
        const userEmail = document.getElementById('user-email');
        
        if (user) {
            // User is logged in
            if (authBtn) authBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (userEmail) userEmail.textContent = user.email;
        } else {
            // User is not logged in
            if (authBtn) authBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

/**
 * Load all active loyalty programs from database
 */
async function loadPrograms() {
    const grid = document.getElementById('programs-grid');
    if (!grid) {
        console.error('Programs grid not found');
        return;
    }
    
    // Show loading state
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Loading programs...</div>';
    
    try {
        // Query the database for active loyalty cards
        const { data: programs, error } = await supabase
            .from('loyalty_cards')
            .select(`
                *,
                restaurants!inner (
                    name,
                    address,
                    city
                )
            `)
            .eq('is_active', true)
            .not('discovery_qr_code', 'is', null);
        
        if (error) {
            console.error('Database error:', error);
            throw error;
        }
        
        console.log('Programs from database:', programs);
        
        // Clear loading message
        grid.innerHTML = '';
        
        if (!programs || programs.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No active loyalty programs available.</div>';
            return;
        }
        
        // Check which cards the user already has (if logged in)
        let userCards = [];
        if (currentUser) {
            const { data: customerCards } = await supabase
                .from('customer_cards')
                .select('loyalty_card_id')
                .eq('customer_id', currentUser.id);  // Use customer_id column
            
            if (customerCards) {
                userCards = customerCards.map(c => c.loyalty_card_id);
            }
        }
        
        // Display each program
        programs.forEach(program => {
            const hasCard = userCards.includes(program.id);
            const card = createProgramCard(program, hasCard);
            grid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading programs:', error);
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">
            Error loading programs: ${error.message}
        </div>`;
    }
}

/**
 * Create a program card element
 */
function createProgramCard(program, userHasCard = false) {
    const card = document.createElement('div');
    card.className = 'program-card';
    card.dataset.cardId = program.id;
    card.dataset.qrCode = program.discovery_qr_code;
    card.dataset.restaurantId = program.restaurant_id;  // Add restaurant_id to dataset
    card.dataset.name = (program.display_name || '').toLowerCase();
    card.dataset.location = (program.restaurants?.city || '').toLowerCase();
    
    const stampsRequired = program.stamps_required || 10;
    let stampsHtml = '';
    for (let i = 0; i < Math.min(stampsRequired, 10); i++) {
        stampsHtml += `<div class="stamp-preview ${i < 3 ? 'demo-filled' : ''}">${i < 3 ? '✓' : ''}</div>`;
    }
    
    // Background style
    let bgStyle = '';
    if (program.background_image_url) {
        bgStyle = `background-image: url('${program.background_image_url}'); background-size: cover; background-position: center;`;
    } else if (program.card_color) {
        bgStyle = `background: ${program.card_color};`;
    } else {
        bgStyle = 'background: linear-gradient(135deg, #7C3AED, #8B5CF6);';
    }
    
    // Button HTML based on whether user has the card
    const buttonHtml = userHasCard 
        ? `<button class="btn btn-secondary card-action-btn" disabled>
            ✓ You have this card
           </button>`
        : `<button class="btn btn-primary card-action-btn" onclick="getCard('${program.id}', '${program.restaurant_id}')">
            Get This Card
           </button>`;
    
    card.innerHTML = `
        <div class="card-preview" style="${bgStyle}">
            ${program.background_image_url ? '<div class="card-overlay"></div>' : ''}
            <div class="card-content-preview">
                <div class="card-header-preview">
                    <div class="card-logo-preview">
                        ${program.logo_url 
                            ? `<img src="${program.logo_url}" alt="${program.display_name}" style="width: 100%; height: 100%; object-fit: cover;">` 
                            : `<span style="color: white; font-weight: 600;">${program.display_name?.charAt(0) || 'T'}</span>`
                        }
                    </div>
                    <div>
                        <div class="card-restaurant-name">${program.display_name || 'Restaurant'}</div>
                        ${program.location_name ? `<div class="card-location-text">${program.location_name}</div>` : ''}
                    </div>
                </div>
                
                <div class="stamps-preview">
                    ${stampsHtml}
                </div>
                
                <div class="card-reward-preview">
                    <span>Reward:</span>
                    <strong>${program.reward_text || 'Free Item'}</strong>
                </div>
            </div>
        </div>
        
        <div class="card-info-section">
            <div class="restaurant-info">
                <div class="restaurant-name-link">${program.restaurants?.name || program.display_name}</div>
                ${program.restaurants?.address ? `
                    <div class="restaurant-address">
                        📍 ${program.restaurants.address}
                    </div>
                ` : ''}
            </div>
            
            <div class="card-stats">
                <div class="stat-item">
                    <div class="stat-number">${program.active_users || 0}</div>
                    <div class="stat-label">Active Users</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stampsRequired}</div>
                    <div class="stat-label">Stamps Needed</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${program.total_stamps || 0}</div>
                    <div class="stat-label">Rewards Given</div>
                </div>
            </div>
            
            ${buttonHtml}
        </div>
    `;
    
    return card;
}

/**
 * Handle getting a card - this is called when the button is clicked
 */
window.getCard = async function(cardId, restaurantId) {
    console.log('Getting card:', cardId, 'from restaurant:', restaurantId);
    selectedCardForAuth = cardId;
    
    if (!currentUser) {
        // User not logged in - open auth modal
        openAuthModal();
        return;
    }
    
    // User is logged in - add the card
    try {
        // Check if user already has this card
        const { data: existing } = await supabase
            .from('customer_cards')
            .select('id')
            .eq('customer_id', currentUser.id)
            .eq('loyalty_card_id', cardId)
            .single();
        
        if (existing) {
            alert('You already have this card!');
            return;
        }
        
        // Add card to user with restaurant_id
        const { error } = await supabase
            .from('customer_cards')
            .insert({
                customer_id: currentUser.id,
                loyalty_card_id: cardId,
                restaurant_id: restaurantId,  // Include restaurant_id
                current_stamps: 0
            });
        
        if (error) throw error;
        
        // Show success in modal
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');
        const successState = document.getElementById('success-state');
        
        if (signinForm) signinForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'none';
        if (successState) successState.style.display = 'block';
        
        // Auto-reload after 2 seconds
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('Error adding card:', error);
        alert('Error adding card. Please try again.');
    }
}

/**
 * Open auth modal
 */
window.openAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (!modal) {
        console.error('Auth modal not found');
        return;
    }
    
    modal.style.display = 'flex';
    
    // Show signin form by default
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const successState = document.getElementById('success-state');
    
    if (signinForm) signinForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
    if (successState) successState.style.display = 'none';
}

/**
 * Close auth modal
 */
window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedCardForAuth = null;
}

/**
 * Switch to sign up form
 */
window.switchToSignUp = function() {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const modalTitle = document.getElementById('modal-title');
    
    if (signinForm) signinForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'block';
    if (modalTitle) modalTitle.textContent = 'Sign Up to Get Card';
}

/**
 * Switch to sign in form
 */
window.switchToSignIn = function() {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const modalTitle = document.getElementById('modal-title');
    
    if (signinForm) signinForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
    if (modalTitle) modalTitle.textContent = 'Sign In to Get Card';
}

/**
 * Sign in
 */
window.signIn = async function() {
    const emailInput = document.getElementById('signin-email');
    const passwordInput = document.getElementById('signin-password');
    
    if (!emailInput || !passwordInput) {
        console.error('Sign in form elements not found');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        
        // If we have a selected card, add it
        if (selectedCardForAuth) {
            // Handle both object format (from QR) and string format (from regular click)
            if (typeof selectedCardForAuth === 'object') {
                await getCard(selectedCardForAuth.cardId, selectedCardForAuth.restaurantId);
            } else {
                // For regular clicks, we need to find the restaurant_id
                const card = document.querySelector(`[data-card-id="${selectedCardForAuth}"]`);
                const restaurantId = card?.dataset.restaurantId;
                if (restaurantId) {
                    await getCard(selectedCardForAuth, restaurantId);
                }
            }
        }
        
        // Close modal and refresh
        closeAuthModal();
        window.location.reload();
        
    } catch (error) {
        console.error('Sign in error:', error);
        alert(error.message || 'Error signing in');
    }
}

/**
 * Sign up
 */
window.signUp = async function() {
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    
    if (!nameInput || !emailInput || !passwordInput) {
        console.error('Sign up form elements not found');
        return;
    }
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        currentUser = data.user;
        
        // Show success message in modal
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');
        const successState = document.getElementById('success-state');
        const modalTitle = document.getElementById('modal-title');
        const successMessage = successState?.querySelector('p');
        
        if (signinForm) signinForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'none';
        if (successState) {
            successState.style.display = 'block';
            if (successMessage) {
                successMessage.textContent = 'Account created! Check your email to confirm.';
            }
        }
        if (modalTitle) modalTitle.textContent = 'Success!';
        
        // If we have a selected card, add it after a short delay
        if (selectedCardForAuth && currentUser) {
            setTimeout(async () => {
                await getCard(selectedCardForAuth);
            }, 1000);
        } else {
            // Reload after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
        
    } catch (error) {
        console.error('Sign up error:', error);
        alert(error.message || 'Error signing up');
    }
}

/**
 * Sign out
 */
window.signOut = async function() {
    try {
        await supabase.auth.signOut();
        currentUser = null;
        window.location.reload();
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

/**
 * View my cards (placeholder - would navigate to wallet)
 */
window.viewMyCards = function() {
    alert('Wallet feature coming soon!');
    closeAuthModal();
}

/**
 * Handle QR code redirect
 */
function handleQRRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const qrCode = urlParams.get('qr');
    
    if (qrCode) {
        console.log('QR code detected:', qrCode);
        
        // Wait for cards to load then show as overlay
        setTimeout(() => {
            const targetCard = document.querySelector(`[data-qr-code="${qrCode}"]`);
            if (targetCard) {
                // Create overlay
                const overlay = document.createElement('div');
                overlay.className = 'qr-card-overlay';
                overlay.onclick = function(e) {
                    if (e.target === overlay) {
                        overlay.remove();
                        // Remove QR parameter from URL
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, newUrl);
                    }
                };
                
                // Clone the card and add to overlay
                const cardClone = targetCard.cloneNode(true);
                cardClone.className = 'program-card qr-highlighted-card';
                
                // Create container for the card
                const container = document.createElement('div');
                container.className = 'qr-card-container';
                
                // Add close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'qr-close-btn';
                closeBtn.innerHTML = '×';
                closeBtn.onclick = function() {
                    overlay.remove();
                    // Remove QR parameter from URL
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, newUrl);
                };
                
                container.appendChild(closeBtn);
                container.appendChild(cardClone);
                overlay.appendChild(container);
                
                // Add to body
                document.body.appendChild(overlay);
                
                // If user not logged in, set this as selected card
                if (!currentUser) {
                    const cardId = targetCard.dataset.cardId;
                    const restaurantId = targetCard.dataset.restaurantId;
                    if (cardId) {
                        selectedCardForAuth = { cardId, restaurantId };  // Store both
                    }
                }
            }
        }, 1000);
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-programs');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterPrograms(query);
        });
    }
    
    // Location filters
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter by location
            const location = btn.dataset.location;
            filterByLocation(location);
        });
    });
    
    // Auth button
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        authBtn.addEventListener('click', openAuthModal);
    }
}

/**
 * Filter programs by search query
 */
function filterPrograms(query) {
    const cards = document.querySelectorAll('.program-card');
    
    cards.forEach(card => {
        const name = card.dataset.name || '';
        const location = card.dataset.location || '';
        
        if (name.includes(query) || location.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Filter programs by location
 */
function filterByLocation(location) {
    const cards = document.querySelectorAll('.program-card');
    
    cards.forEach(card => {
        if (location === 'all' || card.dataset.location === location) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}