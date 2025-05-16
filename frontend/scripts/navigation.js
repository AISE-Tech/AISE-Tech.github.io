document.addEventListener("DOMContentLoaded", function () {
    const mobileToggle = document.querySelector(".mobile-toggle");
    const navMenu = document.querySelector(".nav-menu");

    // Manejar la navegación móvil
    mobileToggle.addEventListener("click", function () {
        navMenu.classList.toggle("active");
        mobileToggle.classList.toggle("active");
    });

    // Animaciones al hacer scroll
    const fadeElements = document.querySelectorAll(".fade-in");

    function checkFade() {
        fadeElements.forEach((element) => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;

            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add("active");
            }
        });
    }

    window.addEventListener("scroll", checkFade);
    checkFade(); // Verificar elementos visibles al cargar la página

    // Enlaces de navegación suave
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();

            const targetId = this.getAttribute("href");
            if (targetId === "#") return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: "smooth",
                });

                // Cerrar el menú móvil si está abierto
                navMenu.classList.remove("active");
                mobileToggle.classList.remove("active");
            }
        });
    });
});