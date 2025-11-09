// Theme Toggle Functionality
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// Load saved theme
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.table-of-contents a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add scroll animations
    addScrollAnimations();
    
    // Add interactive effects
    addInteractiveEffects();
});

function addScrollAnimations() {
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
    
    // Observe all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
    
    // Observe cards
    const cards = document.querySelectorAll('.concept-card, .dependability-item, .redundancy-type');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

function addInteractiveEffects() {
    // Add hover effects to table rows
    const tableRows = document.querySelectorAll('.management-table tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.2s ease';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Add click effects to concept cards
    const conceptCards = document.querySelectorAll('.concept-card');
    conceptCards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'translateY(-8px)';
            }, 150);
        });
    });
    
    // Add progress indicator
    addProgressIndicator();
}

function addProgressIndicator() {
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 4px;
        background: linear-gradient(90deg, #7c3aed, #a855f7);
        z-index: 9999;
        transition: width 0.3s ease;
        border-radius: 0 2px 2px 0;
    `;
    document.body.appendChild(progressBar);
    
    // Update progress on scroll
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// Add floating particles effect
document.addEventListener('DOMContentLoaded', () => {
    createFloatingParticles();
});

function createFloatingParticles() {
    const container = document.querySelector('.container');
    
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(124, 58, 237, 0.6);
            border-radius: 50%;
            pointer-events: none;
            animation: float ${4 + Math.random() * 6}s infinite ease-in-out;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 3}s;
            z-index: -1;
        `;
        container.appendChild(particle);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
            opacity: 0.6; 
        }
        50% { 
            transform: translateY(-30px) rotate(180deg); 
            opacity: 1; 
        }
    }
    
    @keyframes pulse {
        0%, 100% { 
            box-shadow: 0 0 20px rgba(124, 58, 237, 0.3); 
        }
        50% { 
            box-shadow: 0 0 40px rgba(124, 58, 237, 0.6); 
        }
    }
    
    .concept-card:hover {
        animation: pulse 2s infinite;
    }
    
    .redundancy-type:hover {
        animation: pulse 2s infinite;
    }
`;
document.head.appendChild(style);

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const sections = document.querySelectorAll('.section');
        const currentSection = getCurrentSection();
        let nextIndex;
        
        if (e.key === 'ArrowDown') {
            nextIndex = Math.min(currentSection + 1, sections.length - 1);
        } else {
            nextIndex = Math.max(currentSection - 1, 0);
        }
        
        sections[nextIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
});

function getCurrentSection() {
    const sections = document.querySelectorAll('.section');
    const scrollTop = window.pageYOffset;
    
    for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (scrollTop >= section.offsetTop - 100) {
            return i;
        }
    }
    return 0;
}