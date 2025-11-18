// programs.js - Handle loyalty programs display and QR discovery flow

// Global variables
let currentUser = null;
let selectedCardForAuth = null;
let currentLanguage = 'it';

// Language switching function
window.switchLanguage = function(lang) {
    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    
    // Update active button
    document.querySelectorAll('.lang-button').forEach(btn => {
        btn.classList.remove('active');
        if ((btn.textContent === 'IT' && lang === 'it') || (btn.textContent === 'EN' && lang === 'en')) {
            btn.classList.add('active');
        }
    });
    
    // Translations object
    const translations = {
        it: {
            appCtaTitle: 'Gestisci le tue carte facilmente',
            appCtaSubtitle: 'Scarica la nostra app per la migliore esperienza',
            heroTitle: 'Scopri i Programmi Fedeltà',
            heroSubtitle: 'Trova e iscriviti ai programmi fedeltà dei tuoi ristoranti preferiti. Non perdere mai più una tessera!',
            searchPlaceholder: 'Cerca ristoranti o località...',
            myCards: 'Le Mie Carte',
            allLocations: 'Tutte le Località',
            noPrograms: 'Nessun programma trovato',
            tryAdjusting: 'Prova a modificare la ricerca o i filtri',
            signInTitle: 'Accedi per Ottenere la Carta',
            signInSubtitle: 'Unisciti al programma fedeltà e inizia a guadagnare premi',
            signUpTitle: 'Registrati per Ottenere la Carta',
            email: 'Email',
            password: 'Password',
            name: 'Nome',
            signIn: 'Accedi',
            signUp: 'Registrati e Ottieni la Carta',
            noAccount: 'Non hai un account?',
            register: 'Registrati',
            hasAccount: 'Hai già un account?',
            cardSuccess: 'Carta Aggiunta con Successo!',
            startCollecting: 'Ora puoi iniziare a collezionare timbri',
            viewMyCards: 'Vedi le Mie Carte',
            signOut: 'Esci'
        },
        en: {
            appCtaTitle: 'Manage your cards easily',
            appCtaSubtitle: 'Download our app for the best experience',
            heroTitle: 'Discover Loyalty Programs',
            heroSubtitle: 'Find and join loyalty programs from your favorite restaurants. Never lose a stamp card again!',
            searchPlaceholder: 'Search restaurants or locations...',
            myCards: 'My Cards',
            allLocations: 'All Locations',
            noPrograms: 'No programs found',
            tryAdjusting: 'Try adjusting your search or filters',
            signInTitle: 'Sign In to Get Card',
            signInSubtitle: 'Join the loyalty program and start earning rewards',
            signUpTitle: 'Sign Up to Get Card',
            email: 'Email',
            password: 'Password',
            name: 'Name',
            signIn: 'Sign In',
            signUp: 'Sign Up & Get Card',
            noAccount: "Don't have an account?",
            register: 'Sign up',
            hasAccount: 'Already have an account?',
            cardSuccess: 'Card Added Successfully!',
            startCollecting: 'You can now start collecting stamps',
            viewMyCards: 'View My Cards',
            signOut: 'Sign Out'
        }
    };
    
    const t = translations[lang];
    
    // Update UI elements
    const appCtaTitle = document.querySelector('.app-cta-text h3');
    const appCtaSubtitle = document.querySelector('.app-cta-text p');
    const heroTitle = document.querySelector('.hero-content h1');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const searchInput = document.getElementById('search-programs');
    const myCardsBtn = document.querySelector('[data-filter="my-cards"]');
    const allLocationsBtn = document.querySelector('[data-location="all"]');
    const emptyStateH3 = document.querySelector('.empty-state h3');
    const emptyStateP = document.querySelector('.empty-state p');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const signupNameLabel = document.querySelector('label[for="signup-name"]');
    const signinEmailLabel = document.querySelector('label[for="signin-email"]');
    const signinPasswordLabel = document.querySelector('label[for="signin-password"]');
    const signupEmailLabel = document.querySelector('label[for="signup-email"]');
    const signupPasswordLabel = document.querySelector('label[for="signup-password"]');
    
    if (appCtaTitle) appCtaTitle.textContent = t.appCtaTitle;
    if (appCtaSubtitle) appCtaSubtitle.textContent = t.appCtaSubtitle;
    if (heroTitle) heroTitle.textContent = t.heroTitle;
    if (heroSubtitle) heroSubtitle.textContent = t.heroSubtitle;
    if (searchInput) searchInput.placeholder = t.searchPlaceholder;
    if (myCardsBtn) myCardsBtn.textContent = t.myCards;
    if (allLocationsBtn) allLocationsBtn.textContent = t.allLocations;
    if (emptyStateH3) emptyStateH3.textContent = t.noPrograms;
    if (emptyStateP) emptyStateP.textContent = t.tryAdjusting;
    if (signinEmailLabel) signinEmailLabel.textContent = t.email;
    if (signinPasswordLabel) signinPasswordLabel.textContent = t.password;
    if (signupNameLabel) signupNameLabel.textContent = t.name;
    if (signupEmailLabel) signupEmailLabel.textContent = t.email;
    if (signupPasswordLabel) signupPasswordLabel.textContent = t.password;
    
    // Update modal based on current form
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    if (signinForm && signinForm.style.display !== 'none') {
        if (modalTitle) modalTitle.textContent = t.signInTitle;
        if (modalSubtitle) modalSubtitle.textContent = t.signInSubtitle;
    } else if (signupForm && signupForm.style.display !== 'none') {
        if (modalTitle) modalTitle.textContent = t.signUpTitle;
        if (modalSubtitle) modalSubtitle.textContent = t.signInSubtitle;
    }
    
    // Update buttons text
    const signinBtn = document.querySelector('#signin-form .btn-primary');
    const signupBtn = document.querySelector('#signup-form .btn-primary');
    const signoutBtn = document.querySelector('#user-menu .btn-secondary');
    const successBtn = document.querySelector('#success-state .btn-primary');
    const successH3 = document.querySelector('#success-state h3');
    const successP = document.querySelector('#success-state p');
    
    if (signinBtn) signinBtn.textContent = t.signIn;
    if (signupBtn) signupBtn.textContent = t.signUp;
    if (signoutBtn) signoutBtn.textContent = t.signOut;
    if (successBtn) successBtn.textContent = t.viewMyCards;
    if (successH3) successH3.textContent = t.cardSuccess;
    if (successP) successP.textContent = t.startCollecting;
    
    // Update form footer links
    const signinFooter = document.querySelector('#signin-form .form-footer');
    const signupFooter = document.querySelector('#signup-form .form-footer');
    
    if (signinFooter) {
        signinFooter.innerHTML = t.noAccount + ' <a href="#" onclick="switchToSignUp(); return false;">' + t.register + '</a>';
    }
    if (signupFooter) {
        signupFooter.innerHTML = t.hasAccount + ' <a href="#" onclick="switchToSignIn(); return false;">' + t.signIn + '</a>';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded, initializing...');
    
    // Load saved language preference
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && savedLang !== 'it') {
        switchLanguage(savedLang);
    }
    
    // Check authentication
    await checkAuth();
    
    // Load programs from database
    await loadPrograms();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for QR redirect AND track the scan
    await handleQRRedirect();
    
    // Initialize App CTA
    initializeAppCTA();
});

