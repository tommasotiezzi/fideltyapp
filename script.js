// Pricing type toggle
function togglePricingType(type) {
    const monthlyGrid = document.getElementById('pricing-monthly');
    const meteredGrid = document.getElementById('pricing-metered');
    const buttons = document.querySelectorAll('.pricing-toggle-btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (type === 'monthly') {
        monthlyGrid.style.display = 'grid';
        meteredGrid.style.display = 'none';
        buttons[0].classList.add('active');
    } else {
        monthlyGrid.style.display = 'none';
        meteredGrid.style.display = 'grid';
        buttons[1].classList.add('active');
    }
}

// Language switching
function switchLanguage(lang) {
    const buttons = document.querySelectorAll('.lang-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Save preference
    localStorage.setItem('preferredLanguage', lang);
    
    // Update all translatable elements
    updateTranslations(lang);
}

// Update translations based on language
function updateTranslations(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = getTranslation(key, lang);
        if (translation) {
            element.textContent = translation;
        }
    });
}

// Check for saved language preference on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    
    console.log('Hamburger:', hamburger);
    console.log('NavMenu:', navMenu);
    
    if (hamburger && navMenu) {
        console.log('Setting up hamburger listener');
        hamburger.addEventListener('click', (e) => {
            console.log('Hamburger clicked!');
            e.preventDefault();
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
            console.log('Menu active:', navMenu.classList.contains('active'));
        });
        
        // Close menu when clicking on a link
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                console.log('Link clicked, closing menu');
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    } else {
        console.error('Hamburger or menu not found!');
    }
    
    // Mobile tooltip click handling
    if (window.innerWidth <= 768) {
        console.log('Mobile mode - setting up tooltips');
        document.querySelectorAll('.info-tooltip').forEach(tooltip => {
            tooltip.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Tooltip clicked');
                
                // Close other tooltips
                document.querySelectorAll('.info-tooltip.active').forEach(other => {
                    if (other !== tooltip) {
                        other.classList.remove('active');
                    }
                });
                
                // Toggle this tooltip
                tooltip.classList.toggle('active');
            });
        });
        
        // Close tooltip when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('info-tooltip')) {
                document.querySelectorAll('.info-tooltip.active').forEach(tooltip => {
                    tooltip.classList.remove('active');
                });
            }
        });
    }
    
    // Language preference
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && savedLang !== 'it') {
        switchLanguage(savedLang);
        // Update button states
        document.querySelectorAll('.lang-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === savedLang.toUpperCase()) {
                btn.classList.add('active');
            }
        });
    }
    
    console.log('Setup complete');
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.nav');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.8)';
        navbar.style.boxShadow = 'none';
    }
    
    // Hide/show on scroll
    if (currentScroll > lastScroll && currentScroll > 200) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Add animation to elements
document.addEventListener('DOMContentLoaded', () => {
    // Animate feature cards
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.5s ease ${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Animate process steps
    document.querySelectorAll('.process-step').forEach((step, index) => {
        step.style.opacity = '0';
        step.style.transform = 'translateY(20px)';
        step.style.transition = `all 0.5s ease ${index * 0.2}s`;
        observer.observe(step);
    });
    
    // Animate metrics
    document.querySelectorAll('.metric').forEach((metric, index) => {
        metric.style.opacity = '0';
        metric.style.transform = 'translateY(20px)';
        metric.style.transition = `all 0.5s ease ${index * 0.1}s`;
        observer.observe(metric);
    });
});

// Animate chart bars on hover
const chartBars = document.querySelectorAll('.chart-bar');
chartBars.forEach(bar => {
    bar.addEventListener('mouseenter', () => {
        bar.style.transform = 'scaleY(1.1)';
    });
    bar.addEventListener('mouseleave', () => {
        bar.style.transform = 'scaleY(1)';
    });
});

// Button click effects
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple styles dynamically
const style = document.createElement('style');
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
    }
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Animate numbers when in view
const animateValue = (element, start, end, duration) => {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = end + (element.dataset.suffix || '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + (element.dataset.suffix || '');
        }
    }, 16);
};

// Observe metric values
const metricsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            const value = parseInt(entry.target.textContent);
            const suffix = entry.target.textContent.replace(/\d/g, '');
            entry.target.dataset.suffix = suffix;
            animateValue(entry.target, 0, value, 1000);
        }
    });
}, observerOptions);

document.querySelectorAll('.metric-value').forEach(metric => {
    metricsObserver.observe(metric);
});

// Add hover effect to loyalty card
const loyaltyCard = document.querySelector('.loyalty-card');
if (loyaltyCard) {
    loyaltyCard.addEventListener('mouseenter', () => {
        loyaltyCard.style.transform = 'rotate(-2deg) scale(1.05)';
    });
    loyaltyCard.addEventListener('mouseleave', () => {
        loyaltyCard.style.transform = 'rotate(0) scale(1)';
    });
}

console.log('Loyaly website initialized');