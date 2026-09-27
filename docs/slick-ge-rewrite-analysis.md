# Online CV source analysis and slick.ge rewrite plan

Status: untracked analysis document. This review describes the current source and proposes a migration to the slick.ge visual and technical system. It does not modify the current site implementation.

Repository: `online-cv`

Observed: 2026-09-26

## Executive summary

The current resume is a small static Eleventy 2 site rendered from Nunjucks templates. It has separate English and Georgian JSON documents, two duplicated homepage templates, shared section partials, a single dark-theme CSS file, static image/PDF assets, and GitHub Pages deployment workflows.

The content is strong and detailed. The most valuable facts are the progression from early hardware and desktop support through systems administration and application-server administration, the 170+ Windows/Linux VM scope at HCOJ, the complete CI/CD rebuild at Liberty Bank, the current GHAS/CodeQL/Mend.io work at EPAM, LPIC-1/LPIC-2, the engineering degree, and the homelab/projects. The current presentation treats every historical role with similar visual weight, which makes the strongest recent experience compete with early-career material.

The rewrite should preserve the factual dataset and PDF capability while moving presentation and build ownership to the same Astro/component/theme system used by slick.ge. The cleanest target is one Astro project with one shared page component, one content JSON document containing both `en` and `ka` values, structured arrays for experience/education/projects, and locale routes at `/en/` and `/ka/`.

The CV should feel like a companion to slick.ge rather than a separate personal brand. slick.ge should own the short positioning story and the new detailed About page; the CV should provide the complete, document-like record for recruiters, hiring managers, and anyone who wants dates, responsibilities, certifications, and a downloadable PDF. Some facts should be shared from one content source and surfaced differently in each site.

### Companion-site relationship

- `slick.ge` is the service and trust-building site. Its About page should answer who Aleksandre is, how he works, what he has done, and why a team should contact him.
- `cv.ghvineria.com` is the detailed professional record. It should answer where and when he worked, what each role involved, which credentials can be verified, and where the full PDF can be downloaded.
- The sites should share identity, career facts, certifications, education, selected projects, social links, and language conventions, but they should not repeat the same long paragraphs everywhere.
- slick.ge should link to the CV with an explicit label such as `View full CV` or `Download resume`.
- The CV should link back with labels such as `About Aleksandre`, `Slick consulting`, and `Get in touch`.
- A duplicated fact should have the same dates, organization names, and metrics on both sites. A small validation script can compare the shared subset during builds.
- If the repositories remain separate, keep a deliberately small shared content package or generated JSON artifact rather than manually editing two large locale files. The presentation-specific copy can stay local to each site.
- The About page should be the preferred destination for people discovering Aleksandre through slick.ge; the CV should be the preferred destination for people who need a complete document.

This relationship is not duplicate-content risk by itself. The pages have different purposes and can use distinct titles, descriptions, headings, and summaries while linking to one another. The important requirement is that canonical URLs and language alternates identify each site’s own pages clearly.

## Current technology and runtime

### Framework and build

- Framework: Eleventy `^2.0.1`.
- Templates: Nunjucks (`.njk`).
- Markdown: `markdown-it` with HTML, line breaks, and linkification enabled.
- Runtime: Node 20 in the Dockerfile and GitHub Actions.
- Package type: ESM (`"type": "module"`), while `.eleventy.cjs` uses CommonJS.
- Development command: `eleventy --serve --config=.eleventy.cjs`.
- Build command: `eleventy --config=.eleventy.cjs`.
- Clean command: `rimraf dist .cache`.
- Browser automation dependency: Playwright, currently used by the PDF workflow rather than a committed test suite.
- Output directory: `dist/`.

### Eleventy configuration

`.eleventy.cjs`:

- Copies `src/assets` to `/assets`.
- Copies `src/favicon.ico` to `/favicon.ico`.
- Adds a `markdown` filter using `markdown-it`.
- Configures the development server to bind to `0.0.0.0:8080`.
- Uses `src` as the input directory, `_includes` for partials, `_data` for global data, and `dist` as output.

### Docker

