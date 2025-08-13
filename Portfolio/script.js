// Enhanced Portfolio JavaScript with Dynamic Interactions

// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
}

// Smooth scrolling for navigation links
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

// Enhanced Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const scrollY = window.scrollY;
    
    if (navbar) {
        if (scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
            navbar.style.backdropFilter = 'blur(15px)';
        }
    }
});

// Active navigation highlighting
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Scroll animations for elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            
            // Add staggered animation for skill items
            if (entry.target.classList.contains('skill-category')) {
                const skillItems = entry.target.querySelectorAll('.skill-item');
                skillItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.style.transform = 'translateY(0)';
                        item.style.opacity = '1';
                    }, index * 100);
                });
            }
        }
    });
}, observerOptions);

// Enhanced typing animation
const typingWords = ['AI Development', 'Web Applications', 'Python Programming', 'Full Stack Development', 'Problem Solving'];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingSpeed = 100;
const deletingSpeed = 50;
const pauseTime = 2000;

function typeWriter() {
    const typingElement = document.querySelector('.typing-words');
    if (!typingElement) return;
    
    const currentWord = typingWords[wordIndex];
    
    if (isDeleting) {
        typingElement.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingElement.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
    }
    
    let nextDelay = isDeleting ? deletingSpeed : typingSpeed;
    
    if (!isDeleting && charIndex === currentWord.length) {
        nextDelay = pauseTime;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % typingWords.length;
    }
    
    setTimeout(typeWriter, nextDelay);
}

// Contact form handling with multiple submission options
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const name = formData.get('name');
        const email = formData.get('email');
        const subject = formData.get('subject');
        const message = formData.get('message');
        
        // Basic validation
        if (!name || !email || !subject || !message) {
            showNotification('Please fill in all fields!', 'error');
            return;
        }
        
        // Email validation
        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address!', 'error');
            return;
        }
        
        // Show submission options to user
        showContactOptions(name, email, subject, message);
    });
}

// Show contact submission options
function showContactOptions(name, email, subject, message) {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div class="contact-modal-overlay">
            <div class="contact-modal">
                <h3>Choose how to send your message:</h3>
                <div class="contact-options">
                    <button class="contact-option" data-option="email">
                        <i class="fas fa-envelope"></i>
                        <span>Send via Email</span>
                        <small>Opens your email client</small>
                    </button>
                    <button class="contact-option" data-option="linkedin">
                        <i class="fab fa-linkedin"></i>
                        <span>Connect on LinkedIn</span>
                        <small>Send LinkedIn message</small>
                    </button>
                    <button class="contact-option" data-option="copy">
                        <i class="fas fa-copy"></i>
                        <span>Copy Message</span>
                        <small>Copy to clipboard</small>
                    </button>
                    <button class="contact-option" data-option="whatsapp">
                        <i class="fab fa-whatsapp"></i>
                        <span>Send via WhatsApp</span>
                        <small>Open WhatsApp chat</small>
                    </button>
                </div>
                <button class="modal-close">&times;</button>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
    `;
    
    const overlay = modal.querySelector('.contact-modal-overlay');
    overlay.style.cssText = `
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
    `;
    
    const modalContent = modal.querySelector('.contact-modal');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        position: relative;
        text-align: center;
    `;
    
    const optionsContainer = modal.querySelector('.contact-options');
    optionsContainer.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin: 20px 0;
    `;
    
    modal.querySelectorAll('.contact-option').forEach(option => {
        option.style.cssText = `
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        `;
        
        option.addEventListener('mouseenter', () => {
            option.style.background = '#4f46e5';
            option.style.color = 'white';
            option.style.borderColor = '#4f46e5';
            option.style.transform = 'translateY(-3px)';
        });
        
        option.addEventListener('mouseleave', () => {
            option.style.background = '#f8fafc';
            option.style.color = 'initial';
            option.style.borderColor = '#e2e8f0';
            option.style.transform = 'translateY(0)';
        });
    });
    
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 20px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    `;
    
    document.body.appendChild(modal);
    
    // Handle option clicks
    modal.addEventListener('click', (e) => {
        const option = e.target.closest('.contact-option');
        if (option) {
            const optionType = option.dataset.option;
            handleContactSubmission(optionType, name, email, subject, message);
            document.body.removeChild(modal);
        } else if (e.target.classList.contains('modal-close') || e.target.classList.contains('contact-modal-overlay')) {
            document.body.removeChild(modal);
        }
    });
}

// Handle different contact submission methods
function handleContactSubmission(option, name, email, subject, message) {
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    switch(option) {
        case 'email':
            // Open default email client
            const emailBody = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
            const mailtoLink = `mailto:devansh.pandey@email.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
            window.open(mailtoLink);
            showNotification('Email client opened! Please send the email from there.', 'success');
            contactForm.reset();
            break;
            
        case 'linkedin':
            // Open LinkedIn with pre-filled message
            const linkedinMessage = `Hi Devansh! I'm ${name} (${email})\n\nSubject: ${subject}\n\n${message}`;
            const linkedinUrl = `https://www.linkedin.com/messaging/compose/?recipient=devansh-pandey-77aa882a1&body=${encodeURIComponent(linkedinMessage)}`;
            window.open(linkedinUrl, '_blank');
            showNotification('LinkedIn opened! Please send the message from there.', 'success');
            contactForm.reset();
            break;
            
        case 'copy':
            // Copy message to clipboard
            const messageText = `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`;
            navigator.clipboard.writeText(messageText).then(() => {
                showNotification('Message copied to clipboard! You can paste it in an email.', 'success');
                contactForm.reset();
            }).catch(() => {
                showNotification('Failed to copy message. Please try another option.', 'error');
            });
            break;
            
        case 'whatsapp':
            // Open WhatsApp with pre-filled message
            const whatsappMessage = `Hi Devansh! I'm ${name} (${email})\n\nSubject: ${subject}\n\n${message}`;
            const whatsappUrl = `https://wa.me/918707719436?text=${encodeURIComponent(whatsappMessage)}`;
            window.open(whatsappUrl, '_blank');
            showNotification('WhatsApp opened! Please send the message from there.', 'success');
            contactForm.reset();
            break;
    }
}

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? 'linear-gradient(45deg, #10b981, #059669)' : 
                    type === 'error' ? 'linear-gradient(45deg, #ef4444, #dc2626)' : 
                    'linear-gradient(45deg, #3b82f6, #2563eb)'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        transform: translateX(400px);
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// CV Download functionality
const downloadCVBtn = document.getElementById('downloadCV');
if (downloadCVBtn) {
    downloadCVBtn.addEventListener('click', () => {
        showNotification('CV download feature will be available soon!', 'info');
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Start typing animation
    setTimeout(typeWriter, 1000);
    
    // Setup animations for elements
    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach(el => {
        el.classList.add('will-animate');
        observer.observe(el);
    });
    
    // Setup skill items animation
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach(item => {
        item.style.transform = 'translateY(20px)';
        item.style.opacity = '0';
        item.style.transition = 'all 0.5s ease';
    });
    
    // Enhanced interactions
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add navigation styles
    const style = document.createElement('style');
    style.textContent = `
        .nav-link.active {
            color: #4f46e5 !important;
            background: rgba(79, 70, 229, 0.15);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
        }
    `;
    document.head.appendChild(style);
});