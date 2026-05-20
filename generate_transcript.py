from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document()
section = doc.sections[0]
section.top_margin    = Cm(2.0)
section.bottom_margin = Cm(2.0)
section.left_margin   = Cm(2.5)
section.right_margin  = Cm(2.5)

NAVY  = RGBColor(0x0B, 0x1F, 0x3B)
TEAL  = RGBColor(0x00, 0xB4, 0xA2)
RED   = RGBColor(0xDC, 0x26, 0x26)
AMBER = RGBColor(0xD9, 0x77, 0x06)
GRAY  = RGBColor(0x64, 0x74, 0x8B)
LGRAY = RGBColor(0x94, 0xA3, 0xB8)
GREEN = RGBColor(0x05, 0x96, 0x69)

def p(text="", size=11, bold=False, italic=False, color=None, align=None, space_before=0, space_after=6):
    para = doc.add_paragraph()
    para.paragraph_format.space_before = Pt(space_before)
    para.paragraph_format.space_after  = Pt(space_after)
    if align:
        para.alignment = align
    if text:
        run = para.add_run(text)
        run.font.name   = "Calibri"
        run.font.size   = Pt(size)
        run.font.bold   = bold
        run.font.italic = italic
        if color:
            run.font.color.rgb = color
    return para

def h1(text):
    return p(text, size=20, bold=True, color=NAVY, space_before=16, space_after=4)

def h2(text):
    return p(text, size=13, bold=True, color=TEAL, space_before=14, space_after=3)

def h3(text):
    return p(text, size=11, bold=True, color=NAVY, space_before=8, space_after=2)

def body(text, color=None):
    return p(text, size=11, color=color or RGBColor(0x1E, 0x29, 0x3B), space_after=5)

def speak(text):
    para = doc.add_paragraph()
    para.paragraph_format.space_after  = Pt(6)
    para.paragraph_format.left_indent  = Inches(0.3)
    run = para.add_run(text)
    run.font.name   = "Calibri"
    run.font.size   = Pt(11)
    run.font.italic = True
    run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    return para

def action(text):
    para = doc.add_paragraph()
    para.paragraph_format.space_after  = Pt(4)
    para.paragraph_format.left_indent  = Inches(0.3)
    r1 = para.add_run("[ ACTION ]  ")
    r1.font.name  = "Calibri"
    r1.font.size  = Pt(10)
    r1.font.bold  = True
    r1.font.color.rgb = TEAL
    r2 = para.add_run(text)
    r2.font.name  = "Calibri"
    r2.font.size  = Pt(10)
    r2.font.color.rgb = GRAY
    return para

def tip(text):
    para = doc.add_paragraph()
    para.paragraph_format.space_after  = Pt(4)
    para.paragraph_format.left_indent  = Inches(0.3)
    r1 = para.add_run("[ TIP ]  ")
    r1.font.name  = "Calibri"
    r1.font.size  = Pt(10)
    r1.font.bold  = True
    r1.font.color.rgb = AMBER
    r2 = para.add_run(text)
    r2.font.name  = "Calibri"
    r2.font.size  = Pt(10)
    r2.font.color.rgb = GRAY
    return para

def divider():
    para = doc.add_paragraph()
    para.paragraph_format.space_before = Pt(4)
    para.paragraph_format.space_after  = Pt(4)
    run = para.add_run("─" * 85)
    run.font.name  = "Calibri"
    run.font.size  = Pt(8)
    run.font.color.rgb = LGRAY

def screen(text):
    para = doc.add_paragraph()
    para.paragraph_format.space_before = Pt(6)
    para.paragraph_format.space_after  = Pt(4)
    r1 = para.add_run("SCREEN:  ")
    r1.font.name  = "Calibri"
    r1.font.size  = Pt(10)
    r1.font.bold  = True
    r1.font.color.rgb = NAVY
    r2 = para.add_run(text)
    r2.font.name  = "Calibri"
    r2.font.size  = Pt(10)
    r2.font.bold  = True
    r2.font.color.rgb = RGBColor(0x43, 0x38, 0xCA)
    return para

# ═══════════════════════════════════════════════════════════
# COVER
# ═══════════════════════════════════════════════════════════
cp = doc.add_paragraph()
cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
cp.paragraph_format.space_before = Pt(20)
r = cp.add_run("Presentation Transcript")
r.font.name = "Calibri"; r.font.size = Pt(26); r.font.bold = True
r.font.color.rgb = NAVY