The Dockerfile uses `node:20-alpine`, installs dependencies with `npm install`, copies the repository, exposes port 8080, and runs `npm run dev`. The Compose file mounts the repository and an anonymous `/app/node_modules` volume.

This is suitable for local development but is not a production container: it runs the Eleventy development server, has no healthcheck, uses a mutable dependency install, and does not produce or serve a static build. The slick.ge rewrite should use a separate development Compose file with source polling/live reload and a production multi-stage build that serves `dist` from a static server.

### Deployment workflows

`.github/workflows/gh-pages.yml`:

- Runs on every push to `main` and manually.
- Uses Node 20 and `npm ci`.
- Runs `npm run build`.
- Uploads `dist` as a Pages artifact.
- Deploys with `actions/deploy-pages@v4`.

`.github/workflows/pdf-and-pages.yml`:

- Runs only through `workflow_dispatch`.
- Builds the site and installs Chromium.
- Opens the generated English and Georgian print pages with Playwright.
- Generates both PDFs under `src/assets/pdf`.
- Commits only `src/assets/pdf/Aleksandre-Ghvineria-CV-EN.pdf`.
- Pushes the generated English PDF from the workflow.
- Uploads and deploys the Pages artifact.

The PDF workflow appears incomplete: it generates the Georgian PDF but does not stage or commit `Aleksandre-Ghvineria-CV-KA.pdf`. The current repository contains the English PDF but does not contain the Georgian PDF referenced by the Georgian data/template. This should be fixed or replaced during migration.

## Source tree

```text
Dockerfile
docker-compose.yml
package.json
package-lock.json
.eleventy.cjs
.github/workflows/
  gh-pages.yml
  pdf-and-pages.yml
src/
  index.njk
  print.njk
  ka/index.njk
  ka/print.njk
  _data/
    resume_en.json
    resume_ka.json
    site.json
  _includes/
    base.njk
    sections/
      contact.njk
      education.njk
      experience.njk
      interests.njk
      languages.njk
      projects.njk
      skills.njk
  assets/
    css/main.css
    images/
    pdf/
  favicon.ico
```

## Data model

### `resume_en.json` and `resume_ka.json`

The two resume documents have the same broad shape but duplicate the complete content:

```text
sidebar
  position
  about
  education
  name
  tagline
  avatar
  email
  phone
  pdf
  linkedin
  github
  bootdotdev
  lpi
  lpi-url
  languages.title
  languages.info[]
  interests.title
  interests.info[]
  skills.title
  skills.toolset[]
career-profile.title
career-profile.summary
education.title
education.info[]
experiences.title
experiences.info[]
projects.title
projects.intro
projects.assignments[]
footer
```

The English and Georgian files are parallel by convention rather than by a shared schema or IDs. Any insertion, deletion, or reordering has to be maintained twice. Dates, URLs, company names, tool names, and some labels are duplicated even when they should be shared. The `sidebar.skills` data exists in both files, but no current homepage template includes the skills section in the visible sidebar; the partial exists and is included by the templates, so it is rendered.

The model also stores presentation details as content (`position`, boolean section flags, percentage strings such as `85%`, and HTML entities such as `&amp;`). A new model should separate content from presentation and store percentages as numbers if proficiency bars are retained.

### Recommended target data shape

Use one JSON file, matching the direction already established in slick.ge, with each localized value side by side and arrays for repeated content:

```json
{
  "site": {
    "title": { "en": "Aleksandre Ghvineria - Resume", "ka": "..." },
    "description": { "en": "...", "ka": "..." }
  },
  "profile": {
    "name": "Aleksandre Ghvineria",
    "role": { "en": "DevOps Practitioner", "ka": "..." },
    "summary": { "en": "...", "ka": "..." }
  },
  "experience": [
    {
      "id": "epam-system-engineer",
      "role": { "en": "System Engineer", "ka": "..." },
      "company": "EPAM Systems",
      "start": "2025-04",
      "end": null,
      "bullets": [{ "en": "...", "ka": "..." }]
    }
  ],
  "projects": [],
  "education": [],
  "languages": [],
  "interests": []
}
```

