from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

doc = Document()

# ── Page margins ──────────────────────────────────────────────────────────────
section = doc.sections[0]
section.top_margin    = Cm(2.0)
section.bottom_margin = Cm(2.0)
section.left_margin   = Cm(2.5)
section.right_margin  = Cm(2.5)

# ── Colour palette ────────────────────────────────────────────────────────────
NAVY    = RGBColor(0x0B, 0x1F, 0x3B)
TEAL    = RGBColor(0x00, 0xB4, 0xA2)
AMBER   = RGBColor(0xD9, 0x77, 0x06)
RED     = RGBColor(0xDC, 0x26, 0x26)
SLATE   = RGBColor(0x47, 0x56, 0x94)
WHITE   = RGBColor(0xFF, 0xFF, 0xFF)
LGRAY   = RGBColor(0x94, 0xA3, 0xB8)

def set_font(run, size=11, bold=False, color=None, italic=False):
    run.font.name  = "Calibri"
    run.font.size  = Pt(size)
    run.font.bold  = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = color

def heading1(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after  = Pt(4)
    run = p.add_run(text)
    set_font(run, size=18, bold=True, color=NAVY)
    return p

def heading2(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after  = Pt(2)
    run = p.add_run(text)
    set_font(run, size=13, bold=True, color=TEAL)
    return p

def heading3(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after  = Pt(2)
    run = p.add_run(text)
    set_font(run, size=11, bold=True, color=NAVY)
    return p

def body(text, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    run = p.add_run(text)
    set_font(run, size=11, color=RGBColor(0x1E, 0x29, 0x3B))
    return p

def bullet(text, level=0):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after  = Pt(3)
    p.paragraph_format.left_indent  = Inches(0.25 + level * 0.25)
    run = p.add_run(text)
    set_font(run, size=11, color=RGBColor(0x1E, 0x29, 0x3B))
    return p

def label_value(label, value, label_color=TEAL):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(3)
    r1 = p.add_run(label + ":  ")
    set_font(r1, size=11, bold=True, color=label_color)
    r2 = p.add_run(value)
    set_font(r2, size=11, color=RGBColor(0x1E, 0x29, 0x3B))
    return p

def divider():
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after  = Pt(4)
    run = p.add_run("─" * 80)
    set_font(run, size=8, color=LGRAY)
    return p

def callout(text, color=TEAL):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after  = Pt(6)
    p.paragraph_format.left_indent  = Inches(0.3)
    run = p.add_run(text)
    set_font(run, size=11, bold=True, color=color, italic=True)
    return p

# ══════════════════════════════════════════════════════════════════════════════
# COVER
# ══════════════════════════════════════════════════════════════════════════════
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.paragraph_format.space_before = Pt(24)
run = p.add_run("The 9:30 AM Call")
set_font(run, size=28, bold=True, color=NAVY)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("How Our Platform Caught a Stockout Seven Days Before It Happened")
set_font(run, size=14, color=TEAL, italic=True)

doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("A Presentation Story Guide  ·  Unilever Demo  ·  May 2026")
set_font(run, size=10, color=LGRAY)

divider()

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — CONTEXT
# ══════════════════════════════════════════════════════════════════════════════
heading1("1.  The Context — Who We Are and What We Do")

body(
    "We are a managed services partner. Our job is not to sell Unilever another software tool. "
    "Unilever already runs four best-in-class systems: Kinaxis for demand planning, Anaplan for supply "
    "planning, Blue Yonder for warehouse management, and a TMS for transport. Each of those systems is "
    "doing exactly what it was designed to do."
)

body(
    "The problem is not the tools. The problem is that no single tool — and no single team logging into "
    "four separate portals — can see all four simultaneously. Our platform is the intelligence layer that "
    "sits above all of them. Our managed services team uses it every morning, on Unilever's behalf, to "
    "connect signals that no individual system can produce on its own."
)

callout(
    "\"We are not selling you a tool. We are selling you a team that sees across all your tools "
    "and calls you before you know something is wrong.\"",
    color=NAVY
)

divider()

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — THE PROBLEM
# ══════════════════════════════════════════════════════════════════════════════
heading1("2.  The Problem — Four Systems, Four Blind Spots")

body(
    "Every morning, Unilever's supply chain teams start their day by logging into their systems one by one. "
    "Here is what each team sees — and more importantly, what each team cannot see."
)

heading2("Kinaxis  —  Demand Planning")
bullet("Demand for Personal Care SKUs in Delhi is running +12% above the weekly plan.")
bullet("Kinaxis flags it as a variance. The demand team notes it internally.")
bullet("What Kinaxis cannot see: whether the warehouse has enough stock to absorb this spike.")

heading2("Anaplan  —  Supply Planning")
bullet("A replenishment purchase order for Delhi is running 6 days late. Supplier confirmation is pending.")
bullet("Anaplan flags it as a tracking item.")
bullet("What Anaplan cannot see: how much stock cover remains in the warehouse, or whether the carrier can deliver if the PO is expedited.")

heading2("Blue Yonder  —  Warehouse")
bullet("Delhi warehouse stock cover is at 4.1 days — within what Blue Yonder considers acceptable range.")
bullet("Blue Yonder shows no critical alert.")
bullet("What Blue Yonder cannot see: that demand is running 12% above plan, which means stock will deplete 12% faster than its model assumes.")

heading2("TMS  —  Transport")
bullet("Blue Dart's on-time delivery on the DEL → MUM lane is at 71.2%.")
bullet("The TMS logs it as a carrier performance issue.")
bullet("What the TMS cannot see: that this is the same lane that would be needed for an emergency stock transfer if Delhi runs out.")

callout(
    "Each signal looks manageable in isolation. Together, they tell a single story: "
    "Unilever is 7 days away from a stockout in Delhi Personal Care. "
    "No individual system raised a critical alert. Traditional AMS support would not have caught this.",
    color=RED
)

divider()

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — OUR PLATFORM VIEW
# ══════════════════════════════════════════════════════════════════════════════
heading1("3.  Our Platform View — One Screen, All Four Systems")

body(
    "Our consultant, Priya Mehta, opens the Planning Hub dashboard at 9:15 AM. She selects the Delhi "
    "warehouse filter. This is what the platform shows her — in one screen, before she has opened a "
    "single Unilever portal."
)

heading2("On the Executive Overview Dashboard")

label_value("Demand Variance (Kinaxis)", "+12.0%  ↑  Target ≤ 5%  —  RED", label_color=RED)
label_value("Stockout Risk High (Blue Yonder)", "14 SKUs  —  RED", label_color=RED)
label_value("Days of Cover (Blue Yonder)", "4.1 days  —  Target ≥ 21 days  —  RED", label_color=RED)
label_value("On-Time Delivery (TMS)", "71.2%  —  Target ≥ 92%  —  RED", label_color=RED)
label_value("Active POs (Anaplan)", "6  —  critically low replenishment pipeline", label_color=AMBER)

doc.add_paragraph()
body(
    "At the bottom of the dashboard, the Cross-System Signals panel fires a single combined alert:"
)

callout(
    "⚠  CRITICAL  —  Cross-system stockout risk  —  4 signals converging:\n"
    "Demand +12%  ·  Stock cover 4.1 days  ·  Carrier OTD 71.2%  ·  Only 6 active POs\n"
    "→  Stockout projected within 7 days for Personal Care SKUs in DEL.\n"
    "→  No single system flagged this independently.",
    color=RED
)

heading2("On the Resilient Control Tower")
body(
    "The Control Tower shows the full supply chain as a node flow: "
    "Suppliers (Kinaxis · Anaplan)  →  Warehouse (Blue Yonder · DEL)  →  Transport (TMS · Blue Dart)  →  Customer."
)
bullet("Suppliers node: Demand Variance 12% — AMBER. Active POs critically low.")
bullet("Warehouse node (Blue Yonder): Days of Cover 4.1 days — RED. Fill Rate 89.3% — declining.")
bullet("Transport node (TMS): On-Time Delivery 71.2% — RED. Delay Rate 28.8%.")
body(
    "Two nodes are simultaneously red. The platform automatically computes the combined impact: "
    "a stockout is not just possible — it is probable, and the backup option (emergency stock transfer "
    "via Blue Dart) is also compromised because that carrier is failing."
)

divider()

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — THE 9:30 AM CALL
# ══════════════════════════════════════════════════════════════════════════════
heading1("4.  The 9:30 AM Call — 90 Minutes Before Unilever's S&OP")

body(
    "At 9:30 AM, Priya calls Rajesh Sharma, Unilever's Supply Chain Director. "
    "Unilever's own S&OP meeting is scheduled for 11:00 AM. Priya is calling first."
)

heading2("What Priya Tells Rajesh")

bullet("Kinaxis shows demand for Personal Care in Delhi running +12% above plan this week.")
bullet("Blue Yonder shows only 4.1 days of stock cover remaining — stock is depleting 12% faster than Blue Yonder's model assumes, because its model does not know about the demand spike.")
bullet("Anaplan's replenishment PO is 6 days late and will not land before stock hits zero.")
bullet("Blue Dart is at 71.2% OTD on DEL → MUM. An emergency stock transfer is not a viable backup.")
bullet("Combined: without action today, Delhi Personal Care hits zero stock in approximately 7 days.")

heading2("What Priya Recommends")

bullet("Raise an emergency replenishment PO immediately — before the S&OP, not after.")
bullet("Switch the inbound replenishment to an alternate carrier — not Blue Dart for this shipment.")
bullet("Brief the S&OP with this cross-system picture so the team walks in with a resolution, not a discovery.")

callout(
    '"Priya called us before we knew there was a problem. She had the cross-system picture, '
    'the recommendation, and the brief — before our own S&OP started. We did not lose a single day of sales."\n'
    "— Rajesh Sharma, Unilever Supply Chain Director",
    color=TEAL
)

divider()

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5 — WHAT YOU SEE ON THE PRODUCT
# ══════════════════════════════════════════════════════════════════════════════
heading1("5.  Demo Script — What to Show on the Product")

body(
    "Use this as your screen-by-screen guide when presenting the product live."
)

heading2("Screen 1  —  Executive Overview  (localhost:3002/dashboard)")
bullet("Set Warehouse filter to DEL.")
bullet("Point to the three red KPI cards: Demand Variance 12%, Days of Cover 4.1 days, OTD 71.2%.")
bullet("Say: 'Each of these comes from a different system. Our platform pulls all of them into one view every morning.'")
bullet("Scroll to Cross-System Signals at the bottom — show the combined CRITICAL alert firing.")
bullet("Say: 'This single alert ties all four signals together. No individual system produced this. We did.'")

heading2("Screen 2  —  Resilient Control Tower  (localhost:3002/control-tower)")
bullet("Keep DEL filter active.")
bullet("Show the node flow: Suppliers → Warehouse → Transport → Customer.")
bullet("Point to the red Warehouse node: 'Blue Yonder is showing 4.1 days of cover — that is 17 days below the safety target.'")
bullet("Point to the red Transport node: 'Blue Dart is at 71.2% OTD — the backup option is also failing.'")
bullet("Say: 'Two nodes failing simultaneously is what creates the 7-day stockout window. This is what our team sees every morning.'")

heading2("Screen 3  —  Operations Desk  (localhost:3002/operations-desk)")
bullet("Show the ticket queue.")
bullet("Click the 'Solution' button on any open ticket to show the suggested resolution panel.")
bullet("Say: 'When our team logs a ticket against one of your systems, the platform surfaces the resolution from the last time this pattern occurred — so we are not starting from scratch every time.'")

heading2("Screen 4  —  VAPI Voice Widget  (bottom-right of any page)")
bullet("Show the voice AI button.")
bullet("Say: 'This is how our consultant briefs the client — a spoken, conversational summary of the cross-system picture. The platform generates the insight; the consultant delivers it.'")

divider()

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 6 — THE OUTCOME
# ══════════════════════════════════════════════════════════════════════════════
heading1("6.  The Outcome — What Changes for Unilever")

heading2("Before — Traditional AMS")
bullet("Unilever's teams log into four systems every morning and see four disconnected fragments.")
bullet("Cross-system risks go undetected until a stockout, a service failure, or a missed order has already happened.")
bullet("The managed services team responds to incidents. They explain fires after they have burned.")
bullet("Average time from risk emergence to detection: 5–7 days.")

heading2("After — With Our Platform")
bullet("One platform. One morning view. All four systems visible simultaneously.")
bullet("Cross-system alerts fire automatically when signals from multiple systems converge into a combined risk.")
bullet("The managed services team calls Unilever proactively — 7 days before the stockout, not after.")
bullet("Average time from risk emergence to client brief: same morning.")

heading2("Measurable Impact — DEL Scenario")
label_value("Stockout prevented",     "7 days of Personal Care sales protected")
label_value("Emergency action taken", "Same day — before the S&OP, not after")
label_value("Revenue protected",      "Est. ₹0.9 Cr inventory value at risk, preserved")
label_value("Root cause identified",  "Blue Dart carrier failure + demand spike + late PO — connected in one alert")

callout(
    "The question Unilever will ask at contract renewal is not 'Are we getting support?' — "
    "it is 'What would we miss without this team?'",
    color=NAVY
)

divider()

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 7 — ANTICIPATED QUESTIONS
# ══════════════════════════════════════════════════════════════════════════════
heading1("7.  Anticipated Questions and How to Answer Them")

heading3("Q: How does your platform actually connect to our systems?")
body(
    "The platform is designed to ingest data from Kinaxis, Anaplan, Blue Yonder, and your TMS via "
    "scheduled data feeds — either API connections or secure file-based transfers overnight. "
    "In the demo you are seeing today, the data is representative of a real Unilever supply chain scenario. "
    "Once we begin the engagement, the first step is a data integration sprint to connect your live systems."
)

heading3("Q: What data do you need access to?")
body(
    "We need read access to KPI outputs from each system — demand variance, PO status, stock cover, "
    "and carrier performance data. We do not need access to transactional records or commercially "
    "sensitive pricing. Our security model is designed for managed services engagements at FMCG scale."
)

heading3("Q: How is this different from what our own teams can do with a BI tool?")
body(
    "A BI tool shows you what happened. Our platform tells you what is about to happen — and what to do "
    "about it. The difference is the cross-system alert logic: we have pre-built the rules that connect "
    "a TMS carrier failure to a warehouse stockout risk to a demand spike. Your BI team would need to "
    "build and maintain those rules themselves. We bring that intelligence as part of the managed service."
)

heading3("Q: What happens when one of our systems changes or upgrades?")
body(
    "Our managed services team handles system changes as part of the contract. When Kinaxis releases "
    "a new version, we update our integration layer. Unilever does not absorb that effort — we do."
)

heading3("Q: Can we see data for Mumbai and Bangalore too?")
body(
    "Yes — the platform is live for DEL, MUM, and BLR. Switch the warehouse filter on any screen to "
    "see each location independently. The cross-system alert logic applies across all three locations."
)

divider()

# ══════════════════════════════════════════════════════════════════════════════
# CLOSING NOTE
# ══════════════════════════════════════════════════════════════════════════════
heading1("Closing Note")

body(
    "The story of the 9:30 AM call is not a hypothetical. It is the scenario your product is built for — "
    "and it is the scenario you can walk Unilever through, screen by screen, on a live product today. "
    "The numbers on the dashboard are the same numbers in the story. The alert that fires is the same "
    "alert Priya would have seen. The Control Tower nodes are the same nodes in the narrative."
)

body(
    "When Unilever asks 'can I see this?', the answer is yes — open the browser, filter to DEL, "
    "and the product tells the story for you."
)

doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Planning Hub  ·  Managed Services Intelligence Layer  ·  May 2026")
set_font(run, size=9, color=LGRAY, italic=True)

# ── Save ──────────────────────────────────────────────────────────────────────
doc.save(r"d:\wms1\Unilever_Demo_Story.docx")
print("Done — saved to d:\\wms1\\Unilever_Demo_Story.docx")
