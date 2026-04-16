(function () {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    let w, h, cx, cy;
    let stars = [];
    let angle = 0;
    let useFallback = false;
    let frameCount = 0;
    let frameTimes = [];
    const STAR_COUNT = 300;
    const ARMS = 3;
    const ROTATION_SPEED = 0.0001;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        cx = w / 2;
        cy = h / 2;
    }

    function generateStars() {
        stars = [];
        const maxRadius = Math.max(w, h) * 0.6;
        for (let i = 0; i < STAR_COUNT; i++) {
            const arm = i % ARMS;
            const armAngle = (arm / ARMS) * Math.PI * 2;
            const t = Math.random();
            const r = t * maxRadius;
            // logarithmic spiral offset
            const spiralAngle = armAngle + t * Math.PI * 3;
            // scatter around the arm
            const scatter = (Math.random() - 0.5) * 60;
            const scatterAngle = (Math.random() - 0.5) * 0.4;

            stars.push({
                r: r + scatter,
                angle: spiralAngle + scatterAngle,
                size: Math.random() * 1.8 + 0.5,
                brightness: Math.random() * 0.6 + 0.2,
                isCyan: Math.random() < 0.15
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            const a = s.angle + angle;
            const x = cx + Math.cos(a) * s.r;
            const y = cy + Math.sin(a) * s.r;

            if (x < -10 || x > w + 10 || y < -10 || y > h + 10) continue;

            if (s.isCyan) {
                ctx.fillStyle = `rgba(0, 212, 255, ${s.brightness})`;
                ctx.shadowColor = 'rgba(0, 212, 255, 0.4)';
                ctx.shadowBlur = 4;
            } else {
                ctx.fillStyle = `rgba(0, 255, 65, ${s.brightness * 0.7})`;
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.arc(x, y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    function animate(timestamp) {
        if (useFallback) return;

        // fps monitoring for first 2 seconds
        frameCount++;
        if (frameCount <= 120) {
            frameTimes.push(timestamp);
            if (frameCount === 60) {
                const elapsed = frameTimes[59] - frameTimes[0];
                const fps = 59 / (elapsed / 1000);
                if (fps < 30) {
                    useFallback = true;
                    canvas.style.display = 'none';
                    createStaticFallback();
                    return;
                }
            }
        }

        angle += ROTATION_SPEED;
        draw();
        requestAnimationFrame(animate);
    }

    function createStaticFallback() {
        const maxRadius = Math.max(w, h) * 0.5;
        const seed = Date.now();
        // simple seeded random
        let rng = seed;
        function rand() {
            rng = (rng * 16807 + 0) % 2147483647;
            return (rng & 0x7fffffff) / 0x7fffffff;
        }

        for (let i = 0; i < 200; i++) {
            const arm = i % ARMS;
            const armAngle = (arm / ARMS) * Math.PI * 2;
            const t = rand();
            const r = t * maxRadius;
            const spiralAngle = armAngle + t * Math.PI * 3;
            const scatter = (rand() - 0.5) * 60;
            const scatterAngle = (rand() - 0.5) * 0.4;

            const finalR = r + scatter;
            const finalA = spiralAngle + scatterAngle;
            const x = cx + Math.cos(finalA) * finalR;
            const y = cy + Math.sin(finalA) * finalR;

            const dot = document.createElement('div');
            dot.className = 'static-star' + (rand() < 0.15 ? ' bright' : '');
            dot.style.left = x + 'px';
            dot.style.top = y + 'px';
            document.body.appendChild(dot);
        }
    }

    function init() {
        resize();
        generateStars();
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', function () {
        resize();
        generateStars();
    });

    init();
})();