/**
 * Track QR code scan in database
 */
async function trackQRScan(loyaltyCardId, userId = null) {
    try {
        console.log('Tracking QR scan for card:', loyaltyCardId, 'User:', userId);
        
        // Get IP address and user agent
        const userAgent = navigator.userAgent;
        let ipAddress = null;
        
        // Try to get IP address (this is optional and may not work due to CORS)
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ipAddress = ipData.ip;
        } catch (e) {
            console.log('Could not fetch IP address:', e);
        }
        
        // Insert scan record
        const { data, error } = await supabase
            .from('discovery_scans')
            .insert({
                loyalty_card_id: loyaltyCardId,
                user_id: userId,
                ip_address: ipAddress,
                user_agent: userAgent,
                converted_to_signup: userId !== null,
                scanned_at: new Date().toISOString()
            });
        
        if (error) {
            console.error('Error tracking QR scan:', error);
        } else {
            console.log('QR scan tracked successfully:', data);
        }
        
    } catch (error) {
        console.error('Error in trackQRScan:', error);
    }
}

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
            if (authBtn) authBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (userEmail) userEmail.textContent = user.email;
        } else {
            console.log('User is NOT logged in');
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
    
    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px;">Loading programs...</div>';
    
    try {
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
        
        console.log('Number of programs found:', programs ? programs.length : 0);
        
        grid.innerHTML = '';
        
        if (!programs || programs.length === 0) {
            console.log('No programs found');
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">No active loyalty programs available.</div>';
            return;
        }
        
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
        
        console.log('Creating program cards...');
        programs.forEach((program, index) => {
            console.log('Creating card ' + (index + 1) + ':', program);
            const userCardData = userCardsMap[program.id];
            const card = createProgramCard(program, userCardData);
            grid.appendChild(card);
        });
        
        console.log('All cards created successfully!');
        
    } catch (error) {
        console.error('Error loading programs:', error);
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ef4444;">Error loading programs: ' + error.message + '</div>';
    }
}