Stable IDs should be semantic and independent of wording. Company names, product names, URLs, and ISO dates should be shared where translation is unnecessary. The renderer can format dates per locale. This avoids the current English-as-key coupling and prevents a wording edit from breaking Georgian lookup.

## Template behavior

### Homepage duplication

`src/index.njk` and `src/ka/index.njk` duplicate the complete page structure. The only meaningful differences are the selected data object, language metadata, translated button text, and language-switch direction.

Both pages render:

1. Hero/header.
2. Name, role, and career summary.
3. PDF download.
4. Profile image and contact list.
5. Language switch.
6. Main experience column.
7. Sidebar skills, languages, interests, education, and projects.
8. Footer sentence.

This duplication is the largest template maintenance problem. The Astro rewrite should use one `ResumePage` component with a `locale` prop and a shared `BaseLayout`, just as slick.ge does for its English and Georgian landing pages.

### Print pages

`src/print.njk` and `src/ka/print.njk` duplicate a second complete page structure. Print pages render profile, experience, skills, projects, and education but omit contact labels, languages, interests, and PDF actions.

The print templates are useful for PDF generation, but they should become one shared print component. Print output should consume the same normalized data as the web page so a resume update cannot silently diverge between screen and PDF.

### Shared partials

The section partials are already a useful separation:

- `contact.njk`: email, phone, GitHub, LinkedIn, LPI.
- `education.njk`: education cards.
- `experience.njk`: experience cards and Markdown bullets.
- `interests.njk`: compact list.
- `languages.njk`: language and level list.
- `projects.njk`: project cards and View links.
- `skills.njk`: skill chips with percentage values.

The new Astro implementation should retain this conceptual decomposition as components, but avoid duplicating locale-specific page shells.

## Current content inventory

### Profile

- Name: Aleksandre Ghvineria.
- English role: DevOps Practitioner.
- Georgian role: DevOps სპეციალისტი.
- Long summary combines application lifecycle automation, application server administration, systems administration, desktop support, patching, IT operations standards, web services, VM support, hardware/backups, and a broad tooling list.
- PDF action is prominent in the hero.

The summary is factually useful but too dense for the first screen. The slick.ge version should turn it into a concise positioning statement, a credibility line, and selected proof points.

### Experience

The source contains ten entries, newest first:

1. System Engineer, EPAM Systems, April 2025 - Present.
   - GHAS, Mend.io, and CodeQL security scanning.
   - GCP focus.
   - Fast response and quality recognized by requesters.
2. Application Server Administration, JSC Liberty Bank, July 2022 - March 2025.
   - Rebuilt build/deploy/rollback pipelines for frontend and backend applications, including previously unautomated applications.
   - Created rapid provisioning and deployment playbooks.
   - Added RabbitMQ and IIS monitoring to Zabbix with custom metrics and alerts.
   - Managed Jenkins, Nginx, IIS WebService, Windows Services, and Linux Services.
   - Managed application patching.
3. Systems Administration, HCOJ / High Council Of Justice Of Georgia, April 2021 - July 2022.
   - Provisioned Dev/Test/Pre/Prod application environments.
   - Supported 170+ Windows and Linux virtual machines.
   - Aligned infrastructure and procedures with organizational standards and strategy.
   - Troubleshot VMs and hypervisor hardware.
   - Managed vCenter and ESXi hosts.
   - Managed Veeam backups for VMware vCenter.
4. Desktop Support, HCOJ, April 2020 - March 2021.
   - Desktop support and proactive equipment/service issue resolution.
5. Desktop Support, UGT, August 2019 - March 2020.
   - Windows/macOS endpoint support in person, by phone, and remotely.
   - Microsoft application, hardware, and peripheral support.
   - Nationwide user support.
6. Freelance IT Support, 2017 - 2018.
   - Pharma-company support, Concept Pharma networking, printer/PC troubleshooting, software installation, and staff training.
   - Office network wiring, network equipment, and staff PC deployment.
   - Network segmentation access lists, firewall rules, and regular updates.
