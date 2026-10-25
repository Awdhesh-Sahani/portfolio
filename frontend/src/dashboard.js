import {
    deleteAssets,
    deleteMessage,
    getMessages,
    getPortfolio,
    hasSession,
    isSupabaseConfigured,
    savePortfolio,
    signIn,
    signOut,
    uploadAsset,
    verifyAdmin
} from "./supabase.js";

const sections = {
    overview: { title: "Overview", icon: "bi-grid-1x2" },
    profile: { title: "Profile & contact", icon: "bi-person-lines-fill" },
    skills: { title: "Skills", icon: "bi-lightning-charge" },
    projects: { title: "Projects", icon: "bi-code-square" },
    education: { title: "Education", icon: "bi-mortarboard" },
    certificates: { title: "Certificates", icon: "bi-award" },
    highlights: { title: "Hire highlights", icon: "bi-stars" },
    messages: { title: "Messages", icon: "bi-envelope" }
};

const collectionFields = {
    skills: [
        { key: "name", label: "Skill name", required: true },
        { key: "level", label: "Proficiency (%)", type: "number", required: true, min: 0, max: 100 },
        { key: "icon", label: "Bootstrap icon name", hint: "For example: bi-filetype-js" }
    ],
    projects: [
        { key: "title", label: "Project title", required: true },
        { key: "description", label: "Description", type: "textarea", required: true, full: true },
        { key: "technologies", label: "Technologies", type: "textarea", array: true, hint: "Enter one technology per line.", full: true },
        { key: "icon", label: "Bootstrap icon name", hint: "Used if no image is uploaded." },
        { key: "imageUrl", label: "Project image URL", type: "image", assetPath: "imagePath" },
        { key: "githubUrl", label: "GitHub URL", type: "url" },
        { key: "demoUrl", label: "Live demo URL", type: "url" }
    ],
    education: [
        { key: "period", label: "Period", required: true },
        { key: "degree", label: "Degree / qualification", required: true },
        { key: "field", label: "Field of study", required: true },
        { key: "description", label: "Institution and details", type: "textarea", required: true, full: true }
    ],
    certificates: [
        { key: "tag", label: "Category", required: true },
        { key: "title", label: "Certificate title", required: true },
        { key: "issuer", label: "Issuer", required: true },
        { key: "year", label: "Year", required: true },
        { key: "verified", label: "Verified", type: "boolean" },
        { key: "imageUrl", label: "Preview image URL", type: "image", assetPath: "imagePath" },
        { key: "fileUrl", label: "Certificate PDF URL", type: "pdf", assetPath: "filePath" }
    ],
    highlights: [
        { key: "title", label: "Highlight", required: true },
        { key: "icon", label: "Bootstrap icon name", hint: "For example: bi-lightbulb" }
    ]
};