/**
 * Create a program card element
 */
function createProgramCard(program, userCardData) {
    const card = document.createElement('div');
    card.className = 'program-card';
    card.dataset.cardId = program.id;
    card.dataset.qrCode = program.discovery_qr_code || '';
    card.dataset.restaurantId = program.restaurant_id;
    card.dataset.name = (program.display_name || '').toLowerCase();
    card.dataset.location = (program.location_name || '').toLowerCase();
    
    const stampsRequired = program.stamps_required || 10;
    const userHasCard = userCardData !== null && userCardData !== undefined;
    const currentStamps = userCardData ? userCardData.stamps : 0;
    const isCompleted = userCardData ? userCardData.completed : false;
    const cardNumber = userCardData ? userCardData.cardNumber : null;
    
    card.dataset.owned = userHasCard ? 'true' : 'false';
    
    let stampsHtml = '';
    for (let i = 0; i < Math.min(stampsRequired, 10); i++) {
        const isFilled = userHasCard ? (i < currentStamps) : (i < 3);
        stampsHtml += '<div class="stamp-preview ' + (isFilled ? 'demo-filled' : '') + '">' + (isFilled ? '✓' : '') + '</div>';
    }
    
    let bgStyle = '';
    if (program.background_image_url) {
        bgStyle = "background-image: url('" + program.background_image_url + "'); background-size: cover; background-position: center;";
    } else if (program.card_color) {
        bgStyle = "background: " + program.card_color + ";";
    } else {
        bgStyle = 'background: linear-gradient(135deg, #7C3AED, #8B5CF6);';
    }
    
    let buttonHtml = '';
    if (isCompleted) {
        buttonHtml = '<button class="btn btn-success" style="background: #10B981; color: white; cursor: default;" disabled>🎉 Premio Ottenuto!</button>';
    } else if (userHasCard) {
        buttonHtml = '<div style="background: #f0f0f0; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 12px;"><div style="font-size: 24px; font-weight: 700; color: #000;">' + currentStamps + '/' + stampsRequired + '</div><div style="font-size: 12px; color: #666; margin-top: 4px;">Timbri</div></div><button class="btn btn-primary card-action-btn" onclick="showQRCode(\'' + program.id + '\', \'' + program.display_name + '\', ' + cardNumber + ')">Mostra Codice QR</button>';
    } else {
        buttonHtml = '<button class="btn btn-primary card-action-btn" onclick="getCard(\'' + program.id + '\', \'' + program.restaurant_id + '\')">Ottieni Questa Carta</button>';
    }
    
    const ownedBadge = userHasCard ? '<div style="position: absolute; top: 12px; right: 12px; background: linear-gradient(135deg, #FBD501 0%, #FFF9CF 50%, #E2AF11 100%); color: #000; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">✓ La Tua Carta</div>' : '';
    
    const grayOverlay = !userHasCard ? '<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.3); z-index: 1; pointer-events: none;"></div>' : '';
    
    const logoHtml = program.logo_url ? '<img src="' + program.logo_url + '" alt="' + program.display_name + '" style="width: 100%; height: 100%; object-fit: cover;">' : '<span style="color: white; font-weight: 600;">' + (program.display_name ? program.display_name.charAt(0) : 'T') + '</span>';
    
    const locationText = program.location_name ? '<div class="card-location-text">' + program.location_name + '</div>' : '';
    
    const addressHtml = program.location_address ? '<div class="restaurant-address">📍 ' + program.location_address + '</div>' : '';
    
    card.innerHTML = '<div class="card-preview" style="' + bgStyle + ' position: relative;">' + ownedBadge + grayOverlay + '<div class="card-content-preview" style="position: relative; z-index: 1;"><div class="card-header-preview"><div class="card-logo-preview">' + logoHtml + '</div><div><div class="card-restaurant-name">' + (program.display_name || 'Restaurant') + '</div>' + locationText + '</div></div><div class="stamps-preview">' + stampsHtml + '</div><div class="card-reward-preview"><span>Premio:</span><strong>' + (program.reward_text || 'Articolo Gratuito') + '</strong></div></div></div><div class="card-info-section"><div class="restaurant-info"><div class="restaurant-name-link">' + (program.display_name || 'Restaurant') + '</div>' + addressHtml + '</div><div class="card-stats"><div class="stat-item"><div class="stat-number">' + stampsRequired + '</div><div class="stat-label">Timbri per Premio</div></div></div>' + buttonHtml + '</div>';
    
    return card;
}

