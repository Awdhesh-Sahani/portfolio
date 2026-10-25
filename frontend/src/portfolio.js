import { getPortfolio, isSupabaseConfigured } from "./supabase.js";

function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function safeUrl(value, allowMail = false) {
    const url = String(value || "").trim();
    if (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url) || (allowMail && /^mailto:[^\s]+$/i.test(url))) {
        return url;
    }
    return "";
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element && value !== undefined && value !== null) element.textContent = value;
}

function renderSkills(items = []) {
    const container = document.getElementById("skillsList");
    container.innerHTML = items.map(skill => {
        const level = Math.max(0, Math.min(100, Number(skill.level) || 0));
        const icon = /^[a-z0-9-]+$/.test(skill.icon || "") ? skill.icon : "bi-stars";
        return `<div class="col-md-6 col-lg-4"><div class="skill-card">
            <i class="bi ${icon} skill-icon"></i><h4>${escapeHtml(skill.name)}</h4>
            <div class="progress" role="progressbar" aria-valuenow="${level}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar" style="width:${level}%">${level}%</div>
            </div></div></div>`;
    }).join("");
}

function renderProjects(items = []) {
    const container = document.getElementById("projectsList");
    container.innerHTML = items.map((project, index) => {
        const image = safeUrl(project.imageUrl);
        const icon = /^[a-z0-9-]+$/.test(project.icon || "") ? project.icon : "bi-code-square";
        const technologies = Array.isArray(project.technologies) ? project.technologies : [];
        const links = [
            project.githubUrl ? `<a href="${escapeHtml(safeUrl(project.githubUrl))}" target="_blank" rel="noopener noreferrer"><i class="bi bi-github"></i> GitHub</a>` : "",
            project.demoUrl ? `<a href="${escapeHtml(safeUrl(project.demoUrl))}" target="_blank" rel="noopener noreferrer">Live Demo <i class="bi bi-arrow-up-right"></i></a>` : ""
        ].filter(Boolean).join("");
        return `<div class="col-lg-4 col-md-6"><div class="project-card">
            <div class="project-image project-one">${image
                ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)}" class="project-photo">`
                : `<i class="bi ${icon}"></i>`}</div>
            <div class="project-content"><span class="project-number">PROJECT ${String(index + 1).padStart(2, "0")}</span>
                <h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p>
                <div class="tech-stack">${technologies.map(technology => `<span>${escapeHtml(technology)}</span>`).join("")}</div>
                <div class="project-links">${links}</div></div></div></div>`;
    }).join("");
}

function renderEducation(items = []) {
    document.getElementById("educationTimeline").innerHTML = items.map(item => `
        <div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-content">
            <span>${escapeHtml(item.period)}</span><h3>${escapeHtml(item.degree)}</h3>
            <h5>${escapeHtml(item.field)}</h5><p>${escapeHtml(item.description)}</p>
        </div></div>`).join("");
}

function renderCertificates(items = []) {
    document.getElementById("certificateList").innerHTML = items.map(certificate => {
        const image = safeUrl(certificate.imageUrl);
        const file = safeUrl(certificate.fileUrl);
        return `<div class="col-lg-4 col-md-6"><div class="certificate-card">
            <div class="certificate-image">${image
                ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(certificate.title)}">`
                : `<div class="certificate-placeholder"><i class="bi bi-award"></i></div>`}</div>
            <div class="certificate-body"><span class="certificate-tag">${escapeHtml(certificate.tag)}</span>
                <h3>${escapeHtml(certificate.title)}</h3><p><i class="bi bi-award"></i> ${escapeHtml(certificate.issuer)}</p>
                <div class="certificate-info"><span><i class="bi bi-calendar3"></i> ${escapeHtml(certificate.year)}</span>
                <span><i class="bi bi-patch-check-fill"></i> ${certificate.verified ? "Verified" : "Certificate"}</span></div>
                ${file ? `<a href="${escapeHtml(file)}" target="_blank" rel="noopener noreferrer" class="certificate-btn">View Certificate <i class="bi bi-arrow-up-right"></i></a>` : ""}
            </div></div></div>`;
    }).join("");
}

function renderHighlights(items = []) {
    document.getElementById("hireHighlights").innerHTML = items.map(item => {
        const icon = /^[a-z0-9-]+$/.test(item.icon || "") ? item.icon : "bi-stars";
        return `<div class="col-md-3"><div class="hire-box">
            <i class="bi ${icon}"></i><h5>${escapeHtml(item.title)}</h5>
        </div></div>`;
    }).join("");
}

function applyProfile(profile, skills = []) {
    const fullName = String(profile.name || "").trim().split(/\s+/);
    const lastName = fullName.pop() || "";
    const nameElement = document.getElementById("homeName");
    nameElement.replaceChildren(document.createTextNode(`${fullName.join(" ")} `));
    const highlightedName = document.createElement("span");
    highlightedName.textContent = lastName;
    nameElement.append(highlightedName);

    setText("heroRole", profile.heroRole);
    setText("heroDescription", profile.heroDescription);
    setText("aboutRole", profile.aboutRole);
    setText("aboutSummary", profile.aboutSummary);
    const aboutHeading = String(profile.aboutHeading || "").trim().split(/\s+/);
    const highlightedHeading = aboutHeading.splice(-2).join(" ");
    const headingElement = document.getElementById("aboutHeading");
    headingElement.replaceChildren(document.createTextNode(`${aboutHeading.join(" ")} `));
    const headingSpan = document.createElement("span");
    headingSpan.textContent = highlightedHeading;
    headingElement.append(headingSpan);
    setText("aboutParagraphOne", profile.aboutParagraphOne);
    setText("aboutParagraphTwo", profile.aboutParagraphTwo);
    setText("aboutName", profile.name);
    setText("aboutRoleDetail", profile.heroRole);
    setText("aboutExperience", profile.experience);
    setText("aboutLocation", profile.location);
    setText("contactPhone", profile.phone);
    setText("contactLocation", profile.location);
    setText("footerRole", profile.footerRole);
    setText("hireDescription", profile.hireDescription);
    skills.slice(0, 3).forEach((skill, index) => setText(`heroSkill${["One", "Two", "Three"][index]}`, skill.name));

    const email = String(profile.email || "");
    const emailLink = document.getElementById("contactEmail");
    emailLink.textContent = email;
    emailLink.href = `mailto:${email}`;

    const profileImage = safeUrl(profile.profileImageUrl);
    if (profileImage) {
        const image = document.getElementById("profileImage");
        image.src = profileImage;
        image.alt = profile.name;
    }

    const resumeUrl = safeUrl(profile.resumeUrl);
    if (resumeUrl) document.getElementById("resumeLink").href = resumeUrl;

    const socials = new Map((profile.social || []).map(item => [item.platform, item.url]));
    document.querySelectorAll("[data-social]").forEach(link => {
        const url = safeUrl(socials.get(link.dataset.social), link.dataset.social === "email");
        if (url) {
            link.href = url;
            link.hidden = false;
        } else {
            link.hidden = true;
        }
    });
}

async function loadPortfolio() {
    if (!isSupabaseConfigured) return;
    try {
        const content = await getPortfolio();
        applyProfile(content.profile || {});
        renderSkills(content.skills || []);
        renderProjects(content.projects || []);
        renderEducation(content.education || []);
        renderCertificates(content.certificates || []);
        renderHighlights(content.highlights || []);
    } catch (error) {
        console.error("Unable to load portfolio content:", error);
    }
}

loadPortfolio();