const profileFields = [
    { key: "name", label: "Full name", required: true },
    { key: "heroRole", label: "Role / headline", required: true },
    { key: "heroDescription", label: "Hero introduction", type: "textarea", full: true },
    { key: "aboutRole", label: "About card title" },
    { key: "aboutSummary", label: "About card summary", type: "textarea", full: true },
    { key: "aboutHeading", label: "About heading" },
    { key: "aboutParagraphOne", label: "About paragraph 1", type: "textarea", full: true },
    { key: "aboutParagraphTwo", label: "About paragraph 2", type: "textarea", full: true },
    { key: "experience", label: "Experience" },
    { key: "location", label: "Location" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Public contact email", type: "email", required: true },
    { key: "profileImageUrl", label: "Profile image URL", type: "image", assetPath: "profileImagePath" },
    { key: "resumeUrl", label: "Resume PDF URL", type: "pdf", assetPath: "resumePath" },
    { key: "footerRole", label: "Footer tagline", type: "textarea", full: true },
    { key: "hireDescription", label: "Why hire me description", type: "textarea", full: true },
    { key: "social", label: "Social links", type: "social", full: true, hint: "One per line: platform=https://... (email can use mailto:address)." }
];

const loginCard = document.getElementById("loginCard");
const adminApp = document.getElementById("adminApp");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const pageContent = document.getElementById("pageContent");
const pageStatus = document.getElementById("pageStatus");
const pageTitle = document.getElementById("pageTitle");
const loginPassword = document.getElementById("loginPassword");
let portfolio;
let messages = [];
let activeSection = "overview";

function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function setPageStatus(message = "", kind = "") {
    pageStatus.textContent = message;
    pageStatus.className = `page-status ${kind}`;
}

function setLoginStatus(message = "", kind = "") {
    loginStatus.textContent = message;
    loginStatus.className = `status-message ${kind}`;
}

function getAssetPaths(record, fields = []) {
    return fields.map(field => record[field.assetPath]).filter(Boolean);
}

function renderNavigation() {
    document.getElementById("dashboardNav").innerHTML = Object.entries(sections).map(([key, section]) => `
        <button class="nav-button ${activeSection === key ? "active" : ""}" data-section="${key}" type="button">
            <i class="bi ${section.icon}"></i><span>${section.title}</span>
        </button>`).join("");
}

function renderOverview() {
    const counts = [
        ["Projects", portfolio.projects.length, "bi-code-square"],
        ["Skills", portfolio.skills.length, "bi-lightning-charge"],
        ["Certificates", portfolio.certificates.length, "bi-award"],
        ["Hire highlights", portfolio.highlights.length, "bi-stars"],
        ["Unread inbox", messages.length, "bi-envelope"]
    ];
    pageContent.innerHTML = `
        <div class="overview-grid">${counts.map(([label, count, icon]) => `
            <article class="stat-card"><i class="bi ${icon}"></i><strong>${count}</strong><span>${label}</span></article>
        `).join("")}</div>
        <section class="panel"><h2>Everything in one place</h2>
            <p>Edit your public profile, portfolio projects, skills, education and certificates. Upload images or PDFs, and review contact form messages from the sidebar.</p>
            <button class="primary-button" data-section="profile" type="button">Edit portfolio profile <i class="bi bi-arrow-right"></i></button>
        </section>`;
}

function recordTitle(section, item) {
    if (section === "skills") return `${item.name || "Untitled skill"} · ${item.level ?? 0}%`;
    if (section === "projects") return item.title || "Untitled project";
    if (section === "education") return item.degree || "Untitled qualification";
    return item.title || "Untitled certificate";
}

function recordSubtitle(section, item) {
    if (section === "skills") return item.icon || "Skill";
    if (section === "projects") return item.technologies?.join(", ") || item.description || "";
    if (section === "education") return [item.period, item.field].filter(Boolean).join(" · ");
    if (section === "highlights") return item.icon || "Highlight";
    return [item.issuer, item.year].filter(Boolean).join(" · ");
}

function renderRecordList(section) {
    const records = portfolio[section] || [];
    const fields = collectionFields[section];
    return `<div class="section-heading"><h2>${sections[section].title}</h2>
        <button class="primary-button" data-action="new" type="button"><i class="bi bi-plus-lg"></i> Add ${section === "education" ? "education" : section.slice(0, -1)}</button></div>
        ${records.length ? `<div class="record-list">${records.map(item => {
            const image = ["projects", "certificates"].includes(section) ? item.imageUrl : "";
            const validImage = /^https?:\/\//i.test(image || "") || /^\/(?!\/)/.test(image || "");
            const icon = /^[a-z0-9-]+$/.test(item.icon || "") ? item.icon : "bi-stars";
            const thumbnail = validImage
                ? `<img class="record-thumbnail" src="${escapeHtml(image)}" alt="">`
                : `<span class="record-icon"><i class="bi ${icon}"></i></span>`;
            return `<article class="record-card"><div class="record-main">${thumbnail}<div>
                <h3>${escapeHtml(recordTitle(section, item))}</h3><p>${escapeHtml(recordSubtitle(section, item))}</p>
            </div></div><div class="record-actions">
                <button class="secondary-button" data-action="edit" data-id="${escapeHtml(item.id)}" type="button"><i class="bi bi-pencil"></i> Edit</button>
                <button class="danger-button" data-action="delete" data-id="${escapeHtml(item.id)}" type="button"><i class="bi bi-trash"></i> Delete</button>
            </div></article>`;
        }).join("")}</div>` : `<div class="empty-state">No ${sections[section].title.toLowerCase()} added yet.</div>`}
        <div id="editorContainer"></div>`;
}

function renderField(field, value, record = {}) {
    const fieldValue = field.array && Array.isArray(value) ? value.join("\n") : value;
    const label = `<label for="field-${field.key}">${field.label}${field.required ? " *" : ""}</label>`;
    if (field.type === "image" || field.type === "pdf") {
        const accept = field.type === "image" ? ".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif" : ".pdf,application/pdf";
        const current = value ? `<span class="file-current">Current: ${escapeHtml(value)}</span>` : "";
        return `<div class="form-field ${field.full ? "full-width" : ""}">${label}
            <input id="field-${field.key}" name="${field.key}" type="text" value="${escapeHtml(value || "")}" placeholder="Paste an existing URL or choose a file below">
            ${current}<input name="upload-${field.key}" type="file" accept="${accept}">
            <span class="field-hint">Maximum upload size: 10 MB.</span>
        </div>`;
    }
    if (field.type === "boolean") {
        return `<div class="form-field"><label for="field-${field.key}">${field.label}</label>
            <select id="field-${field.key}" name="${field.key}"><option value="true" ${value ? "selected" : ""}>Yes</option><option value="false" ${!value ? "selected" : ""}>No</option></select></div>`;
    }
    if (field.type === "social") {
        const socials = Array.isArray(value) ? value.map(item => `${item.platform}=${item.url}`).join("\n") : "";
        return `<div class="form-field full-width">${label}<textarea id="field-${field.key}" name="${field.key}" placeholder="github=https://github.com/username">${escapeHtml(socials)}</textarea>
            <span class="field-hint">${escapeHtml(field.hint)}</span></div>`;
    }
    const isTextarea = field.type === "textarea";
    const inputType = field.type === "number" ? "number" : field.type === "url" ? "text" : field.type || "text";
    const attributes = [
        field.required ? "required" : "",
        field.min !== undefined ? `min="${field.min}"` : "",
        field.max !== undefined ? `max="${field.max}"` : ""
    ].filter(Boolean).join(" ");
    const control = isTextarea
        ? `<textarea id="field-${field.key}" name="${field.key}" ${attributes}>${escapeHtml(fieldValue || "")}</textarea>`
        : `<input id="field-${field.key}" name="${field.key}" type="${inputType}" value="${escapeHtml(fieldValue ?? "")}" ${attributes}>`;
    return `<div class="form-field ${field.full ? "full-width" : ""}">${label}${control}${field.hint ? `<span class="field-hint">${escapeHtml(field.hint)}</span>` : ""}</div>`;
}

function renderEditor(section, record = {}) {
    const isProfile = section === "profile";
    const fields = isProfile ? profileFields : collectionFields[section];
    const item = record || {};
    const title = isProfile ? "Edit profile and contact details" : `${item.id ? "Edit" : "Add"} ${sections[section].title.toLowerCase().replace(/s$/, "")}`;
    const editor = isProfile ? pageContent : document.getElementById("editorContainer");
    editor.innerHTML = `<section class="panel"><h2>${title}</h2>
        <form class="editor-form" id="recordForm" data-section="${section}" data-id="${escapeHtml(item.id || "")}">
            ${fields.map(field => renderField(field, item[field.key], item)).join("")}
            <div class="form-actions"><button class="primary-button" type="submit"><i class="bi bi-check2"></i> Save changes</button>
                <button class="secondary-button" type="button" data-action="cancel">Cancel</button></div>
        </form></section>`;
    if (isProfile) editor.querySelector("#recordForm").scrollIntoView({ behavior: "smooth", block: "start" });
    else editor.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderMessages() {
    pageContent.innerHTML = `<div class="section-heading"><h2>Contact form inbox</h2></div>
        ${messages.length ? `<div class="record-list">${messages.map(message => `
            <article class="record-card message-card"><header><div><h3>${escapeHtml(message.subject)}</h3>
                <span class="message-meta">${escapeHtml(message.name)} · <a href="mailto:${escapeHtml(message.email)}">${escapeHtml(message.email)}</a></span></div>
                <time datetime="${escapeHtml(message.created_at)}">${escapeHtml(new Date(message.created_at).toLocaleString())}</time></header>
                <p class="message-body">${escapeHtml(message.message)}</p><div class="message-actions">
                <a href="mailto:${escapeHtml(message.email)}?subject=${encodeURIComponent(`Re: ${message.subject}`)}">Reply by email <i class="bi bi-arrow-up-right"></i></a>
                <button class="danger-button" data-action="delete-message" data-id="${message.id}" type="button"><i class="bi bi-trash"></i> Delete</button></div>
            </article>`).join("")}</div>` : `<div class="empty-state">No messages yet. New contact form submissions will appear here.</div>`}`;
}

function renderPage() {
    renderNavigation();
    pageTitle.textContent = sections[activeSection].title;
    setPageStatus();
    if (activeSection === "overview") renderOverview();
    else if (activeSection === "profile") renderEditor("profile", portfolio.profile || {});
    else if (activeSection === "messages") renderMessages();
    else pageContent.innerHTML = renderRecordList(activeSection);
}

async function loadAdmin() {
    try {
        if (!await verifyAdmin()) {
            throw new Error("This account is not authorized to manage the portfolio.");
        }
        const [content, inbox] = await Promise.all([getPortfolio(), getMessages()]);
        portfolio = {
            profile: content.profile || {},
            skills: content.skills || [],
            projects: content.projects || [],
            education: content.education || [],
            certificates: content.certificates || [],
            highlights: content.highlights || []
        };
        messages = inbox || [];
        loginCard.hidden = true;
        adminApp.hidden = false;
        renderPage();
    } catch (error) {
        signOut();
        adminApp.hidden = true;
        loginCard.hidden = false;
        setLoginStatus(error.message, "error");
    }
}

function showLogin(message = "") {
    adminApp.hidden = true;
    loginCard.hidden = false;
    setLoginStatus(message);
}

document.addEventListener("click", async event => {
    const sectionButton = event.target.closest("[data-section]");
    if (sectionButton) {
        activeSection = sectionButton.dataset.section;
        renderPage();
        return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton || !portfolio) return;
    const action = actionButton.dataset.action;

    if (action === "cancel") {
        if (activeSection === "profile") activeSection = "overview";
        renderPage();
        return;
    }

    if (activeSection === "messages" && action === "delete-message") {
        if (!confirm("Delete this message permanently?")) return;
        actionButton.disabled = true;
        try {
            await deleteMessage(actionButton.dataset.id);
            messages = messages.filter(message => String(message.id) !== actionButton.dataset.id);
            renderPage();
            setPageStatus("Message deleted.", "success");
        } catch (error) {
            setPageStatus(error.message, "error");
            actionButton.disabled = false;
        }
        return;
    }

    if (action === "new") {
        renderEditor(activeSection);
        return;
    }

    const records = portfolio[activeSection];
    const record = records.find(item => item.id === actionButton.dataset.id);
    if (action === "edit" && record) {
        renderEditor(activeSection, record);
        return;
    }
    if (action === "delete" && record) {
        if (!confirm(`Delete "${recordTitle(activeSection, record)}" permanently?`)) return;
        actionButton.disabled = true;
        try {
            const oldPaths = getAssetPaths(record, collectionFields[activeSection]);
            portfolio[activeSection] = records.filter(item => item.id !== record.id);
            await savePortfolio(portfolio);
            try {
                await deleteAssets(oldPaths);
            } catch (error) {
                renderPage();
                setPageStatus(`Item deleted, but an old upload could not be removed: ${error.message}`, "error");
                return;
            }
            renderPage();
            setPageStatus("Item deleted.", "success");
        } catch (error) {
            portfolio[activeSection] = records;
            renderPage();
            setPageStatus(error.message, "error");
        }
    }
});

document.addEventListener("submit", async event => {
    const form = event.target.closest("#recordForm");
    if (!form) return;
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    setPageStatus("Saving changes...");

    const section = form.dataset.section;
    const isProfile = section === "profile";
    const schema = isProfile ? profileFields : collectionFields[section];
    const data = new FormData(form);
    const existing = isProfile ? portfolio.profile : portfolio[section].find(item => item.id === form.dataset.id);
    const record = { ...(existing || {}) };
    const oldPaths = getAssetPaths(record, schema);
    const originalPortfolio = structuredClone(portfolio);
    const newlyUploadedPaths = [];

    try {
        for (const field of schema) {
            if (field.type === "image" || field.type === "pdf") {
                const file = data.get(`upload-${field.key}`);
                if (file instanceof File && file.size > 0) {
                    const uploaded = await uploadAsset(file);
                    newlyUploadedPaths.push(uploaded.path);
                    record[field.key] = uploaded.url;
                    record[field.assetPath] = uploaded.path;
                } else if (data.get(field.key) !== record[field.key]) {
                    const value = String(data.get(field.key) || "").trim();
                    if (value && !/^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i.test(value)) {
                        throw new Error(`${field.label} must be an http(s) URL or a site-relative path.`);
                    }
                    record[field.key] = value;
                    record[field.assetPath] = "";
                }
            } else if (field.type === "social") {
                const platformNames = new Set(["github", "linkedin", "email", "instagram", "facebook", "youtube", "website"]);
                record.social = String(data.get(field.key) || "").split(/\r?\n/).filter(Boolean).map(line => {
                    const separator = line.indexOf("=");
                    if (separator < 1) throw new Error("Each social link must use platform=https://... format.");
                    const platform = line.slice(0, separator).trim().toLowerCase();
                    const url = line.slice(separator + 1).trim();
                    if (!platformNames.has(platform) || !/^(https?:\/\/|mailto:[^\s]+$)/i.test(url)) {
                        throw new Error(`Invalid social link: ${line}`);
                    }
                    return { platform, url };
                });
            } else if (field.array) {
                record[field.key] = String(data.get(field.key) || "").split(/\r?\n/).map(value => value.trim()).filter(Boolean);
            } else if (field.type === "boolean") {
                record[field.key] = data.get(field.key) === "true";
            } else if (field.type === "number") {
                record[field.key] = Number(data.get(field.key));
            } else {
                const value = String(data.get(field.key) || "").trim();
                if (field.type === "url" && value && !/^(https?:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i.test(value)) {
                    throw new Error(`${field.label} must be an http(s) URL or a site-relative path.`);
                }
                record[field.key] = value;
            }
        }

        if (isProfile) {
            portfolio.profile = record;
        } else if (existing) {
            portfolio[section] = portfolio[section].map(item => item.id === existing.id ? record : item);
        } else {
            record.id = crypto.randomUUID();
            portfolio[section] = [...portfolio[section], record];
        }

        await savePortfolio(portfolio);
        const replacedPaths = oldPaths.filter(path => !getAssetPaths(record, schema).includes(path));
        let status = "Changes saved and published.";
        try {
            await deleteAssets(replacedPaths);
        } catch (error) {
            status = `Changes saved, but an old upload could not be removed: ${error.message}`;
        }
        renderPage();
        setPageStatus(status, status.startsWith("Changes saved, but") ? "error" : "success");
    } catch (error) {
        portfolio = originalPortfolio;
        let message = error.message;
        try {
            await deleteAssets(newlyUploadedPaths);
        } catch (cleanupError) {
            message += ` Uploaded file cleanup failed: ${cleanupError.message}`;
        }
        setPageStatus(message, "error");
        submitButton.disabled = false;
    }
});

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const button = loginForm.querySelector("button[type='submit']");
    button.disabled = true;
    setLoginStatus("Signing in...");
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    try {
        await signIn(email, password);
        await loadAdmin();
    } catch (error) {
        signOut();
        setLoginStatus(error.message, "error");
    } finally {
        button.disabled = false;
        loginPassword.value = "";
    }
});

document.getElementById("signOutButton").addEventListener("click", () => {
    signOut();
    showLogin("You have signed out.");
});

if (!isSupabaseConfigured) {
    showLogin("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then run the SQL setup.");
} else if (hasSession()) {
    loadAdmin();
} else {
    showLogin();
}
