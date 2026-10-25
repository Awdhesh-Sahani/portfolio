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
 const contactFormStatus = document.getElementById("contactFormStatus");

 contactForm.addEventListener("submit", async(event) => {

     event.preventDefault();
     contactFormStatus.textContent = "Sending your message...";
     contactFormStatus.classList.remove("text-danger", "text-success");
     const submitButton = contactForm.querySelector("button[type='submit']");
     submitButton.disabled = true;

     const name = document.getElementById("name").value.trim();
     const email = document.getElementById("email").value.trim();
     const subject = document.getElementById("subject").value.trim();
     const message = document.getElementById("message").value.trim();

     try {


         const response = await fetch("/api/send-message", {
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

         const data = await response.json().catch(() => ({}));

         if (response.ok && data.success) {
             contactFormStatus.textContent = "Message sent successfully. Thank you for getting in touch!";
             contactFormStatus.classList.add("text-success");
             contactForm.reset();
         } else {
             throw new Error(data.message || "Your message could not be sent. Please try again later.");
         }

     } catch (error) {
         console.error(error);
         contactFormStatus.textContent = error.message || "The message service is unavailable. Please try again later.";
         contactFormStatus.classList.add("text-danger");
     } finally {
         submitButton.disabled = false;
     }

 });

 /*  CURRENT YEAR */

 document.getElementById("year").textContent =
     new Date().getFullYear();

 import("./portfolio.js");