p("The 9:30 AM Call  —  Unilever Demo", size=14, italic=True, color=TEAL, align=WD_ALIGN_PARAGRAPH.CENTER)
p("What to say · When to click · What to show on screen", size=10, color=LGRAY, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
divider()

# ═══════════════════════════════════════════════════════════
# HOW TO USE THIS DOCUMENT
# ═══════════════════════════════════════════════════════════
h1("How to Use This Document")
body("This transcript is your word-for-word speaking guide. It is structured in two parts:")
body("Part 1 — business_scenarios.html:  Walk through the 5-step slide deck in your browser. This is your story.")
body("Part 2 — The Product (localhost:3002):  Switch to the live product and show the same numbers on a real screen.")
body("Each section tells you exactly what to say (in italics), what to click, and what screen to be on.")
tip("Open business_scenarios.html in one browser tab. Open localhost:3002/dashboard in another. Switch between them during the presentation.")
tip("The product is pre-configured to show Delhi (DEL) data by default — the exact scenario numbers from the slide deck.")

divider()

# ═══════════════════════════════════════════════════════════
# OPENING — BEFORE THE SLIDES
# ═══════════════════════════════════════════════════════════
h1("Opening — Before You Open Any Screen")
body("Shake hands, settle in. Then say this before touching the keyboard.")
p()
speak(
    "Thank you for your time today. I want to start with a question. "
    "How many systems does your supply chain team log into every morning? "
    "Most companies we work with — it's four or five. Kinaxis for demand, Anaplan for supply, "
    "Blue Yonder for the warehouse, a TMS for transport. "
    "Each team sees their piece. Nobody sees all four at once. "
    "That gap — that's the problem we solve. Let me show you a real scenario."
)
divider()

# ═══════════════════════════════════════════════════════════
# PART 1: business_scenarios.html
# ═══════════════════════════════════════════════════════════
h1("Part 1 — The Business Scenario  (business_scenarios.html)")
screen("Open business_scenarios.html in your browser. You should be on Step 1 of 5.")

# ── STEP 1 ──────────────────────────────────────────────────
h2("Step 1 — The Blind Spots")
action("business_scenarios.html is open. Step 1 is visible — 4 silo cards on screen.")
p()
speak(
    "This is a Tuesday morning. 9 AM. "
    "Unilever's four teams are each starting their day by logging into their own system. "
    "Let me walk you through what each team sees."
)
p()
speak(
    "Kinaxis — demand planning — shows Personal Care demand in Delhi running 12% above the weekly plan. "
    "The demand team notes it internally. A flag. Manageable."
)
p()
speak(
    "Anaplan — supply planning — shows a replenishment purchase order is running 6 days late. "
    "Supplier confirmation is still pending. The supply team is tracking it. Also manageable, on its own."
)
p()
speak(
    "Blue Yonder — the warehouse system — shows stock cover at 4.1 days in Delhi. "
    "Blue Yonder thinks this is within acceptable range. No alert fires. The warehouse team moves on."
)
p()
speak(
    "And TMS — transport — shows Blue Dart's on-time delivery on the Delhi to Mumbai route at 71%. "
    "It gets logged as a carrier performance issue. Also tracked. Also separate."
)
p()
speak(
    "Four teams. Four systems. Four small flags. And in a traditional AMS model — "
    "each support team handles their own system. Nobody is looking at all four together. "
    "So nobody sees what's actually happening."
)
action("Click 'Next' or press the right arrow key to go to Step 2.")

# ── STEP 2 ──────────────────────────────────────────────────
h2("Step 2 — Our Platform View")
action("Step 2 is now visible — 4 signal rows on the left, insight card on the right.")
p()
speak(
    "This is what our analyst, Priya, sees when she opens our platform at 9:05 AM. "
    "Same morning. Same data. But she doesn't log into four systems. She opens one screen."
)
p()
speak(
    "Kinaxis signal — demand up 12%. Watch status. "
    "Anaplan signal — PO delayed 6 days. Delayed status. "
    "Blue Yonder signal — stock cover 4.1 days, falling. "
    "TMS signal — Blue Dart at 71% OTD. Critical."
)
p()
speak(
    "Four signals. In one view. And this is where it gets interesting — "
    "because no single system raised a critical alert. "
    "But our platform sees all four simultaneously, and the combined picture is very different."
)
action("Point to the insight card on the right.")
speak(
    "Four signals. One risk. "
    "This is what our platform was built to see."
)
action("Click Next to go to Step 3.")

# ── STEP 3 ──────────────────────────────────────────────────
h2("Step 3 — Connecting the Dots")
action("Step 3 is visible — node diagram showing the 4 systems pointing to a stockout risk.")
p()
speak(
    "Let me show you the logic — how our platform connects these four signals into one conclusion."
)
p()
speak(
    "Kinaxis is showing demand up 12%. That means stock is burning 12% faster than Blue Yonder's model assumes. "
    "But Blue Yonder doesn't know about the demand spike — it only sees its own data. "
    "So Blue Yonder thinks 4.1 days of cover is fine. It's not, because the real depletion rate is faster."
)
p()
speak(
    "Anaplan shows the replenishment PO is 6 days late. That PO is not going to land before stock hits zero."
)
p()
speak(
    "And TMS shows Blue Dart at 71% on the Delhi-Mumbai lane. "
    "So even the emergency option — transfer stock from Mumbai — is not reliable this week."
)
p()
speak(
    "Put those four together: stock burning faster, replenishment late, backup route failing. "
    "The conclusion — Delhi Personal Care hits zero stock in 7 days. "
    "Not visible in any single system. Visible only when you look at all four at once."
)
action("Click Next to go to Step 4.")

# ── STEP 4 ──────────────────────────────────────────────────
h2("Step 4 — The 9:30 AM Call")
action("Step 4 is visible — the call card with Priya and Rajesh, script, findings, recommendations.")
p()
speak(
    "So what does Priya do with this? She picks up the phone. "
    "It's 9:30 AM. Unilever's own S&OP meeting is at 11. She calls 90 minutes before."
)
p()
action("Point to the script box.")
speak(
    "She says — Rajesh, I need three minutes before your S&OP. "
    "Our platform is showing a stockout risk on Personal Care SKUs in Delhi — within seven days. "
    "Your four systems are each showing a small flag, but together they're telling a different story. "
    "I want to walk you through it and give you our recommendation before you go in."
)
p()
speak(
    "She shares the cross-system picture: demand up 12, PO delayed, Blue Dart failing. "
    "And she gives three recommendations on the same call: "
    "expedite the Anaplan PO today, pre-position safety stock from Mumbai before it drops to 2 days, "
    "and temporarily switch the Delhi-Mumbai lane from Blue Dart to DTDC."
)
p()
speak(
    "Rajesh's response — right there on the call — "
    "'None of my team flagged this. Send me a written brief. I'm sharing it in the S&OP in 90 minutes.'"
)
speak(
    "That is the value of what we do. Not responding to tickets. Calling before the problem exists."
)
action("Click Next to go to Step 5.")

# ── STEP 5 ──────────────────────────────────────────────────
h2("Step 5 — The Outcome")
action("Step 5 is visible — 4 metric cards, the Rajesh quote, the contract shift card.")
p()
speak(
    "Three days later, Rajesh sends a note. "
    "The stockout was averted. Zero lost sales days. "
    "The action was taken 7 days in advance. "
    "Four systems consolidated into one decision. "
    "And Unilever walked into their own S&OP meeting already prepared — 90 minutes before it started."
)
p()
action("Point to the contract shift card on the right.")
speak(
    "This is the shift we create. "
    "Before — Unilever thinks of us as: 'they respond well to our tickets and meet their SLAs.' "
    "After — Unilever thinks of us as: 'they see things our own systems can't — and they call us first.' "
    "That is the difference between a support contract and a strategic partnership."
)
p()
speak(
    "The question at contract renewal is not 'are we getting support?' "
    "The question is — what would Unilever miss without our team?"
)

divider()

# ═══════════════════════════════════════════════════════════
# PART 2: THE LIVE PRODUCT
# ═══════════════════════════════════════════════════════════
h1("Part 2 — The Live Product  (localhost:3002)")
screen("Switch to the browser tab with localhost:3002. The dashboard opens on Delhi by default.")
p()
speak(
    "Now let me show you this is not just a slide deck. "
    "Everything I just described — you can see it live on our product right now. "
    "This is the actual platform our team uses every morning."
)

h2("Screen 1 — Executive Overview Dashboard  (localhost:3002/dashboard)")
action("Dashboard is open. Delhi is already selected as the warehouse filter.")
p()
speak(
    "This is the first screen our analyst opens every morning. "
    "Notice the warehouse is already set to Delhi — the exact scenario I just walked you through."
)
p()
speak(
    "Look at the KPI cards. "
    "Demand Variance — 12%. Red. That's the Kinaxis signal. "
    "Days of Cover — 4.1 days. Red. That's the Blue Yonder signal. "
    "On-Time Delivery — 71.2%. Red. That's the TMS signal. "
    "Stockout Risk — 14 SKUs flagged high. Red."
)
p()
speak(
    "These are the same four numbers from the slide deck. Not a mockup. Live data."
)
action("Scroll down to the Cross-System Signals section at the bottom of the dashboard.")
speak(
    "And here — at the bottom — is the combined alert. "
    "When all four of these signals breach their thresholds at the same time, "
    "the platform fires one cross-system alert. Critical severity. "
    "It says: demand spike, stock cover falling, carrier failing, replenishment thin — "
    "stockout in 7 days. "
    "No single system produced this. Our platform did."
)

h2("Screen 2 — Resilient Control Tower  (localhost:3002/control-tower)")
action("Click 'Resilient CT' in the left sidebar. Delhi is pre-selected.")
p()
speak(
    "This is the Control Tower. It shows your supply chain as a node flow — "
    "Suppliers, Warehouse, Transport, Customer — left to right."
)
p()
speak(
    "See the Warehouse node — Blue Yonder, Delhi. It's red. 4.1 days of cover, 14 SKUs at risk. "
    "See the Transport node — TMS, Blue Dart. Also red. 71.2% on-time delivery. "
    "Two nodes red simultaneously. That's the visual story of the scenario — "
    "the warehouse is stressed and the backup option is also failing."
)

h2("Screen 3 — Operations Desk  (localhost:3002/operations-desk)")
action("Click 'Operations Desk' in the left sidebar.")
p()
speak(
    "This is where our team manages the day-to-day work for your account. "
    "Every open issue is tracked here — by team, by priority, by age."
)
action("Click the 'Solution' button on any open ticket.")
speak(
    "When our analyst opens a ticket, the platform surfaces the resolution from the last time "
    "this same pattern occurred — which past case it's based on, the confidence level, "
    "and the step-by-step resolution. "
    "They can approve it and apply it immediately, or take a different approach. "
    "We are not starting from scratch every time."
)

h2("The Voice AI — VAPI Widget")
action("Point to the microphone icon in the bottom-right corner of any page.")
speak(
    "And finally — this is the voice AI widget. "
    "Our analyst can brief you in plain spoken language — 'what is the stockout risk in Delhi today?' "
    "— and the platform answers from the live data. "
    "This is the 9:30 AM call, powered by AI."
)

divider()

# ═══════════════════════════════════════════════════════════
# CLOSING
# ═══════════════════════════════════════════════════════════
h1("Closing — What to Say at the End")
p()
speak(
    "Let me summarise what you have seen today. "
    "Unilever runs four world-class systems — Kinaxis, Anaplan, Blue Yonder, and your TMS. "
    "Each of those systems is doing exactly what it was designed to do. "
    "The gap is not in the tools. The gap is in the space between them."
)
p()
speak(
    "Our managed services contract, powered by this platform, sits in that gap. "
    "We connect the signals your own teams cannot connect, "
    "and we call you before you know something is wrong. "
    "That is not a support service. That is a strategic intelligence partner."
)
p()
speak(
    "I am happy to take any questions."
)

divider()

# ═══════════════════════════════════════════════════════════
# QUICK REFERENCE: NAVIGATION CHEAT SHEET
# ═══════════════════════════════════════════════════════════
h1("Quick Reference — Navigation Cheat Sheet")
body("Keep this section visible on your phone or a printed copy while presenting.")
p()
h3("business_scenarios.html")
body("Step 1 → 2 → 3 → 4 → 5  using the Next button or right arrow key on keyboard.")
body("You can also click any step dot in the top bar to jump directly.")
p()
h3("Product — localhost:3002")
body("Dashboard      →  localhost:3002/dashboard          (opens on DEL by default)")
body("Control Tower  →  localhost:3002/control-tower      (opens on DEL by default)")
body("Operations     →  localhost:3002/operations-desk")
body("Sidebar links take you between sections — no URL typing needed.")
p()
h3("Key numbers to remember (they match the slide deck exactly)")
body("Demand Variance:  12%   (Kinaxis)")
body("Days of Cover:    4.1 days   (Blue Yonder)")
body("On-Time Delivery: 71.2%   (TMS — Blue Dart)")
body("Stockout Risk:    14 SKUs at High risk")
body("Active POs:       6   (Anaplan — critically low)")

# ── Save ──────────────────────────────────────────────────
doc.save(r"d:\wms1\Presentation_Transcript.docx")
print("Done — saved to d:\\wms1\\Presentation_Transcript.docx")
