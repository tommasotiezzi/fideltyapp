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
    
    // Initialize App CTA
    initializeAppCTA();
});

/**
 * Check if user is authenticated
 */
async function checkAuth() {
    console.log('Checking authentication...');
    try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Auth response:', user);
        currentUser = user;
        
        const authBtn = document.getElementById('auth-btn');
        const userMenu = document.getElementById('user-menu');
        const userEmail = document.getElementById('user-email');
        
        if (user) {
            console.log('User is logged in:', user.email);
            // User is logged in
            if (authBtn) authBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (userEmail) userEmail.textContent = user.email;
        } else {
            console.log('User is NOT logged in');
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
    console.log('Loading programs from database...');
    const grid = document.getElementById('programs-grid');
    if (!grid) {
        console.error('Programs grid not found');
        return;
    }
    
    // Show loading state
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Loading programs...</div>';
    
    try {
        // Query the database for active loyalty cards WITHOUT restaurants join
        console.log('Executing query...');
        const { data: programs, error } = await supabase
            .from('loyalty_cards')
            .select('*')
            .eq('is_active', true)
            .not('discovery_qr_code', 'is', null);
        
        console.log('Query response - data:', programs);
        console.log('Query response - error:', error);
        
        if (error) {
            console.error('Database error:', error);
            throw error;
        }
        
        console.log('Number of programs found:', programs?.length || 0);
        
        // Clear loading message
        grid.innerHTML = '';
        
        if (!programs || programs.length === 0) {
            console.log('No programs found');
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No active loyalty programs available.</div>';
            return;
        }
        
        // Check which cards the user already has (if logged in)
        let userCardsMap = {};
        if (currentUser) {
            console.log('Fetching user cards for:', currentUser.id);
            const { data: customerCards, error: cardsError } = await supabase
                .from('customer_cards')
                .select('loyalty_card_id, current_stamps, is_completed, card_number')
                .eq('customer_id', currentUser.id);
            
            console.log('User cards response - data:', customerCards);
            console.log('User cards response - error:', cardsError);
            
            if (customerCards) {
                // Create a map of card_id -> {stamps, completed, cardNumber}
                customerCards.forEach(card => {
                    userCardsMap[card.loyalty_card_id] = {
                        stamps: card.current_stamps || 0,
                        completed: card.is_completed || false,
                        cardNumber: card.card_number
                    };
                });
                console.log('User cards map:', userCardsMap);
            }
        }
        
        // Display each program
        console.log('Creating program cards...');
        programs.forEach((program, index) => {
            console.log(`Creating card ${index + 1}:`, program);
            const userCardData = userCardsMap[program.id];
            const card = createProgramCard(program, userCardData);
            grid.appendChild(card);
        });
        
        console.log('All cards created successfully!');
        
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
function createProgramCard(program, userCardData = null) {
    const card = document.createElement('div');
    card.className = 'program-card';
    card.dataset.cardId = program.id;
    card.dataset.qrCode = program.discovery_qr_code;
    card.dataset.restaurantId = program.restaurant_id;
    card.dataset.name = (program.display_name || '').toLowerCase();
    card.dataset.location = (program.location_name || '').toLowerCase();
    
    const stampsRequired = program.stamps_required || 10;
    const userHasCard = userCardData !== null;
    const currentStamps = userCardData?.stamps || 0;
    const isCompleted = userCardData?.completed || false;
    const cardNumber = userCardData?.cardNumber;
    
    // Add data attribute for filtering owned cards
    card.dataset.owned = userHasCard ? 'true' : 'false';
    
    // Generate stamps HTML with actual user progress
    let stampsHtml = '';
    for (let i = 0; i < Math.min(stampsRequired, 10); i++) {
        const isFilled = userHasCard ? (i < currentStamps) : (i < 3); // Show user's actual stamps or demo 3 stamps
        stampsHtml += `<div class="stamp-preview ${isFilled ? 'demo-filled' : ''}">${isFilled ? '✓' : ''}</div>`;
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
    let buttonHtml;
    if (isCompleted) {
        buttonHtml = `<button class="btn btn-success" style="background: #10B981; color: white; cursor: default;" disabled>
            🎉 Reward Earned!
           </button>`;
    } else if (userHasCard) {
        buttonHtml = `
            <div style="background: #f0f0f0; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 12px;">
                <div style="font-size: 24px; font-weight: 700; color: #7c5ce6;">${currentStamps}/${stampsRequired}</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Stamps</div>
            </div>
            <button class="btn btn-primary card-action-btn" onclick="showQRCode('${program.id}', '${program.display_name}', ${cardNumber})" style="background: #7c5ce6;">
                Show QR Code
            </button>
        `;
    } else {
        buttonHtml = `<button class="btn btn-primary card-action-btn" onclick="getCard('${program.id}', '${program.restaurant_id}')">
            Get This Card
           </button>`;
    }
    
    // Add visual badge for owned cards
    const ownedBadge = userHasCard ? `
        <div style="position: absolute; top: 12px; right: 12px; background: rgba(124, 92, 230, 0.95); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            ✓ Your Card
        </div>
    ` : '';
    
    // Add light overlay for cards user doesn't own
    const grayOverlay = !userHasCard ? `
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.3); z-index: 1; pointer-events: none;"></div>
    ` : '';
    
    card.innerHTML = `
        <div class="card-preview" style="${bgStyle}; position: relative;">
            ${ownedBadge}
            ${grayOverlay}
            <div class="card-content-preview" style="position: relative; z-index: 1;">
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
                <div class="restaurant-name-link">${program.display_name || 'Restaurant'}</div>
                ${program.location_address ? `
                    <div class="restaurant-address">
                        📍 ${program.location_address}
                    </div>
                ` : ''}
            </div>
            
            <div class="card-stats">
                <div class="stat-item">
                    <div class="stat-number">${stampsRequired}</div>
                    <div class="stat-label">Stamps to Reward</div>
                </div>
            </div>
            
            ${buttonHtml}
        </div>
    `;
    
    return card;
}

/**
 * Show QR Code Modal
 */
window.showQRCode = async function(cardId, restaurantName, cardNumber) {
    console.log('Showing QR code for card:', cardId, 'Card number:', cardNumber);
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'qr-modal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = `
        <div class="modal-backdrop" onclick="closeQRModal()"></div>
        <div class="modal-content" style="max-width: 500px;">
            <button class="modal-close" onclick="closeQRModal()">×</button>
            
            <div style="text-align: center; padding: 20px 0;">
                <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">${restaurantName}</h2>
                <p style="font-size: 14px; color: #666; margin-bottom: 32px;">Scan Card</p>
                
                <!-- QR Code -->
                <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 32px;">
                    <div id="qr-code-container" style="display: flex; justify-content: center;"></div>
                </div>
                
                <p style="font-size: 16px; color: #666; margin-bottom: 24px;">
                    Show this code to staff to collect stamps
                </p>
                
                <!-- Card Number Display -->
                <div style="background: #f5f5f7; padding: 24px; border-radius: 16px; margin-top: 24px;">
                    <p style="font-size: 14px; color: #666; margin-bottom: 12px; font-weight: 500; letter-spacing: 0.5px;">
                        Card Number
                    </p>
                    <p style="font-size: 48px; font-weight: bold; color: #7c5ce6; letter-spacing: 2px; margin: 0; user-select: all;">
                        #${cardNumber}
                    </p>
                    <p style="font-size: 12px; color: #999; margin-top: 8px;">
                        For manual entry by staff
                    </p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Generate QR code using a library (you'll need to include qrcode.js)
    // For now, we'll use a simple approach with an API
    const qrContainer = document.getElementById('qr-code-container');
    if (qrContainer) {
        // Using qrcode.js library (add this script tag to your HTML: <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>)
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: cardId,
                width: 280,
                height: 280,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            // Fallback to QR code API
            qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(cardId)}" alt="QR Code" style="width: 280px; height: 280px;">`;
        }
    }
}

/**
 * Close QR Code Modal
 */
window.closeQRModal = function() {
    const modal = document.getElementById('qr-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Handle getting a card - this is called when the button is clicked
 * @param {string} cardId - The loyalty card ID
 * @param {string} restaurantId - The restaurant ID
 * @param {boolean} skipUIUpdate - If true, only add card without UI changes (for signup flow)
 */
window.getCard = async function(cardId, restaurantId, skipUIUpdate = false) {
    console.log('Getting card:', cardId, 'from restaurant:', restaurantId);
    selectedCardForAuth = cardId;
    
    if (!currentUser) {
        console.log('User not logged in, opening auth modal');
        // User not logged in - open auth modal
        openAuthModal();
        return;
    }
    
    // User is logged in - add the card
    try {
        console.log('Checking if user already has this card...');
        // Check if user already has this card
        const { data: existing, error: existingError } = await supabase
            .from('customer_cards')
            .select('id')
            .eq('customer_id', currentUser.id)
            .eq('loyalty_card_id', cardId)
            .single();
        
        console.log('Existing card check - data:', existing);
        console.log('Existing card check - error:', existingError);
        
        if (existing) {
            console.log('User already has this card');
            if (!skipUIUpdate) {
                alert('You already have this card!');
            }
            return;
        }
        
        console.log('Fetching loyalty card details...');
        // Fetch the loyalty card details to snapshot the display data
        const { data: loyaltyCard, error: fetchError } = await supabase
            .from('loyalty_cards')
            .select('*')
            .eq('id', cardId)
            .single();
        
        console.log('Loyalty card fetch - data:', loyaltyCard);
        console.log('Loyalty card fetch - error:', fetchError);
        
        if (fetchError) throw fetchError;
        
        console.log('Adding card to customer_cards...');
        // Add card to user with full snapshot data (matching Flutter app)
        const { data: insertData, error: insertError } = await supabase
            .from('customer_cards')
            .insert({
                customer_id: currentUser.id,
                loyalty_card_id: cardId,
                restaurant_id: restaurantId,
                current_stamps: 0,
                is_completed: false,
                // Snapshot data from loyalty_cards
                display_name: loyaltyCard.display_name,
                location_name: loyaltyCard.location_name,
                location_address: loyaltyCard.location_address,
                stamps_required: loyaltyCard.stamps_required,
                reward_text: loyaltyCard.reward_text,
                logo_url: loyaltyCard.logo_url,
                background_image_url: loyaltyCard.background_image_url,
                card_color: loyaltyCard.card_color,
                text_color: loyaltyCard.text_color,
                show_location_on_card: loyaltyCard.show_location_on_card || false,
            });
        
        console.log('Card insert - data:', insertData);
        console.log('Card insert - error:', insertError);
        
        if (insertError) throw insertError;
        
        console.log('Card added successfully!');
        
        // Only update UI if not skipped (direct button click vs signup flow)
        if (!skipUIUpdate) {
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
        }
        
    } catch (error) {
        console.error('Error adding card:', error);
        if (!skipUIUpdate) {
            alert('Error adding card. Please try again.');
        }
    }
}

/**
 * Open auth modal
 */
window.openAuthModal = function() {
    console.log('Opening auth modal');
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
    console.log('Closing auth modal');
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
    console.log('Switching to sign up form');
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
    console.log('Switching to sign in form');
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
    console.log('Attempting sign in...');
    const emailInput = document.getElementById('signin-email');
    const passwordInput = document.getElementById('signin-password');
    
    if (!emailInput || !passwordInput) {
        console.error('Sign in form elements not found');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    console.log('Sign in email:', email);
    
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        console.log('Sign in response - data:', data);
        console.log('Sign in response - error:', error);
        
        if (error) throw error;
        
        currentUser = data.user;
        console.log('Signed in successfully:', currentUser.email);
        
        // If we have a selected card, add it
        if (selectedCardForAuth) {
            console.log('Adding selected card:', selectedCardForAuth);
            // Handle both object format (from QR) and string format (from regular click)
            if (typeof selectedCardForAuth === 'object') {
                await getCard(selectedCardForAuth.cardId, selectedCardForAuth.restaurantId, true);
            } else {
                // For regular clicks, we need to find the restaurant_id
                const card = document.querySelector(`[data-card-id="${selectedCardForAuth}"]`);
                const restaurantId = card?.dataset.restaurantId;
                if (restaurantId) {
                    await getCard(selectedCardForAuth, restaurantId, true);
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
 * Sign up - Updated to create user profile
 */
window.signUp = async function() {
    console.log('Attempting sign up...');
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
    
    console.log('Sign up - name:', name, 'email:', email);
    
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
                    display_name: name
                }
            }
        });
        
        console.log('Sign up response - data:', data);
        console.log('Sign up response - error:', error);
        
        if (error) throw error;
        
        currentUser = data.user;
        console.log('Signed up successfully:', currentUser.email);
        
        // Create user profile entry (same as Flutter app)
        if (currentUser) {
            try {
                console.log('Creating user profile...');
                const { data: profileData, error: profileError } = await supabase
                    .from('user_profiles')
                    .insert({
                        user_id: currentUser.id,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                
                console.log('User profile created - data:', profileData);
                console.log('User profile created - error:', profileError);
            } catch (profileError) {
                console.error('Error creating user profile:', profileError);
                // Don't throw - user account is created, profile can be created later
            }
        }
        
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
                successMessage.textContent = 'Account created! Adding your card...';
            }
        }
        if (modalTitle) modalTitle.textContent = 'Success!';
        
        // If we have a selected card, add it after a short delay
        if (selectedCardForAuth && currentUser) {
            setTimeout(async () => {
                console.log('Adding selected card after signup:', selectedCardForAuth);
                // Handle both object format (from QR) and string format (from regular click)
                if (typeof selectedCardForAuth === 'object') {
                    await getCard(selectedCardForAuth.cardId, selectedCardForAuth.restaurantId, true);
                } else {
                    const card = document.querySelector(`[data-card-id="${selectedCardForAuth}"]`);
                    const restaurantId = card?.dataset.restaurantId;
                    if (restaurantId) {
                        await getCard(selectedCardForAuth, restaurantId, true);
                    }
                }
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
    console.log('Signing out...');
    try {
        await supabase.auth.signOut();
        currentUser = null;
        console.log('Signed out successfully');
        window.location.reload();
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

/**
 * View my cards - reload page to show updated cards
 */
window.viewMyCards = function() {
    console.log('Viewing my cards');
    closeAuthModal();
    window.location.reload();
}

/**
 * Handle QR code redirect
 */
function handleQRRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const qrCode = urlParams.get('qr');
    
    if (qrCode) {
        console.log('QR code detected in URL:', qrCode);
        
        // Wait for cards to load then show as overlay
        setTimeout(() => {
            const targetCard = document.querySelector(`[data-qr-code="${qrCode}"]`);
            console.log('Target card found:', targetCard);
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
                        selectedCardForAuth = { cardId, restaurantId };
                        console.log('Set selected card for auth:', selectedCardForAuth);
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
    console.log('Setting up event listeners...');
    
    // Search functionality
    const searchInput = document.getElementById('search-programs');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            console.log('Search query:', query);
            filterPrograms(query);
        });
    }
    
    // Location filters
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Filter clicked:', btn.dataset.location || btn.dataset.filter);
            // Update active state
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter by location or ownership
            const location = btn.dataset.location;
            const filter = btn.dataset.filter;
            
            if (filter === 'my-cards') {
                filterMyCards();
            } else if (location) {
                filterByLocation(location);
            }
        });
    });
    
    // Auth button
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        authBtn.addEventListener('click', openAuthModal);
    }
    
    // Check if coming from QR flow or logged in - show "My Cards" by default
    const urlParams = new URLSearchParams(window.location.search);
    const fromQR = urlParams.get('qr');
    
    if ((currentUser && fromQR) || (currentUser && !fromQR)) {
        // Auto-select "My Cards" if user is logged in
        setTimeout(() => {
            const myCardsBtn = document.querySelector('[data-filter="my-cards"]');
            if (myCardsBtn) {
                console.log('Auto-clicking My Cards button');
                myCardsBtn.click();
            }
        }, 100);
    }
}

/**
 * Filter to show only user's cards
 */
function filterMyCards() {
    console.log('Filtering to show only user cards');
    const cards = document.querySelectorAll('.program-card');
    let hasCards = false;
    
    cards.forEach(card => {
        if (card.dataset.owned === 'true') {
            card.style.display = 'block';
            hasCards = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    console.log('User has cards:', hasCards);
    
    // Show empty state if user has no cards
    if (!hasCards && currentUser) {
        const grid = document.getElementById('programs-grid');
        if (grid) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-state-inline';
            emptyMsg.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #666;';
            emptyMsg.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                <h3 style="font-size: 20px; color: #333; margin-bottom: 8px;">No cards yet</h3>
                <p style="margin-bottom: 20px;">Start collecting loyalty cards to earn rewards</p>
                <button class="btn btn-primary" onclick="document.querySelector('[data-location=\\'all\\']').click()">
                    Browse All Programs
                </button>
            `;
            
            // Remove old empty state if exists
            const oldEmpty = grid.querySelector('.empty-state-inline');
            if (oldEmpty) oldEmpty.remove();
            
            grid.appendChild(emptyMsg);
        }
    } else {
        // Remove empty state if it exists
        const emptyMsg = document.querySelector('.empty-state-inline');
        if (emptyMsg) emptyMsg.remove();
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
    console.log('Filtering by location:', location);
    const cards = document.querySelectorAll('.program-card');
    
    cards.forEach(card => {
        if (location === 'all' || card.dataset.location === location) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * App CTA functionality
 */
window.closeAppCTA = function() {
    const cta = document.getElementById('app-cta');
    if (cta) {
        cta.classList.add('hidden');
        document.body.classList.remove('app-cta-visible');
        // Remember user dismissed it (store in localStorage)
        localStorage.setItem('appCtaDismissed', 'true');
    }
}

/**
 * Initialize App CTA
 */
function initializeAppCTA() {
    const dismissed = localStorage.getItem('appCtaDismissed');
    if (!dismissed) {
        document.body.classList.add('app-cta-visible');
    } else {
        const cta = document.getElementById('app-cta');
        if (cta) cta.classList.add('hidden');
    }
    
    // Update store links based on device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    const appStoreLink = document.getElementById('app-store-link');
    const playStoreLink = document.getElementById('play-store-link');
    
    if (appStoreLink && playStoreLink) {
        // Replace # with your actual store URLs
        appStoreLink.href = 'https://apps.apple.com/app/your-app-id';
        playStoreLink.href = 'https://play.google.com/store/apps/details?id=your.package.name';
        
        // Hide non-relevant store on mobile
        if (isIOS && window.innerWidth <= 768) {
            playStoreLink.style.display = 'none';
        } else if (isAndroid && window.innerWidth <= 768) {
            appStoreLink.style.display = 'none';
        }
    }
}