7. Knick, smart NFC ring company, 2016.
   - Antenna-coil manufacturing, design, geometry, signal/interference optimization.
   - Measurement jig, wood/ink materials, CNC machines, and laser cutters.
8. IT Service Center, ITSC, 2015 - 2016.
   - Computer/printer service, internal maintenance logging, remote support, and same-day issue resolution.
9. Computer Development Center, CDS, 2014.
   - Built/deployed 50+ hospital computers.
   - OS images, Acronis Clone, PXE, drivers/software, domain joining, QC, stress, and temperature tests.
10. Intellect Center, 2013.
    - Hardware/software troubleshooting, PSU tester, POST card, multimeter, Hiren's BootCD, MemTest86, OS installation, Windows/Linux, and basic network equipment.

For the slick.ge rewrite, entries 1-3 should receive primary emphasis. Entries 4-6 can form an earlier-career timeline. Entries 7-10 should be retained in the full resume/PDF but probably collapsed or summarized on the marketing-style page.

### Skills

The source lists 19 percentage-based skills:

Linux 85%, Windows 80%, Kubernetes 75%, Jenkins 90%, Ansible 80%, Proxmox 80%, ESXi 75%, Terraform 60%, Docker 70%, Zabbix 75%, Prometheus 70%, Grafana 70%, Bitwarden Secrets Manager 80%, GitHub Actions 75%, GCP 70%, AWS 50%, Cloudflare 60%, Tailscale 60%, and WireGuard 60%.

The percentages are subjective and lack an explanation of what the scale means. slick.ge’s toolkit approach is a better fit: group tools by function and distinguish daily drivers from familiar tools rather than implying false precision.

### Languages

- Georgian: Native / მშობლიური.
- English: Professional / პროფესიული.
- Russian: Professional / პროფესიული.

### Interests

- Electrical Engineering / ელექტროინჟინერია.
- Home Automation / სმარტ სახლის ავტომატიზაცია.
- HomeLAB.

### Education and certifications

- LPIC-2, Linux Professional Institute, 11/2023 - 02/2024, LPID `LPI000523471`, verification code `pdycar254f`.
- LPIC-1, Linux Professional Institute, 02/2022 - 04/2022, LPID `LPI000523471`, verification code `5lhcz7x9r5`.
- System administration and security course, Scientific Cyber Security Association, 11/2020 - 12/2020.
- BSc in Electrical & Computer Engineering, Agricultural University of Tbilisi, 2016 - 2021.
- University details include the Edison League STEM tournament, a ₾10,000 grant per participant, and a Gen 2/3 Toyota Prius remote-start project.

The certification verification codes are currently stored in public JSON and rendered in print output. Decide whether those codes should remain public before the rewrite.

### Projects

- Secret Santa: Golang learning project; Gin/GORM backend and React frontend by a friend. GitHub: `slick-ge/secret-santa-backend`.
- Golang Tools: TCP port checker, HTTP load tester, web scraper, and MKV converter using `mkvmerge`. GitHub: `Ghvinerias/learning-golang`.
- HomeLAB: Proxmox, Kubernetes, Docker, LXC, UniFi, OPNsense; Jellyfin, Home Assistant, EMQX, Grafana, Prometheus, Zabbix, Loki, Infisical, Nginx, Ollama, RabbitMQ; Jenkins/Ansible updates. GitHub: `Ghvinerias/homelab`.

These projects are a strong bridge between resume credibility and slick.ge’s services. They should become richer project cards or a selected-work strip rather than generic sidebar cards.

## Visual system

The existing theme is a dark operations dashboard:

- Background `#0b0f19`.
- Main panel `#111827`.
- Card `#0f172a`.
- Text `#e5e7eb`.
- Muted text `#94a3b8`.
- Border `#1f2937`.
- Cyan accent `#38bdf8`.
- Purple accent `#a78bfa`.
- System/Inter-style sans-serif typography.
- 1120px maximum content width and 92% fluid width.
- Hero grid `1.3fr 0.7fr`.
- Body grid `1.5fr 0.8fr`.
- 14-16px rounded cards with thin borders.
- Cyan/purple radial gradients in the hero.
- Pill buttons and date labels.
- Mobile breakpoint at 900px.
- Print-specific white theme.