window.showQRCode = async function(cardId, restaurantName, cardNumber) {
    console.log('Showing QR code for card:', cardId, 'Card number:', cardNumber);
    
    const modal = document.createElement('div');
    modal.id = 'qr-modal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '10000';
    
    modal.innerHTML = '<div class="modal-backdrop" onclick="closeQRModal()"></div><div class="modal-content" style="max-width: 500px; max-height: 90vh; overflow-y: auto;"><button class="modal-close" onclick="closeQRModal()">×</button><div style="text-align: center; padding: 20px 0;"><h2 style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">' + restaurantName + '</h2><p style="font-size: 14px; color: #666; margin-bottom: 32px;">Scansiona la Carta</p><div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 32px;"><div id="qr-code-container" style="display: flex; justify-content: center;"></div></div><p style="font-size: 16px; color: #666; margin-bottom: 24px;">Mostra questo codice allo staff per collezionare timbri</p><div style="background: linear-gradient(135deg, #FBD501 0%, #FFF9CF 50%, #E2AF11 100%); padding: 24px; border-radius: 16px; margin-top: 24px;"><p style="font-size: 14px; color: #000; margin-bottom: 12px; font-weight: 500; letter-spacing: 0.5px;">Numero Carta</p><p style="font-size: 48px; font-weight: bold; color: #000; letter-spacing: 2px; margin: 0; user-select: all;">#' + cardNumber + '</p><p style="font-size: 12px; color: #666; margin-top: 8px;">Per inserimento manuale da parte dello staff</p></div></div></div>';
    
    document.body.appendChild(modal);
    
    const qrContainer = document.getElementById('qr-code-container');
    if (qrContainer) {
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
            qrContainer.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=' + encodeURIComponent(cardId) + '" alt="QR Code" style="width: 280px; height: 280px;">';
        }
    }
}

window.closeQRModal = function() {
    const modal = document.getElementById('qr-modal');
    if (modal) {
        modal.remove();
    }
}

