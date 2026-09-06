 /* NAVBAR ACTIVE LINK */

 const sections = document.querySelectorAll("section");
 const navLinks = document.querySelectorAll(".nav-link");

 window.addEventListener("scroll", () => {

     let current = "";

     sections.forEach((section) => {

         const sectionTop = section.offsetTop - 150;
         const sectionHeight = section.clientHeight;

         if (window.scrollY >= sectionTop) {
             current = section.getAttribute("id");
         }

     });

     navLinks.forEach((link) => {

         link.classList.remove("active");

         if (link.getAttribute("href") === "#" + current) {
             link.classList.add("active");
         }

     });

 });


 /* NAVBAR CLOSE ON MOBILE */

 const navLinksMobile = document.querySelectorAll(".navbar-nav .nav-link");
 const navbarCollapse = document.querySelector(".navbar-collapse");

 navLinksMobile.forEach((link) => {

     link.addEventListener("click", () => {

         if (window.innerWidth < 992) {

             const bsCollapse =
                 bootstrap.Collapse.getInstance(navbarCollapse);

             if (bsCollapse) {
                 bsCollapse.hide();
             }

         }

     });

 });


 /* BACK TO TOP */

 const backToTop = document.getElementById("backToTop");

 window.addEventListener("scroll", () => {

     if (window.scrollY > 400) {
         backToTop.style.display = "block";
     } else {
         backToTop.style.display = "none";
     }

 });

 backToTop.addEventListener("click", () => {

     window.scrollTo({
         top: 0,
         behavior: "smooth"
     });

 });



 /* CONTACT FORM */

 const contactForm = document.getElementById("contactForm");

 contactForm.addEventListener("submit", async(event) => {

     event.preventDefault();

     const name = document.getElementById("name").value.trim();
     const email = document.getElementById("email").value.trim();
     const subject = document.getElementById("subject").value.trim();
     const message = document.getElementById("message").value.trim();

     try {

         const response = await fetch("https://portfolio-kv1q.onrender.com/send-message", {
             method: "POST",

             headers: {
                 "Content-Type": "application/json"
             },

             body: JSON.stringify({
                 name,
                 email,
                 subject,
                 message
             })
         });

         const data = await response.json();

         if (data.success) {

             alert("Message sent successfully!");

             contactForm.reset();

         } else {

             alert("Message send nahi hua!");

         }

     } catch (error) {

         console.error(error);

         alert("Backend server running nahi hai!");

     }

 });

 /*  CURRENT YEAR */

 document.getElementById("year").textContent =
     new Date().getFullYear();