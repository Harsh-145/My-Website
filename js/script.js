// Music toggle functionality
const musicToggle = document.getElementById('music-toggle');
const bgMusic = document.getElementById('bg-music');
let isPlaying = false;

// Function to attempt playing music
function tryPlayMusic() {
    if (!isPlaying) {
        bgMusic.play().then(() => {
            musicToggle.textContent = '🔊';
            isPlaying = true;
            console.log('Music started playing');
        }).catch(error => {
            console.log('Autoplay prevented. User interaction required:', error);
        });
    }
}

// Try to auto-play music on page load
window.addEventListener('load', tryPlayMusic);

// Try to play on any user interaction (if not already playing)
document.addEventListener('click', tryPlayMusic, { once: true });
document.addEventListener('touchstart', tryPlayMusic, { once: true });
document.addEventListener('keydown', tryPlayMusic, { once: true });

// Music toggle button
musicToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isPlaying) {
        bgMusic.pause();
        musicToggle.textContent = '🔇';
        isPlaying = false;
    } else {
        bgMusic.play().then(() => {
            musicToggle.textContent = '🔊';
            isPlaying = true;
        }).catch(error => {
            console.log('Error playing audio:', error);
        });
    }
});

// Automatic text animation on page load
function animateText() {
    // Select all text elements that should be animated
    const elements = document.querySelectorAll('.main-content h1, .main-content h2, .main-content p, .main-content div');
    
    let globalDelay = 0;
    
    elements.forEach((element, elementIndex) => {
        // Skip if element is empty
        if (!element.textContent.trim()) return;
        
        // Get the text content
        const text = element.textContent;
        
        // Split into words while preserving spaces
        const words = text.split(/(\s+)/);
        
        // Clear the element
        element.textContent = '';
        
        // Create spans for each word
        words.forEach((word, wordIndex) => {
            // If it's just whitespace, add it as text node
            if (/^\s+$/.test(word)) {
                element.appendChild(document.createTextNode(word));
                return;
            }
            
            // Create animated word span
            const span = document.createElement('span');
            span.className = 'word-animated';
            span.textContent = word;
            
            // Calculate staggered delay
            const delay = globalDelay * 0.08; // 80ms between each word
            span.style.animationDelay = `${delay}s`;
            
            // Add floating class after initial animation completes
            setTimeout(() => {
                span.classList.add('floating');
            }, (delay + 0.8) * 1000); // Add after floatIn animation completes
            
            element.appendChild(span);
            globalDelay++;
        });
        
        // Add extra delay between elements
        globalDelay += 2;
    });
    
    console.log('Text animation initialized for all elements');
}

// Run animation on page load
document.addEventListener('DOMContentLoaded', animateText);

// On click, form the message
document.body.addEventListener('click', () => {
    if (!hasInteracted) {
        hasInteracted = true;
        
        console.log('Click detected, forming message...');
        
        // Play music if not already playing
        if (!isPlaying) {
            bgMusic.play().then(() => {
                musicToggle.textContent = '🔊';
                isPlaying = true;
            }).catch(error => {
                console.log('Error playing audio:', error);
            });
        }
        
        // Animate characters to their final positions
        characters.forEach((char) => {
            setTimeout(() => {
                char.span.classList.add('forming');
                char.span.style.left = char.finalX + 'px';
                char.span.style.top = char.finalY + 'px';
                char.span.style.opacity = '1';
            }, char.delay);
        });
    }
}, { once: true });


// Snow effect
const canvas = document.getElementById('snow-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Resize canvas on window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Snowflake class
class Snowflake {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 3 + 1;
        this.speed = Math.random() * 1 + 0.5;
        this.wind = Math.random() * 0.5 - 0.25;
    }

    update() {
        this.y += this.speed;
        this.x += this.wind;

        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }

        if (this.x > canvas.width) {
            this.x = 0;
        } else if (this.x < 0) {
            this.x = canvas.width;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
    }
}

// Create snowflakes
const snowflakes = [];
for (let i = 0; i < 100; i++) {
    snowflakes.push(new Snowflake());
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    snowflakes.forEach(snowflake => {
        snowflake.update();
        snowflake.draw();
    });
    
    requestAnimationFrame(animate);
}

animate();