window.getCard = async function(cardId, restaurantId, skipUIUpdate) {
    console.log('Getting card:', cardId, 'from restaurant:', restaurantId);
    selectedCardForAuth = cardId;
    
    if (!currentUser) {
        console.log('User not logged in, opening auth modal');
        openAuthModal();
        return;
    }
    
    try {
        console.log('Checking if user already has this card...');
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
        const { data: loyaltyCard, error: fetchError } = await supabase
            .from('loyalty_cards')
            .select('*')
            .eq('id', cardId)
            .single();
        
        console.log('Loyalty card fetch - data:', loyaltyCard);
        console.log('Loyalty card fetch - error:', fetchError);
        
        if (fetchError) throw fetchError;
        
        console.log('Adding card to customer_cards...');
        const { data: insertData, error: insertError } = await supabase
            .from('customer_cards')
            .insert({
                customer_id: currentUser.id,
                loyalty_card_id: cardId,
                restaurant_id: restaurantId,
                current_stamps: 0,
                is_completed: false,
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
        
        // Update discovery_scans to mark as converted
        await updateQRScanConversion(cardId, currentUser.id);
        
        if (!skipUIUpdate) {
            const signinForm = document.getElementById('signin-form');
            const signupForm = document.getElementById('signup-form');
            const successState = document.getElementById('success-state');
            
            if (signinForm) signinForm.style.display = 'none';
            if (signupForm) signupForm.style.display = 'none';
            if (successState) successState.style.display = 'block';
            
            setTimeout(function() {
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
 * Update the most recent QR scan to mark it as converted
 */
async function updateQRScanConversion(loyaltyCardId, userId) {
    try {
        console.log('Updating QR scan conversion for card:', loyaltyCardId, 'User:', userId);
        
        // Find the most recent scan for this card without a user_id
        const { data: scans, error: fetchError } = await supabase
            .from('discovery_scans')
            .select('id')
            .eq('loyalty_card_id', loyaltyCardId)
            .is('user_id', null)
            .order('scanned_at', { ascending: false })
            .limit(1);
        
        if (fetchError) {
            console.error('Error fetching scan:', fetchError);
            return;
        }
        
        if (scans && scans.length > 0) {
            const scanId = scans[0].id;
            
            // Update it with user_id and mark as converted
            const { error: updateError } = await supabase
                .from('discovery_scans')
                .update({
                    user_id: userId,
                    converted_to_signup: true
                })
                .eq('id', scanId);
            
            if (updateError) {
                console.error('Error updating scan conversion:', updateError);
            } else {
                console.log('QR scan marked as converted successfully');
            }
        }
        
    } catch (error) {
        console.error('Error in updateQRScanConversion:', error);
    }
}

window.openAuthModal = function() {
    console.log('Opening auth modal');
    const modal = document.getElementById('auth-modal');
    if (!modal) {
        console.error('Auth modal not found');
        return;
    }
    
    modal.style.display = 'flex';
    
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const successState = document.getElementById('success-state');
    
    if (signinForm) signinForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
    if (successState) successState.style.display = 'none';
}

window.closeAuthModal = function() {
    console.log('Closing auth modal');
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    selectedCardForAuth = null;
}

window.switchToSignUp = function() {
    console.log('Switching to sign up form');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const modalTitle = document.getElementById('modal-title');
    
    if (signinForm) signinForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'block';
    if (modalTitle) modalTitle.textContent = 'Sign Up to Get Card';
}

window.switchToSignIn = function() {
    console.log('Switching to sign in form');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const modalTitle = document.getElementById('modal-title');
    
    if (signinForm) signinForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
    if (modalTitle) modalTitle.textContent = 'Sign In to Get Card';
}

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
            email: email,
            password: password
        });
        
        console.log('Sign in response - data:', data);
        console.log('Sign in response - error:', error);
        
        if (error) throw error;
        
        currentUser = data.user;
        console.log('Signed in successfully:', currentUser.email);
        
        if (selectedCardForAuth) {
            console.log('Adding selected card:', selectedCardForAuth);
            if (typeof selectedCardForAuth === 'object') {
                await getCard(selectedCardForAuth.cardId, selectedCardForAuth.restaurantId, true);
            } else {
                const card = document.querySelector('[data-card-id="' + selectedCardForAuth + '"]');
                const restaurantId = card ? card.dataset.restaurantId : null;
                if (restaurantId) {
                    await getCard(selectedCardForAuth, restaurantId, true);
                }
            }
        }
        
        closeAuthModal();
        window.location.reload();
        
    } catch (error) {
        console.error('Sign in error:', error);
        alert(error.message || 'Error signing in');
    }
}

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
            email: email,
            password: password,
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
            }
        }
        
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');
        const successState = document.getElementById('success-state');
        const modalTitle = document.getElementById('modal-title');
        const successMessage = successState ? successState.querySelector('p') : null;
        
        if (signinForm) signinForm.style.display = 'none';
        if (signupForm) signupForm.style.display = 'none';
        if (successState) {
            successState.style.display = 'block';
            if (successMessage) {
                successMessage.textContent = 'Account created! Adding your card...';
            }
        }
        if (modalTitle) modalTitle.textContent = 'Success!';
        
        if (selectedCardForAuth && currentUser) {
            setTimeout(async function() {
                console.log('Adding selected card after signup:', selectedCardForAuth);
                if (typeof selectedCardForAuth === 'object') {
                    await getCard(selectedCardForAuth.cardId, selectedCardForAuth.restaurantId, true);
                } else {
                    const card = document.querySelector('[data-card-id="' + selectedCardForAuth + '"]');
                    const restaurantId = card ? card.dataset.restaurantId : null;
                    if (restaurantId) {
                        await getCard(selectedCardForAuth, restaurantId, true);
                    }
                }
            }, 1000);
        } else {
            setTimeout(function() {
                window.location.reload();
            }, 2000);
        }
        
    } catch (error) {
        console.error('Sign up error:', error);
        alert(error.message || 'Error signing up');
    }
}

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