The slick.ge design system is a light neumorphic surface system with pale backgrounds, inset/raised shadows, larger editorial headings, rounded controls, teal accents, and language-aware typography. The rewrite should not merely paste the old dark cards into slick.ge. It should translate the resume’s useful information architecture into slick.ge surfaces, spacing, shadows, typography, and interaction patterns.

Suggested visual translation:

- Keep timeline/date pills as compact metadata, but use slick.ge `surface` and `surface-small` treatments.
- Turn the hero into a concise slick.ge-style statement with a portrait/contact card and a clear PDF action.
- Use a featured-experience grid for EPAM, Liberty Bank, and HCOJ.
- Use an expandable “Earlier experience” section for roles before 2021.
- Reuse slick.ge toolkit grouping for tools instead of proficiency percentages.
- Use the existing slick.ge Recent work, About, Contact, footer links, and localized route conventions.
- Keep a dedicated print representation with high contrast and A4-friendly spacing.

## Accessibility and correctness observations

Strengths:

- `lang` is set correctly for English and Georgian pages.
- The name is an `h1`.
- Section labels use `h2`; entries use `h3`.
- The profile image has an alt attribute.
- Content is server-rendered and usable without JavaScript.
- Project links use `rel="noopener"`.

Issues and improvements:

- No skip link is present.
- The language switch has no accessible group label or explicit current-language state.
- GitHub and LinkedIn links open new tabs without `rel="noopener noreferrer"`.
- The `Mend.io` URL is malformed as `http://Mend.io` and should be corrected or made plain text.
- The CSS contains a nested `::after` rule inside `.contact-list a`, which is not valid in ordinary CSS and appears to contain an escaped entity rather than an arrow.
- The contact labels are hard-coded in a shared partial and are not localized on the Georgian page.
- Dates are plain strings rather than machine-readable time ranges.
- The hero summary is a very long paragraph with a large number of tools; it is difficult to scan.
- Percentage skill labels do not explain the scale or evidence behind the values.
- Repeated hyphenated Markdown bullets are passed through a Markdown parser, which makes content formatting depend on text punctuation.
- All external links should be audited for HTTPS and `noopener noreferrer`.

## SEO and crawlability observations

Current positives:

- Static HTML is straightforward for crawlers.
- The title identifies the person and document type.
- A meta description exists.
- English and Georgian have different URLs.
- Section headings describe the content.
- Project links provide relevant external context.

Current gaps:

- No `robots.txt` was found in the source tree.
- No sitemap generation exists.
- No canonical link is emitted.
- No `hreflang` links connect `/` and `/ka/`.
- No Open Graph or Twitter card metadata.
- No JSON-LD for `Person`, `ProfilePage`, or `WebSite`.
- The generic description is not localized or page-specific.
- The English and Georgian pages have duplicated templates rather than a shared language-aware metadata system.
- There is no explicit social preview image metadata.

The Astro rewrite should solve these in the shared layout, following slick.ge’s current canonical and hreflang patterns. Add a sitemap for the English and Georgian pages, a production `robots.txt`, localized metadata, social previews, and Person/ProfilePage JSON-LD.

## Migration risks

1. **Data loss during consolidation**: the English and Georgian files contain different wording and some values. Build a key-by-key parity report before merging them.
2. **PDF path mismatch**: the Georgian JSON points to a PDF that is not currently present in the repository. Do not preserve a broken download link.
3. **Date semantics**: converting text dates to ISO dates can accidentally change display wording. Store machine dates and retain localized display labels where needed.
4. **Print parity**: the two current print pages are independently maintained. The new print component must be checked against both locales.
5. **Markdown details**: bullets are encoded inside strings. Normalize details into arrays of bullet strings before rendering.
6. **Public verification codes**: confirm whether LPIC verification codes should remain in visible web/print output.
7. **Historical content density**: moving every role into the slick.ge homepage may make the landing page too long. Keep a full CV view and selected experience on the main page.
8. **Asset licensing and relevance**: inspect the decorative JPEGs, screenshots, profile image, and favicon before carrying them into the new visual system. Several image assets are not referenced by the current templates.
9. **Deployment behavior**: the PDF workflow writes to the source tree and pushes from CI. This is convenient but can create automated commits and race with normal pushes.

