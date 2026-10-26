from typing import List, Optional
from app.modules.chatbot.schemas import UpcyclingProject, UpcyclingStep

CURATED_UPCYCLING_PROJECTS: List[UpcyclingProject] = [
    UpcyclingProject(
        id="upcycle-plastic-planter",
        title="Self-Watering Vertical Plastic Bottle Planter",
        category="PLASTIC_RECYCLING",
        materials_needed=[
            "1.5L or 2L clear plastic soda bottle",
            "Cotton string or yarn (6-8 inches)",
            "Potting soil or composted loam",
            "Cutter or scissors",
            "Plant seedling (e.g. pechay, basil, tomato)"
        ],
        difficulty="Easy (Beginner)",
        estimated_time="15-20 minutes",
        benefits="Diverts single-use PET bottles from waterways, enables compact urban gardening for Lipa City households, saves water with passive wicking.",
        source_url="https://emb.gov.ph/solid-waste-management/",
        steps=[
            UpcyclingStep(
                step_number=1,
                title="Cut the Bottle",
                instruction="Clean and dry the PET bottle. Cut it horizontally into two parts, about 4 inches below the bottle cap opening."
            ),
            UpcyclingStep(
                step_number=2,
                title="Perforate the Cap",
                instruction="Carefully puncture a small hole in the center of the bottle cap and thread the cotton string halfway through so both ends dangle."
            ),
            UpcyclingStep(
                step_number=3,
                title="Assemble & Invert",
                instruction="Screw the cap back on. Invert the top funnel section upside down and place it inside the bottom base cylinder."
            ),
            UpcyclingStep(
                step_number=4,
                title="Fill & Plant",
                instruction="Fill the lower base with 2 inches of clean water. Fill the upper funnel with moist potting soil with the wick embedded, then plant your seedling."
            )
        ]
    ),
    UpcyclingProject(
        id="upcycle-kitchen-compost",
        title="Zero-Odor Kitchen Peels Aerobic Composting",
        category="ORGANIC_WASTE",
        materials_needed=[
            "Perforated bucket or terracotta pot with lid",
            "Raw kitchen scraps (vegetable trimmings, fruit rinds, coffee grounds)",
            "Dry brown materials (dry leaves, shredded cardboard, or sawdust)",
            "Garden soil or previous compost starter"
        ],
        difficulty="Easy (Beginner)",
        estimated_time="30 days maturity",
        benefits="Diverts over 50% of household waste from city landfills, produces nutrient-rich humus (black gold) for backyard vegetables according to RA 9003.",
        source_url="https://nswmc.emb.gov.ph/",
        steps=[
            UpcyclingStep(
                step_number=1,
                title="Chop the Kitchen Waste",
                instruction="Chop vegetable peelings, banana peels, and fruit rinds into small 1-inch pieces to speed up microbial breakdown. Avoid cooked meats or dairy."
            ),
            UpcyclingStep(
                step_number=2,
                title="Layer Browns and Greens",
                instruction="Place a 2-inch layer of dry leaves/cardboard at the bottom, followed by a 2-inch layer of food scraps, alternating in a 2:1 ratio."
            ),
            UpcyclingStep(
                step_number=3,
                title="Moisten & Aerate",
                instruction="Ensure the compost stays as damp as a wrung-out sponge. Mix with a hand trowel twice weekly to provide oxygen and prevent bad odors."
            )
        ]
    ),
    UpcyclingProject(
        id="upcycle-ecobrick",
        title="Community Eco-Bricks from Non-Recyclable Plastic Wrappers",
        category="PLASTIC_DIVERSION",
        materials_needed=[
            "Clean, dry 500ml or 1L plastic PET bottle",
            "Non-recyclable clean plastic packaging (sachets, snack foil wrappers, cellophane)",
            "Wooden dowel or stick for packing"
        ],
        difficulty="Medium (Requires patience)",
        estimated_time="1-2 hours accumulating plastics",
        benefits="Compacts non-biodegradable residual waste into building blocks for barangay planters, park benches, and perimeter fences.",
        source_url="https://ecobricks.org/",
        steps=[
            UpcyclingStep(
                step_number=1,
                title="Clean and Dry Plastics",
                instruction="Wash food residue from sachets, chip bags, and wrappers. Ensure they are bone-dry to prevent bacteria inside the bottle."
            ),
            UpcyclingStep(
                step_number=2,
                title="Pack Tightly",
                instruction="Cut large wrappers into strips. Feed them into the bottle and tamp firmly with your stick until there is zero air space or sponginess."
            ),
            UpcyclingStep(
                step_number=3,
                title="Weigh & Seal",
                instruction="A 500ml bottle should weigh at least 175-200 grams. Cap securely and bring to the Barangay Sabang Materials Recovery Facility (MRF) for civic SAB-Points!"
            )
        ]
    ),
    UpcyclingProject(
        id="upcycle-eggshell-fertilizer",
        title="Eggshell Organic Calcium Soil Conditioner",
        category="ORGANIC_RECYCLING",
        materials_needed=[
            "Used eggshells (cracked, rinsed)",
            "Mortar and pestle or blender",
            "Baking tray or dry pan"
        ],
        difficulty="Very Easy",
        estimated_time="10 minutes",
        benefits="Supplies slow-release calcium carbonate to tomato and vegetable garden soil, preventing blossom end rot and conditioning soil pH naturally.",
        source_url="https://da.gov.ph/",
        steps=[
            UpcyclingStep(
                step_number=1,
                title="Rinse and Sun-Dry",
                instruction="Rinse residual egg whites and let the shells sun-dry or toast lightly in a dry pan for 3 minutes to make them brittle and sterile."
            ),
            UpcyclingStep(
                step_number=2,
                title="Grind into Powder",
                instruction="Crush the shells into coarse powder using a mortar and pestle or a blender."
            ),
            UpcyclingStep(
                step_number=3,
                title="Apply to Plants",
                instruction="Sprinkle 1-2 tablespoons around the base of potted plants or mix into planting hole soil before planting vegetables."
            )
        ]
    ),
    UpcyclingProject(
        id="upcycle-cardboard-seedling-tray",
        title="Biodegradable Egg Carton Seedling Starters",
        category="PAPER_RECYCLING",
        materials_needed=[
            "Cardboard egg cartons",
            "Seed starting soil mix",
            "Vegetable seeds"
        ],
        difficulty="Very Easy",
        estimated_time="10 minutes",
        benefits="Diverts paper waste, decomposes naturally in the soil, and eliminates root shock because the cups are planted directly into the ground.",
        source_url="https://emb.gov.ph/",
        steps=[
            UpcyclingStep(
                step_number=1,
                title="Separate Cups",
                instruction="Cut egg carton cups into individual planting sockets."
            ),
            UpcyclingStep(
                step_number=2,
                title="Fill with Loam",
                instruction="Fill each compartment 3/4 full with moist compost loam."
            ),
            UpcyclingStep(
                step_number=3,
                title="Germinate & Plant",
                instruction="Sow 1-2 seeds per cup. When seedlings sprout 4 leaves, bury the entire cardboard cup directly into garden beds; it will decompose into organic matter."
            )
        ]
    )
]