window.viewMyCards = function() {
    console.log('Viewing my cards');
    closeAuthModal();
    window.location.reload();
}

async function handleQRRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const qrCode = urlParams.get('qr');
    
    if (qrCode) {
        console.log('QR code detected in URL:', qrCode);
        
        // Find the loyalty card by QR code
        try {
            const { data: loyaltyCard, error } = await supabase
                .from('loyalty_cards')
                .select('id')
                .eq('discovery_qr_code', qrCode)
                .single();
            
            if (error) {
                console.error('Error finding loyalty card:', error);
            } else if (loyaltyCard) {
                console.log('Found loyalty card for QR:', loyaltyCard.id);
                
                // Track the QR scan
                await trackQRScan(loyaltyCard.id, currentUser ? currentUser.id : null);
            }
        } catch (error) {
            console.error('Error in QR tracking:', error);
        }
        
        setTimeout(function() {
            const targetCard = document.querySelector('[data-qr-code="' + qrCode + '"]');
            console.log('Target card found:', targetCard);
            if (targetCard) {
                const overlay = document.createElement('div');
                overlay.className = 'qr-card-overlay';
                overlay.onclick = function(e) {
                    if (e.target === overlay) {
                        overlay.remove();
                        const newUrl = window.location.pathname;
                        window.history.replaceState({}, document.title, newUrl);
                    }
                };
                
                const cardClone = targetCard.cloneNode(true);
                cardClone.className = 'program-card qr-highlighted-card';
                
                const container = document.createElement('div');
                container.className = 'qr-card-container';
                
                const closeBtn = document.createElement('button');
                closeBtn.className = 'qr-close-btn';
                closeBtn.innerHTML = '×';
                closeBtn.onclick = function() {
                    overlay.remove();
                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, document.title, newUrl);
                };
                
                container.appendChild(closeBtn);
                container.appendChild(cardClone);
                overlay.appendChild(container);
                
                document.body.appendChild(overlay);
                
                if (!currentUser) {
                    const cardId = targetCard.dataset.cardId;
                    const restaurantId = targetCard.dataset.restaurantId;
                    if (cardId) {
                        selectedCardForAuth = { cardId: cardId, restaurantId: restaurantId };
                        console.log('Set selected card for auth:', selectedCardForAuth);
                    }
                }
            }
        }, 1000);
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    const searchInput = document.getElementById('search-programs');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            console.log('Search query:', query);
            filterPrograms(query);
        });
    }
    
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(function(btn) {
        btn.addEventListener('click', function() {
            console.log('Filter clicked:', btn.dataset.location || btn.dataset.filter);
            filterPills.forEach(function(b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            
            const location = btn.dataset.location;
            const filter = btn.dataset.filter;
            
            if (filter === 'my-cards') {
                filterMyCards();
            } else if (location) {
                filterByLocation(location);
            }
        });
    });
    
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        authBtn.addEventListener('click', openAuthModal);
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const fromQR = urlParams.get('qr');
    
    if ((currentUser && fromQR) || (currentUser && !fromQR)) {
        setTimeout(function() {
            const myCardsBtn = document.querySelector('[data-filter="my-cards"]');
            if (myCardsBtn) {
                console.log('Auto-clicking My Cards button');
                myCardsBtn.click();
            }
        }, 100);
    }
}

function filterMyCards() {
    console.log('Filtering to show only user cards');
    const cards = document.querySelectorAll('.program-card');
    let hasCards = false;
    
    cards.forEach(function(card) {
        if (card.dataset.owned === 'true') {
            card.style.display = 'block';
            hasCards = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    console.log('User has cards:', hasCards);
    
    if (!hasCards && currentUser) {
        const grid = document.getElementById('programs-grid');
        if (grid) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-state-inline';
            emptyMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #666;';
            emptyMsg.innerHTML = '<div style="font-size: 48px; margin-bottom: 16px;">📋</div><h3 style="font-size: 20px; color: #333; margin-bottom: 8px;">No cards yet</h3><p style="margin-bottom: 20px;">Start collecting loyalty cards to earn rewards</p><button class="btn btn-primary" onclick="document.querySelector(\'[data-location=\\\'all\\\']\').click()">Browse All Programs</button>';
            
            const oldEmpty = grid.querySelector('.empty-state-inline');
            if (oldEmpty) oldEmpty.remove();
            
            grid.appendChild(emptyMsg);
        }
    } else {
        const emptyMsg = document.querySelector('.empty-state-inline');
        if (emptyMsg) emptyMsg.remove();
    }
}

function filterPrograms(query) {
    const cards = document.querySelectorAll('.program-card');
    
    cards.forEach(function(card) {
        const name = card.dataset.name || '';
        const location = card.dataset.location || '';
        
        if (name.includes(query) || location.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterByLocation(location) {
    console.log('Filtering by location:', location);
    const cards = document.querySelectorAll('.program-card');
    
    cards.forEach(function(card) {
        if (location === 'all' || card.dataset.location === location) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

window.closeAppCTA = function() {
    const cta = document.getElementById('app-cta');
    if (cta) {
        cta.classList.add('hidden');
        document.body.classList.remove('app-cta-visible');
        localStorage.setItem('appCtaDismissed', 'true');
    }
}

function initializeAppCTA() {
    const dismissed = localStorage.getItem('appCtaDismissed');
    if (!dismissed) {
        document.body.classList.add('app-cta-visible');
    } else {
        const cta = document.getElementById('app-cta');
        if (cta) cta.classList.add('hidden');
    }
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = window.innerWidth <= 768;
    
    const appStoreLink = document.getElementById('app-store-link');
    const playStoreLink = document.getElementById('play-store-link');
    
    if (appStoreLink && playStoreLink) {
        appStoreLink.href = 'https://apps.apple.com/app/your-app-id';
        playStoreLink.href = 'https://play.google.com/store/apps/details?id=your.package.name';
        
        // Reset visibility
        appStoreLink.style.display = '';
        playStoreLink.style.display = '';
        
        // SOLO in vista mobile: mostra solo il bottone appropriato
        if (isMobile) {
            if (isIOS) {
                // iOS mobile: solo App Store
                playStoreLink.style.display = 'none';
            } else if (isAndroid) {
                // Android mobile: solo Play Store
                appStoreLink.style.display = 'none';
            }
        }
        // Desktop (>768px): mostra entrambi i bottoni (già fatto con reset)
    }
}