## Recommended rewrite stages

### Stage 1: Content normalization

- Create one `src/data/content.json` with localized values side by side.
- Normalize experience, education, projects, languages, interests, contacts, metadata, and PDF URLs.
- Convert dates to structured values.
- Convert Markdown bullet strings into arrays.
- Decide whether verification codes and phone/email are public.
- Produce a parity report against both existing JSON files.

The normalized content should distinguish between shared identity facts and page-specific presentation. Shared facts include the name, role, current employer, career dates, major scopes, certifications, education, projects, social links, and contact details. slick.ge’s About page can present selected facts as a narrative; the CV can present the same facts as structured experience and education records.

### Stage 2: Astro shell

- Move to the same Astro setup and route convention as slick.ge.
- Add `/en/` and `/ka/` pages using one shared `ResumePage` component.
- Make `/` redirect to the chosen English canonical route.
- Reuse `BaseLayout`, localized `Fonts`, canonical links, hreflang, Open Graph, and footer conventions.
- Add a shared print route for both locales.
- Add clear companion links between the sites: slick.ge should link to the full CV, and the CV should link back to slick.ge’s About, services, and contact pages.

### Stage 3: Slick.ge visual translation

- Replace dark palette and borders with slick.ge tokens and surfaces.
- Rebuild the hero as a concise statement plus proof line.
- Highlight EPAM, Liberty Bank, and HCOJ as Recent work.
- Place toolkit categories in expandable cards.
- Add projects/homelab as selected work.
- Keep full chronology in a dedicated experience section or downloadable CV.
- Add contact/social links consistent with slick.ge.

The new slick.ge About page should be the authoritative personal introduction. It can reuse the CV’s verified background while adding the context that belongs on the business site: the Slick identity, consulting focus, working style, current security/infrastructure work, homelab, and reasons a team should get in touch. The CV should avoid competing with that page by keeping its opening focused on professional summary and evidence.

### Stage 4: SEO and quality

- Add sitemap and robots.txt.
- Add localized canonical/hreflang metadata.
- Add Person/ProfilePage JSON-LD.
- Add social preview metadata and a dedicated image.
- Add accessibility tests, route tests, print tests, and overflow checks for both locales.
- Verify every download link, project link, and external profile link.

### Stage 5: Deployment

- Replace the Eleventy workflow with the slick.ge Astro build workflow or a shared reusable workflow.
- Generate PDFs as build artifacts rather than committing generated files from CI, unless versioned PDFs are an explicit requirement.
- Deploy the static `dist` directory.
- Add smoke tests for `/en/`, `/ka/`, `/robots.txt`, sitemap, PDFs, canonical links, and language alternates.

## Decisions to make before implementation

- Should the resume remain a separate `cv.ghvineria.com` site or become a section linked from slick.ge?
- The current direction is a separate `cv.ghvineria.com` companion site, linked prominently from slick.ge and sharing content/data conventions with it.
- Which page is canonical: `/` or `/en/`?
- Should the new resume be a marketing-style profile with selected work, or a complete chronological CV on the first page?
- Which information belongs only on slick.ge’s About page, which belongs only in the full CV, and which should be shared between both?
- Should the About page link to individual CV sections or only to the downloadable/full CV route?
- Should early-career roles remain expanded on the public page?
- Should the current skill percentages be removed in favor of daily/familiar toolkit tiers?
- Should the LPIC verification codes be shown publicly?
- Should the phone number and personal email remain visible to crawlers?
- Should the dark resume palette be discarded entirely in favor of slick.ge’s light neumorphic theme?
- Which PDF should be the source of truth: generated from the site or maintained separately?
- Should social links include the current Boot.dev profile, which exists in the data but is not rendered by the current contact partial?