def find_matching_upcycling_project(query: str) -> Optional[UpcyclingProject]:
    q = query.lower()
    
    # Plastic bottle / planter keywords
    if any(k in q for k in ["plastic", "bote", "bottle", "planter", "tanim", "halaman", "vertical", "paso"]):
        return CURATED_UPCYCLING_PROJECTS[0]
        
    # Compost / kitchen peels
    if any(k in q for k in ["compost", "gulay", "prutas", "peel", "balat", "kitchen", "nabubulok", "pataba", "organic", "scraps"]):
        return CURATED_UPCYCLING_PROJECTS[1]
        
    # Ecobrick / wrappers
    if any(k in q for k in ["ecobrick", "eco-brick", "sachet", "wrapper", "plastik", "candy", "chips", "tsitsirya"]):
        return CURATED_UPCYCLING_PROJECTS[2]
        
    # Eggshells
    if any(k in q for k in ["egg", "itlog", "eggshell", "calcium"]):
        return CURATED_UPCYCLING_PROJECTS[3]
        
    # Cardboard / paper
    if any(k in q for k in ["carton", "karton", "cardboard", "papel", "seedling", "punla"]):
        return CURATED_UPCYCLING_PROJECTS[4]
        
    # Default to plastic planter if generic "upcycle" or "useful" or "gamit"
    if any(k in q for k in ["upcycle", "useful", "kapaki-pakinabang", "diy", "repurpose", "gamit", "project"]):
        return CURATED_UPCYCLING_PROJECTS[0]
        
    return None
