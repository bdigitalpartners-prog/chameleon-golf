import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const sections = [8, 4, 4, 4, 12];
  return sections
    .map((len) =>
      Array.from({ length: len }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join("")
    )
    .join("");
}

function esc(val: string | null | undefined): string {
  if (val === null || val === undefined) return "NULL";
  return `'${val.replace(/'/g, "''")}'`;
}

const articles = [
  {
    slug: "neutral-grip-pressure-guide",
    title: "Mastering Grip Pressure: The Foundation of Every Great Swing",
    subtitle:
      "Why grip pressure matters more than grip style — and the drill tour pros use to find their ideal squeeze",
    category: "swing-lab",
    subcategory: "swing-fundamentals",
    difficulty: "beginner",
    estimatedTime: "8 min read",
    content: `## Why Grip Pressure Is the Hidden Fundamental

Most golf instruction starts with *how* you hold the club — interlock, overlap, ten-finger. But the single biggest factor in shot quality isn't grip style; it's **grip pressure**.

Tour professionals typically rate their grip pressure at a 4 or 5 on a 1-to-10 scale. Weekend golfers routinely squeeze at 8 or 9, especially under pressure. That excess tension travels up the forearms, locks the wrists, and kills clubhead speed.

### The Pressure Scale Drill

1. **Set up** with a 7-iron and a range ball.
2. **Squeeze** the club as tightly as possible — that's a 10.
3. **Release** until you can barely hold the club — that's a 1.
4. **Find 4**: grip firmly enough that someone couldn't yank the club from your hands, but your forearms feel relaxed.
5. Hit 10 balls at this pressure, then rate your contact on a 1–5 scale.

### Checkpoint: The Waggle Test

Before each shot, waggle the club. If the clubhead feels heavy and free at the end of the shaft, your pressure is in the zone. If the waggle feels stiff or mechanical, you're squeezing too hard.

### Common Mistakes
- **Death grip on the course**: Pressure creeps up on the first tee and during approach shots. Build a pre-shot trigger — two waggles and a deep breath — to reset.
- **Uneven pressure**: The lead hand controls the club; the trail hand is along for the ride. If your trail hand is overpowering, try the split-hand drill (hands 2 inches apart) to feel the roles.

### Key Takeaway
Lighter grip pressure produces faster clubhead speed, better face control, and more consistent contact. Practice the Pressure Scale Drill until a 4 feels automatic.`,
    tags: ["grip", "fundamentals", "drill", "consistency"],
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "fix-your-slice-for-good",
    title: "Fix Your Slice for Good: A 3-Step Path-and-Face Correction",
    subtitle:
      "Understanding the club path and face relationship that causes your banana ball — and three progressive drills to straighten it out",
    category: "swing-lab",
    subcategory: "common-fixes",
    difficulty: "intermediate",
    estimatedTime: "12 min read",
    content: `## What Actually Causes a Slice

A slice happens when the clubface is **open relative to the swing path** at impact. Most slicers swing on an out-to-in path with the face pointed right of that path — producing left-to-right spin.

The fix requires two changes: **neutralize the path** and **square the face**.

### Step 1: The Headcover Gate Drill

Place a headcover 6 inches outside and behind the ball. If your downswing is out-to-in, you'll hit the headcover. This drill forces an inside approach.

- Start with half swings.
- Graduate to full swings only when you can miss the headcover 8 out of 10 times.

### Step 2: The Glove-Under-Arm Drill

Tuck a glove under your lead armpit. Make swings keeping the glove in place through impact. This promotes connection between your arms and body, preventing the "casting" motion that throws the club outside.

### Step 3: Strengthen Your Grip

Rotate both hands clockwise on the grip (for right-handed golfers) until you see 2.5 to 3 knuckles on your lead hand at address. A stronger grip makes it easier to square — or even close — the face through impact.

### The 2-Week Protocol
- **Week 1**: 50 balls/day with the Gate Drill, half speed. Focus on path only.
- **Week 2**: Full speed with strengthened grip. Monitor ball flight — you should see a straight ball or gentle draw.

### When to Seek Help
If your slice persists after two weeks, a launch monitor lesson can pinpoint whether the issue is path, face, or a combination. Strokes Gained data shows that eliminating a slice can save 3–5 strokes per round for a 20-handicapper.`,
    tags: ["slice", "fix", "drill", "ball-flight", "path"],
    featured: false,
    sortOrder: 2,
  },
  {
    slug: "driver-launch-angle-optimization",
    title: "Optimize Your Driver Launch: Tee Height, Ball Position, and Attack Angle",
    subtitle:
      "Three setup adjustments that can add 15–20 yards to your drives without changing your swing",
    category: "swing-lab",
    subcategory: "by-club",
    difficulty: "intermediate",
    estimatedTime: "10 min read",
    content: `## The Launch Angle Equation

Distance with the driver comes from the combination of **ball speed**, **launch angle**, and **spin rate**. Most amateurs launch too low with too much spin because of setup issues — not swing flaws.

### Optimal Numbers by Swing Speed

| Swing Speed | Ideal Launch | Ideal Spin |
|-------------|-------------|------------|
| 85 mph      | 14–16°      | 2,600–2,800 rpm |
| 95 mph      | 12–14°      | 2,200–2,600 rpm |
| 105 mph     | 10–12°      | 2,000–2,400 rpm |

### Adjustment 1: Tee Height

Half the ball should sit above the crown of the driver at address. Most amateurs tee it too low, which promotes a descending blow and excess spin.

**Test**: Insert a tee at your normal height. Address the ball. Is the equator of the ball at the top edge of the face? If not, tee it higher.

### Adjustment 2: Ball Position

Position the ball off your lead heel — not the center of your stance. This ensures you contact the ball on the **upswing**, which reduces spin and increases launch.

### Adjustment 3: Spine Tilt

At address, your trail shoulder should be lower than your lead shoulder, creating a slight tilt away from the target. This sets up an ascending blow. Feel like you're looking at the back of the ball.

### The Dryer Sheet Test

Place a dryer sheet on the face of your driver with a small piece of tape. Hit a ball. The mark on the dryer sheet tells you where you're making contact. Aim for slightly above center — that's the hot zone for maximum carry.

### Key Takeaway
Setup changes are the fastest path to more distance. Tee it higher, move it forward, tilt your spine — then let your existing swing do the work.`,
    tags: ["driver", "distance", "launch-angle", "setup", "tee-height"],
    featured: true,
    sortOrder: 3,
  },
  {
    slug: "wedge-distance-control-ladder",
    title: "The Wedge Distance Ladder: Own Your Scoring Clubs",
    subtitle:
      "A systematic approach to dialing in precise wedge distances from 40 to 120 yards",
    category: "swing-lab",
    subcategory: "drills-library",
    difficulty: "advanced",
    estimatedTime: "15 min drill",
    content: `## Why Wedge Precision Wins Rounds

Strokes Gained research shows that **approach shots from 50–125 yards** are where the biggest scoring differences exist between scratch golfers and 15-handicappers. The key isn't a perfect swing — it's **knowing your exact distances**.

### Building Your Distance Ladder

You need three swings with each wedge:

1. **Half swing** (hands to hip height)
2. **Three-quarter swing** (hands to chest height)
3. **Full swing** (complete backswing)

### The Ladder Protocol

For each wedge in your bag (PW, GW, SW, LW):

1. Hit 10 balls with your half swing. Discard the longest and shortest. Average the remaining 8. That's your **half-swing number**.
2. Repeat for three-quarter and full swings.
3. Record all distances.

### Example Distance Chart

| Wedge | Half | ¾ | Full |
|-------|------|---|------|
| PW (46°) | 85 | 105 | 125 |
| GW (50°) | 75 | 95 | 110 |
| SW (54°) | 60 | 80 | 95 |
| LW (58°) | 45 | 65 | 80 |

### On-Course Application

When you have 88 yards to the pin, don't try to manufacture a custom swing. Look at your chart: that's a three-quarter gap wedge. Commit to the swing length, pick your target, and execute.

### Maintenance Practice

Revisit your ladder every 2–3 weeks. Distances shift with temperature, altitude, fatigue, and equipment wear. Spend 15 minutes re-calibrating — it's the highest-ROI practice you can do.

### Pro Tip: The Clock System
Think of your backswing as a clock. 9 o'clock = half swing. 10:30 = three-quarter. 12 o'clock = full. This mental image makes it easier to replicate swing lengths under pressure.`,
    tags: ["wedges", "scoring", "distance-control", "drill", "practice"],
    featured: false,
    sortOrder: 4,
  },
  {
    slug: "golf-mobility-morning-routine",
    title: "The 10-Minute Golf Mobility Routine You Should Do Every Morning",
    subtitle:
      "Six targeted stretches that unlock hip rotation, thoracic spine mobility, and shoulder turn for a more powerful swing",
    category: "fitness",
    subcategory: "flexibility",
    difficulty: "beginner",
    estimatedTime: "10 min routine",
    content: `## Why Mobility Beats Flexibility for Golf

Flexibility is passive range of motion. **Mobility** is usable range of motion under control. Golf demands mobility — you need to rotate, load, and fire through a dynamic range.

### The 6-Move Morning Flow

Perform each movement for 60 seconds (30 seconds per side where applicable).

#### 1. Open Book Thoracic Rotation
Lie on your side with knees stacked and bent 90°. Extend your top arm and rotate your upper body open, following your hand with your eyes. This opens the thoracic spine — the engine of your backswing.

#### 2. 90/90 Hip Switches
Sit with both legs at 90° angles. Rock from one hip to the other, keeping your chest tall. This mobilizes internal and external hip rotation — essential for clearing the hips in the downswing.

#### 3. World's Greatest Stretch
Lunge forward, plant your inside hand, rotate your chest and extend your outside arm to the sky. This stretch hits hip flexors, thoracic spine, and hamstrings simultaneously.

#### 4. Cat-Cow with Rotation
From all fours, flow through cat-cow, then add rotation by threading one arm under your body and reaching to the sky. Wakes up the entire spine.

#### 5. Standing Hip Circles
Stand on one leg and make large circles with the opposite knee. 15 circles each direction. Activates the glutes and primes hip socket mobility.

#### 6. Shoulder Pass-Throughs
Hold a resistance band or towel wide. Pass it over your head and behind your body in an arc. Progressively narrow your grip over the set.

### When to Do This
- **Every morning**: 10 minutes after waking, before coffee
- **Pre-round**: Run through it at the course before hitting balls
- **Rest days**: Double the time for a recovery session

### Key Takeaway
Consistent daily mobility work adds yards and prevents injury. Most golfers lose 5–10 yards per decade simply from reduced range of motion. This routine fights that decline.`,
    tags: ["mobility", "stretching", "morning-routine", "flexibility", "warm-up"],
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "rotational-power-training",
    title: "Build Rotational Power: 5 Exercises That Add Clubhead Speed",
    subtitle:
      "Golf-specific strength training targeting the core, hips, and thoracic spine for explosive rotation",
    category: "fitness",
    subcategory: "strength",
    difficulty: "intermediate",
    estimatedTime: "25 min workout",
    content: `## The Rotational Power Equation

Clubhead speed comes from **ground reaction forces** transferring through the kinetic chain: feet → legs → hips → core → shoulders → arms → club. Strengthening the rotational links in this chain directly translates to speed.

### The 5 Exercises

#### 1. Medicine Ball Rotational Throw (3 × 8 each side)
Stand perpendicular to a wall, 4 feet away. Hold a 6–10 lb med ball at hip height. Rotate away from the wall, then explosively rotate and throw the ball into the wall. This trains the same explosive hip-to-core transfer as the downswing.

#### 2. Cable Woodchop — Low to High (3 × 10 each side)
Set a cable machine low. Pull from low to high across your body with extended arms, rotating through your core. Control the negative. Mimics the ground-up energy transfer.

#### 3. Half-Kneeling Pallof Press (3 × 12 each side)
Kneel with the cable at chest height to your side. Press the handle straight out and hold for 2 seconds. This builds **anti-rotation** strength — the ability to resist early extension and maintain posture.

#### 4. Hip Bridge with Band (3 × 15)
Place a resistance band above your knees. Bridge up, hold for 2 seconds, squeezing the glutes. Strong glutes are the engine of hip clearance in the downswing.

#### 5. Dead Bug (3 × 8 each side)
Lie on your back, arms up, knees at 90°. Extend opposite arm and leg while pressing your lower back into the floor. This trains core stability through movement — exactly what your swing demands.

### Programming
Perform this circuit 2–3 times per week, never on consecutive days. Pair with your mobility routine for a complete golf-fitness program. Expect measurable speed gains within 6–8 weeks.

### Key Takeaway
You don't need to be a gym rat to gain speed. Five targeted exercises, consistently performed, can add 5–8 mph of clubhead speed — that's 12–20 yards with the driver.`,
    tags: ["strength", "power", "clubhead-speed", "core", "gym"],
    featured: false,
    sortOrder: 2,
  },
  {
    slug: "golfer-injury-prevention",
    title: "The Golfer's Injury Prevention Checklist",
    subtitle:
      "Protect your back, elbows, and wrists with these evidence-based warm-up and recovery strategies",
    category: "fitness",
    subcategory: "injury-prevention",
    difficulty: "beginner",
    estimatedTime: "7 min read",
    content: `## Golf Injuries Are Predictable — and Preventable

The most common golf injuries follow a clear pattern: **lower back** (28%), **elbow** (25%), **wrist** (20%), **shoulder** (16%). Nearly all are overuse injuries caused by poor warm-up habits and insufficient recovery.

### The Pre-Round Warm-Up (5 Minutes)

Most golfers arrive 10 minutes before their tee time and head straight to the first tee. This is a recipe for injury.

1. **Arm circles**: 20 forward, 20 backward. Gets blood flowing to shoulders and elbows.
2. **Trunk rotations**: Feet shoulder-width, rotate upper body side to side. 30 seconds.
3. **Hip hinges**: 10 slow deadlift motions (no weight). Wakes up the posterior chain.
4. **Progressive swings**: Start with a wedge at 40% effort. Build to a driver at 80% over 10 swings. Never start at full speed.

### The Lower Back Protocol

Your lower back absorbs enormous rotational forces. Protect it:
- **Core activation before every round**: 30-second plank + 10 dead bugs.
- **Spine angle awareness**: Practice maintaining your spine angle in front of a mirror. Early extension is the #1 cause of golf-related back pain.
- **Post-round**: 5 minutes of child's pose, knee-to-chest stretches, and cat-cow.

### Elbow and Wrist Care

Golfer's elbow (medial epicondylitis) comes from grip tension and impact shock.
- **Forearm rolling**: Use a foam roller or lacrosse ball on your forearms for 2 minutes after each round.
- **Eccentric wrist curls**: 3 × 15 with a 2–5 lb dumbbell. The single most effective exercise for treating and preventing golfer's elbow.
- **Grip check**: If you're leaving divots the size of dollar bills, your angle of attack is too steep — that shock travels straight to your elbows.

### Key Takeaway
Five minutes of warm-up and five minutes of recovery can prevent months of missed golf. Make it non-negotiable.`,
    tags: ["injury-prevention", "warm-up", "recovery", "back-pain", "elbow"],
    featured: false,
    sortOrder: 3,
  },
  {
    slug: "on-course-nutrition-guide",
    title: "On-Course Fueling: What to Eat and Drink During 18 Holes",
    subtitle:
      "A sports science approach to maintaining energy, focus, and decision-making from the first tee to the 18th green",
    category: "fitness",
    subcategory: "nutrition",
    difficulty: "beginner",
    estimatedTime: "6 min read",
    content: `## Why Nutrition Matters on the Course

A round of golf lasts 4–5 hours and requires sustained mental focus. Research from the Journal of Sports Sciences shows that **cognitive performance drops significantly** after 2.5 hours without proper fueling — right around the back nine where scores tend to balloon.

### Hydration Strategy

- **Before the round**: 16–20 oz of water in the hour before your tee time.
- **Every 3 holes**: 6–8 oz of water. Don't wait until you feel thirsty.
- **Electrolytes**: On hot days (above 80°F), add an electrolyte tablet to one bottle. Sweat loss on a walking round can exceed 2 liters.
- **Avoid**: Alcohol dehydrates and impairs coordination. Save the beer for the 19th hole.

### Fuel Timing

#### Pre-Round (1–2 hours before)
A balanced meal: complex carbs + protein + healthy fat. Example: oatmeal with banana and almond butter, or a turkey sandwich on whole grain.

#### The Turn (Holes 8–10)
This is your critical refueling window. Choose something with:
- **Quick carbs for energy**: banana, dried fruit, or a granola bar
- **Protein for sustained focus**: handful of mixed nuts, jerky, or a protein bar
- **Avoid heavy foods**: A hot dog and chips will spike your blood sugar and leave you sluggish on the back nine

#### Back Nine Maintenance (Holes 13–15)
One more small snack — another handful of nuts or a piece of fruit. This prevents the late-round energy crash that leads to poor decisions on closing holes.

### What Tour Pros Carry
Justin Thomas has talked about packing almonds, dried mango, and protein bars. Rory McIlroy sips on electrolyte drinks throughout. They know that managing energy is managing their scorecard.

### Key Takeaway
Pack your bag the night before — three water bottles, two small snacks, and one electrolyte drink. Simple preparation that can save you 2–3 strokes on the back nine.`,
    tags: ["nutrition", "hydration", "energy", "on-course", "performance"],
    featured: false,
    sortOrder: 4,
  },
  {
    slug: "pre-round-visualization-routine",
    title: "The 15-Minute Pre-Round Visualization Routine",
    subtitle:
      "How to mentally play your round before you physically play it — the same technique used by Olympic athletes and tour professionals",
    category: "mental-game",
    subcategory: "pre-round",
    difficulty: "intermediate",
    estimatedTime: "15 min routine",
    content: `## Why Visualization Works

Neuroscience research shows that the brain activates the **same neural pathways** during vivid mental rehearsal as during actual physical performance. When you visualize a smooth draw around a dogleg, your motor cortex fires in the same pattern as when you execute it.

### The Protocol

Find a quiet spot — your car, the locker room, or a bench near the practice green. Allow 15 minutes before your warm-up.

#### Phase 1: Breathing Reset (3 minutes)
Close your eyes. Inhale for 4 counts, hold for 4, exhale for 6. This activates the parasympathetic nervous system and creates the calm, focused state needed for effective visualization.

#### Phase 2: Course Walkthrough (8 minutes)
Mentally play the first 6 holes in vivid detail:
- **See** the tee box, fairway shape, hazards, and pin position.
- **Feel** your setup, grip pressure, and smooth tempo.
- **Watch** the ball flight — its shape, apex, and landing spot.
- **Hear** the solid contact.

Don't just watch — **inhabit** the shot. First person, full sensory experience.

If you don't know the course layout, visualize your ideal shot shapes: a controlled fade off the tee, a crisp iron to the center of the green, a smooth lag putt.

#### Phase 3: Anchor Shot (4 minutes)
Recall your **best shot ever** in vivid detail. The feel, the flight, the result. Let the confidence from that shot fill your body. This becomes your emotional anchor for the round.

### Course Management Integration

During visualization, make strategic decisions:
- Where will you aim on tight holes?
- Which par 5s will you go for in two?
- What's your bailout plan on dangerous pins?

Making these decisions in a calm state leads to better choices under pressure.

### Key Takeaway
Visualization isn't mystical — it's neurological pre-loading. Fifteen minutes of focused mental rehearsal can lower your scoring average by 2–3 strokes over a season.`,
    tags: ["visualization", "mental", "pre-round", "routine", "focus"],
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "course-management-smart-targets",
    title: "Smart Targeting: Think Like a Caddie, Not a Hero",
    subtitle:
      "How strategic target selection and miss-management can save you 5 strokes per round without hitting a single better shot",
    category: "mental-game",
    subcategory: "course-management",
    difficulty: "intermediate",
    estimatedTime: "9 min read",
    content: `## The Biggest Mistake in Amateur Golf

Most amateurs aim at the pin. Tour pros aim at **zones**. The difference in strategy — not skill — accounts for a massive portion of the scoring gap.

### The Miss-Management Framework

Every shot has a most likely miss direction. For most golfers:
- **Driver**: Tends to fade/slice
- **Irons**: Tend to be slightly right with a distance miss (short)
- **Wedges**: Tend to be pulled left

**Smart targeting means aiming away from trouble on the side of your likely miss.**

### Example: A Pin Tucked Behind a Left Bunker

The amateur aims at the pin and misses left into the sand. The smart play:
1. Aim at the **center of the green**.
2. If you pull it, you're pin-high with a 15-foot putt.
3. If you push it, you're right-center with a 25-foot putt.
4. Worst case: you're on the green with a two-putt bogey off the table.

### The 60% Rule

On any given shot, ask: "If I hit this 10 times, where do 6 of them end up?" That's your realistic shot pattern. Now ask: "Does my target keep 6 out of 10 attempts in a safe position?"

If the answer is no, pick a more conservative target.

### Par-3 Strategy

Amateurs treat every par 3 as a birdie opportunity. Better approach:
- **Easy pins** (center/front): Aim at the pin.
- **Tucked pins** (corners, behind bunkers): Aim center-green. A 20-foot putt is better than a sand save.
- **Long par 3s** (200+ yards): Take one more club than you think. Missing long is almost always better than short.

### The Back Nine Principle

Make your aggressive plays on holes 1–9 when you're fresh. On the back nine, shift to conservative targets. Decision fatigue is real, and bogeys from bad decisions compound on the closing stretch.

### Key Takeaway
You don't need to hit better shots — you need to pick better targets. Play for the center of greens, manage your misses, and watch your scores drop.`,
    tags: [
      "course-management",
      "strategy",
      "targeting",
      "scoring",
      "smart-play",
    ],
    featured: false,
    sortOrder: 2,
  },
  {
    slug: "handling-first-tee-nerves",
    title: "Conquering First-Tee Jitters: A Performance Psychology Approach",
    subtitle:
      "Reframe nerves as energy, build a bulletproof pre-shot routine, and make your first swing the most confident of the day",
    category: "mental-game",
    subcategory: "pressure",
    difficulty: "beginner",
    estimatedTime: "7 min read",
    content: `## Nerves Are Normal — Even at the Top

Tiger Woods has said he felt nervous on every first tee. The difference between pros and amateurs isn't the absence of nerves — it's the **response** to them.

### Reframe: Nerves = Readiness

Your body's stress response (elevated heart rate, sweaty palms, heightened focus) is physiologically identical to excitement. Research from Harvard Business School shows that simply telling yourself "I'm excited" instead of "I'm nervous" measurably improves performance.

**The switch**: When you feel butterflies on the first tee, say to yourself: "Good. I'm ready to compete."

### The Bulletproof First-Tee Routine

1. **Club selection**: Take the club you're most confident with off the tee, not necessarily the driver. If 3-wood gives you 80% fairways, hit 3-wood.
2. **Target selection**: Pick the widest part of the fairway. This is not the hole for hero shots.
3. **Practice swing**: One smooth practice swing focused on tempo, not mechanics. Match the rhythm of your best swings.
4. **Breath trigger**: One deep breath — in through the nose, out through the mouth. This is your "go" signal.
5. **Commit and fire**: No standing over the ball. Address, one look at the target, swing.

### The 3-Ball Reset

If the first tee still feels overwhelming, use this mental trick: Imagine you've already played 3 holes. Your round started on hole 4. This removes the "first shot" pressure entirely.

### Long-Term Confidence Building

- **Practice under pressure**: Play 5-dollar nassaus, join club tournaments, enter qualifiers. Exposure is the best desensitizer.
- **Process focus**: Think about your routine, not the outcome. The routine is within your control; where the ball goes is not.
- **Post-round review**: Note when nerves affected your play. Over time, you'll see the pattern shrink.

### Key Takeaway
You can't eliminate nerves, but you can channel them. A tight routine, conservative club choice, and a reframing mindset turn first-tee anxiety into first-tee energy.`,
    tags: ["nerves", "pressure", "first-tee", "psychology", "routine"],
    featured: false,
    sortOrder: 3,
  },
  {
    slug: "deliberate-practice-plan",
    title: "Practice with Purpose: Building a Structured Practice Plan",
    subtitle:
      "Stop beating balls and start improving — a framework for deliberate practice that mirrors how elite performers train",
    category: "mental-game",
    subcategory: "practice-with-purpose",
    difficulty: "advanced",
    estimatedTime: "10 min read",
    content: `## The Problem with Range Sessions

The average golfer's practice session: buy a large bucket, hit drivers until the arms are tired, chip a few, skip putting, go home. This isn't practice — it's exercise with a golf club.

**Deliberate practice** is different. It's focused, goal-directed, and includes feedback loops.

### The 60-Minute Structured Session

#### Block 1: Short Game (25 minutes)
Start with scoring shots — they have the highest ROI.

- **Putting (10 min)**: 5 minutes of lag putts (30+ feet) for distance control. 5 minutes of 3-footers — make 20 in a row before moving on.
- **Chipping (8 min)**: Pick one technique (bump-and-run or flop). Hit to 3 different targets. Track how many finish within a 6-foot circle.
- **Bunker (7 min)**: Focus on consistent splash. Draw a line in the sand 2 inches behind the ball and hit the line.

#### Block 2: Approach Shots (15 minutes)
This is where Strokes Gained lives.

- Hit to specific yardages using your wedge distance ladder.
- Alternate between PW, GW, and SW to simulate course conditions.
- After each shot, assess: "Was that my intended distance and direction?" Feedback is the key.

#### Block 3: Full Swing (15 minutes)
- Start with your most reliable club (probably 7-iron). Hit 5 balls with a single swing thought.
- Move to driver for the last 10 balls. Simulate tee shots: pick a target, go through your full pre-shot routine, hit one ball, step away.

#### Block 4: Pressure Simulation (5 minutes)
Play "Par 18": 9 chips and 9 putts. Try to get up and down in 2 or fewer on each. Keep score. This adds consequence to your practice.

### Tracking Progress

Keep a simple notebook:
- Date, duration, focus area
- One thing that improved
- One thing to work on next session

### Key Takeaway
Quality trumps quantity. A focused 60-minute session with structure and feedback produces more improvement than 3 hours of mindless ball-beating.`,
    tags: ["practice", "deliberate-practice", "structure", "improvement", "drill"],
    featured: false,
    sortOrder: 4,
  },
  {
    slug: "when-to-get-fitted",
    title: "When and Why to Get Club Fitted: The Data-Driven Case",
    subtitle:
      "What a professional fitting actually involves, when it makes sense, and the measurable impact on your game",
    category: "equipment-intel",
    subcategory: "fitting-guide",
    difficulty: "beginner",
    estimatedTime: "8 min read",
    content: `## The Fitting Misconception

Most golfers believe fitting is only for low handicappers. The data says the opposite: **higher handicappers benefit more from fitting** because their current equipment is more likely to be wrong for their swing.

A 2023 study by True Spec Golf found that golfers who went through a comprehensive fitting saw an average improvement of **6.2 strokes over 10 rounds** — with the biggest gains coming from players with handicaps above 15.

### What Happens in a Fitting

A professional fitting typically lasts 60–90 minutes and covers:

1. **Interview**: Your fitter asks about your game, goals, typical misses, and physical limitations.
2. **Static measurements**: Height, wrist-to-floor distance, hand size — these determine starting specs for length, lie angle, and grip size.
3. **Dynamic testing**: You hit balls on a launch monitor while the fitter adjusts shaft flex, weight, length, loft, and lie angle. They're watching ball speed, launch angle, spin rate, and dispersion.
4. **Comparison**: You hit your current clubs for a baseline, then test optimized configurations. The data speaks for itself.

### When to Get Fitted

- **Before buying new clubs**: Always. Off-the-rack specs are designed for a 5'10", 160 lb golfer with a 95 mph swing speed. If that's not you, the clubs won't perform.
- **Every 3–5 years**: Your body changes, your swing evolves, and club technology advances.
- **After a major swing change**: If you've worked with an instructor and fundamentally changed your swing mechanics, your old specs may not match your new motion.

### What NOT to Expect

Fitting fixes equipment problems, not swing problems. If you have a major swing fault (severe over-the-top move, significant early extension), address that first with a qualified instructor. Fitting a flawed swing just optimizes a bad outcome.

### Cost and Value

Expect to pay $100–$300 for a comprehensive fitting (often credited toward purchase). Consider it the best per-dollar investment in your game.

### Key Takeaway
Custom fitting isn't a luxury — it's equipment optimization backed by data. The higher your handicap, the more you stand to gain.`,
    tags: ["fitting", "equipment", "custom-clubs", "data", "improvement"],
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "shaft-flex-explained",
    title: "Shaft Flex Demystified: What the Labels Actually Mean",
    subtitle:
      "Understanding how shaft flex affects ball flight, and why the letter on your shaft might be lying to you",
    category: "equipment-intel",
    subcategory: "technology-explained",
    difficulty: "intermediate",
    estimatedTime: "9 min read",
    content: `## The Dirty Secret of Shaft Flex

There is **no industry standard** for shaft flex. One manufacturer's "Regular" might be stiffer than another's "Stiff." The letters (L, A, R, S, X) are marketing guidelines, not engineering specifications.

### What Actually Matters

Two properties define how a shaft performs:

#### 1. Frequency (CPM)
Shaft stiffness is measured in cycles per minute (CPM) — how fast the shaft oscillates when clamped and released. Higher CPM = stiffer shaft. This is the objective measurement that flex labels attempt to describe.

| Label | Typical CPM Range (Driver) |
|-------|---------------------------|
| Senior (A) | 220–235 |
| Regular (R) | 240–255 |
| Stiff (S) | 255–270 |
| Extra Stiff (X) | 270–290 |

#### 2. Bend Profile (EI)
Where the shaft flexes matters as much as how much it flexes. A "tip-stiff" shaft resists bending near the clubhead — this lowers launch and spin. A "tip-soft" shaft flexes more at the tip — higher launch and spin.

### Matching Flex to Your Swing

The primary factor is **swing speed**, but transition tempo matters too:

- **Smooth tempo + 90 mph driver speed**: Regular flex is likely right.
- **Aggressive tempo + 90 mph**: You might need Stiff despite the "slower" speed.
- **Smooth tempo + 105 mph**: Stiff flex, potentially with a softer tip for higher launch.

### The "Flex is Too Stiff" Symptoms
- Ball flight is low and left (for right-handers)
- Shots feel dead or boardy at impact
- You're losing distance compared to playing partners with similar speeds

### The "Flex is Too Soft" Symptoms
- Ball flight is high with excessive spin
- Dispersion is wide — shots spray left and right
- The club feels whippy or out of control

### Key Takeaway
Don't trust the letter — trust the data. A launch monitor fitting is the only way to know if your shaft flex (really, its CPM and bend profile) matches your swing. The right shaft can be worth 10–15 yards and significantly tighter dispersion.`,
    tags: ["shaft", "flex", "technology", "equipment", "fitting"],
    featured: false,
    sortOrder: 2,
  },
  {
    slug: "golf-equipment-trends-2026",
    title: "Golf Equipment Trends in 2026: What's Changing and Why",
    subtitle:
      "AI-designed clubfaces, adjustable weighting systems, and the sustainability push reshaping the golf equipment industry",
    category: "equipment-intel",
    subcategory: "gear-trends",
    difficulty: "beginner",
    estimatedTime: "7 min read",
    content: `## The Three Forces Shaping Golf Equipment

### 1. AI and Computational Design

The biggest shift in club design is the move from human-designed clubfaces to **AI-optimized geometry**. Companies like Callaway (with their AI-designed Flash Face) and TaylorMade (with their Carbon Twist Face) use machine learning to test thousands of face thickness variations, optimizing for ball speed across the entire face — not just the sweet spot.

**What this means for you**: Mishits are more forgiving than ever. The performance gap between center strikes and off-center hits continues to shrink, especially in drivers and fairway woods.

### 2. Adjustable and Modular Systems

The trend toward adjustability has expanded beyond hosel settings:
- **Movable weights** in drivers allow you to bias for draw or fade
- **Adjustable sole plates** in irons let fitters change lie angle and bounce without bending
- **Interchangeable shaft systems** mean you can test multiple shafts in the same head

This modularity means a single club can be dialed in more precisely than ever — reducing the need to buy entirely new sets for minor fitting changes.

### 3. Sustainability

The golf industry is responding to environmental pressure:
- **Recycled titanium and carbon fiber** in driver construction
- **Bio-based urethane** in premium golf balls
- **Reduced packaging** and direct-to-consumer models cutting waste
- **Trade-in programs** giving old clubs second lives

### What to Watch

- **3D-printed putters**: Companies are using metal 3D printing (DMLS) to create putter designs impossible with traditional casting — complex internal weighting for better feel and stability.
- **Smart grips**: Sensors embedded in grips that track swing metrics without external devices. Arccos and their Caddie Smart Sensors were early pioneers; expect this to become standard.
- **Ball-fitting**: The next frontier. Matching golf ball construction (compression, spin layers, cover material) to individual swing characteristics, not just brand preference.

### Key Takeaway
Equipment technology is advancing faster than ever, but the fundamentals remain: get fitted, match your equipment to your swing, and don't chase marketing hype over measurable performance gains.`,
    tags: ["trends", "technology", "equipment", "innovation", "2026"],
    featured: false,
    sortOrder: 3,
  },
  {
    slug: "key-golf-stats-to-track",
    title: "The 7 Stats Every Golfer Should Track",
    subtitle:
      "Stop obsessing over score alone — these seven metrics tell you exactly where your strokes are hiding",
    category: "stats-center",
    subcategory: "know-your-numbers",
    difficulty: "beginner",
    estimatedTime: "8 min read",
    content: `## Why Stats Matter

Your score tells you *what* happened. Stats tell you *why*. Without tracking the right numbers, your practice is guesswork.

### The Essential 7

#### 1. Fairways in Regulation (FIR)
**What it measures**: Percentage of tee shots that land in the fairway on par 4s and par 5s.
**Tour average**: 62%. **Your target**: Track your current number, then aim to improve by 5% per season.
**Why it matters**: Hitting from the fairway vs. rough makes a 0.4 stroke difference per hole on average.

#### 2. Greens in Regulation (GIR)
**What it measures**: Percentage of holes where the ball is on the green in the expected number of strokes (par minus 2).
**Tour average**: 66%. **Scratch golfer**: ~50%. **15-handicapper**: ~25%.
**Why it matters**: GIR is the single strongest correlator with scoring average. Improving GIR by 10% typically lowers scores by 4–5 strokes.

#### 3. Putts Per Round
**What it measures**: Total putts in 18 holes.
**Tour average**: 29. **Your target**: Under 32 is good; under 30 is excellent for amateurs.
**Nuance**: This stat alone is misleading — more GIR = more putts (because you're putting from farther away). Track putts per GIR separately.

#### 4. Putts Per GIR
**What it measures**: Average putts when you hit the green in regulation.
**Tour average**: 1.75. **Your target**: Under 2.0 means you're rarely three-putting.
**Why it matters**: This isolates putting skill from approach play.

#### 5. Scrambling Percentage
**What it measures**: Percentage of times you make par or better after missing the green in regulation.
**Tour average**: 58%. **Good amateur**: 25–35%.
**Why it matters**: Short game rescue ability is the difference between a 80-shooter and a 90-shooter.

#### 6. Sand Save Percentage
**What it measures**: Getting up-and-down from greenside bunkers.
**Tour average**: 50%. **Amateur average**: 15–20%.
**Why it matters**: If your sand save rate is below 20%, focused bunker practice will yield the fastest scoring improvement.

#### 7. Penalties Per Round
**What it measures**: Total penalty strokes (OB, water, lost ball, unplayable).
**Your target**: Under 1 per round. Each penalty is a full stroke plus positional damage.
**Why it matters**: Penalty avoidance is pure course management — no swing change required.

### How to Track

Use a simple scorecard app (GHIN, 18Birdies, Arccos) or a notebook. After each round, log these 7 numbers. After 5 rounds, patterns emerge that tell you exactly where to focus your practice.

### Key Takeaway
You can't improve what you don't measure. These seven stats give you a complete diagnostic of your game — and a clear roadmap for improvement.`,
    tags: ["stats", "tracking", "scoring", "improvement", "data"],
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "strokes-gained-explained",
    title: "Strokes Gained Explained: The Stat That Changed Golf",
    subtitle:
      "How Mark Broadie's revolutionary metric reveals where you actually gain and lose strokes — and why traditional stats lie",
    category: "stats-center",
    subcategory: "strokes-gained",
    difficulty: "intermediate",
    estimatedTime: "11 min read",
    content: `## The Problem with Traditional Stats

Consider two golfers who both hit 10 greens in regulation. Golfer A hit them from 140 yards on average. Golfer B hit them from 190 yards on average. Who had the better ball-striking day? Traditional stats say they're equal. **Strokes Gained says Golfer B was significantly better.**

### What Is Strokes Gained?

Developed by Columbia professor **Mark Broadie**, Strokes Gained compares every shot you hit to the average performance of a baseline golfer from the same position.

**The formula**: Strokes Gained = (Expected strokes from starting position) – (Expected strokes from ending position) – 1

If you're 150 yards out (expected: 2.8 strokes to hole out) and you hit it to 10 feet (expected: 1.6 strokes), you gained: 2.8 – 1.6 – 1 = **0.2 strokes** on that shot.

### The Four Categories

#### Strokes Gained: Off the Tee (SG:OTT)
Measures driving performance — distance AND accuracy combined. A 300-yard drive into the rough might gain fewer strokes than a 260-yard drive in the fairway.

#### Strokes Gained: Approach (SG:APP)
Measures approach shots (typically 100+ yards into greens). This is where **the largest scoring differences** exist between handicap levels. A scratch golfer gains roughly 4 strokes per round on approaches compared to a 15-handicapper.

#### Strokes Gained: Around the Green (SG:ARG)
Measures chipping, pitching, and bunker shots. Includes everything from within 50 yards that's not on the green.

#### Strokes Gained: Putting (SG:PUTT)
Measures putting performance. Surprisingly, this category shows the **smallest** differences between skill levels. The gap between a tour pro and a 15-handicapper is about 1 stroke per round in putting — compared to 4+ strokes in approach play.

### Why This Changes Your Practice

If putting has the smallest gap, **why do most amateurs spend the most time practicing putting?** Strokes Gained data suggests you should prioritize:
1. Approach shots (biggest gap)
2. Tee shots (second biggest gap)
3. Short game (third)
4. Putting (smallest gap, still important)

### How to Track Your Strokes Gained

Apps like **Arccos**, **Shot Scope**, and **Garmin Golf** calculate Strokes Gained automatically using GPS and shot tracking. If you don't want technology, even a rough manual calculation gives useful data.

### Key Takeaway
Strokes Gained reveals the truth about your game. Traditional stats flatter your putting and hide your approach play weaknesses. Follow the data, and practice where the strokes actually live.`,
    tags: ["strokes-gained", "stats", "analysis", "data", "broadie"],
    featured: false,
    sortOrder: 2,
  },
  {
    slug: "handicap-index-intelligence",
    title: "Handicap Intelligence: How the System Works and How to Lower Yours",
    subtitle:
      "Understanding the World Handicap System calculation, what your differentials reveal, and strategic approaches to improvement",
    category: "stats-center",
    subcategory: "handicap",
    difficulty: "intermediate",
    estimatedTime: "9 min read",
    content: `## How Your Handicap Is Calculated

The **World Handicap System (WHS)**, adopted globally in 2020, uses your best 8 out of your last 20 score differentials.

**Score Differential** = (113 / Slope Rating) × (Adjusted Gross Score – Course Rating)

Your Handicap Index is the average of your best 8 differentials, multiplied by 0.96 (a "bonus for excellence" factor).

### What Your Differentials Tell You

- **Tight cluster** (e.g., differentials range from 14.2 to 16.8): Your game is consistent. Focus on skill development to shift the entire cluster downward.
- **Wide spread** (e.g., 10.5 to 22.3): Inconsistency is your issue. Focus on eliminating blow-up holes through course management and penalty avoidance.

### The 5 Fastest Paths to a Lower Handicap

#### 1. Eliminate Double Bogeys
Every double bogey you convert to a bogey saves one stroke. Most 15-handicappers make 4–6 doubles per round. Converting half of them to bogeys drops your handicap by 1.5–2 strokes.

**Strategy**: When in trouble, always play out to a safe position. Take your medicine. A bogey from a recovery shot is a win.

#### 2. Improve Your 100–150 Yard Game
This is Strokes Gained approach territory. If you can hit 60% of greens from this range instead of 40%, you'll knock 3+ strokes off your average.

#### 3. Get Up and Down 30% of the Time
If you currently scramble at 15%, doubling that to 30% (still well below tour average) saves about 2 strokes per round.

#### 4. Two-Putt from 30+ Feet
Three-putts are score killers. Practice lag putting until your first putt from 30+ feet consistently finishes within 3 feet of the hole. This alone can eliminate 2–3 three-putts per round.

#### 5. Play the Right Tees
The WHS adjusts for course difficulty, but playing from tees that are too long for your game inflates scores. Play from the tees where your average drive leaves a mid-iron into the green. There's no ego in the handicap system.

### The Vanity Trap

Don't post only your good rounds. The WHS uses your best 8 of 20 — it's designed to represent your potential, not your average. Posting all rounds gives the system accurate data to calculate a fair index. Selective posting leads to a handicap that doesn't reflect your ability in competition.

### Key Takeaway
Your handicap is a diagnostic tool, not a label. Understand the math, post every round, and focus improvement efforts on the highest-impact areas revealed by your differential pattern.`,
    tags: ["handicap", "WHS", "scoring", "improvement", "strategy"],
    featured: false,
    sortOrder: 3,
  },
  {
    slug: "practice-metrics-guide",
    title: "Measuring What Matters: Metrics for Your Practice Sessions",
    subtitle:
      "Track these numbers during practice to connect range performance to on-course improvement",
    category: "stats-center",
    subcategory: "practice-metrics",
    difficulty: "advanced",
    estimatedTime: "8 min read",
    content: `## The Practice-Course Gap

Most golfers hit great shots on the range and terrible shots on the course. Part of the reason: they don't **measure** their practice in ways that correlate with scoring.

### Putting Metrics to Track

#### Make Rate by Distance
- Track your make percentage from 3, 5, 8, 10, and 15 feet.
- **Benchmark**: Tour pros make 50% from 8 feet. If you can make 50% from 5 feet, you're ahead of most amateurs.

#### 3-Putt Rate (Lag Drill)
Drop 10 balls at 30+ feet. How many finish within 3 feet? Target: **8 out of 10**. If you're below 6, this is your fastest path to saving strokes on the green.

### Short Game Metrics

#### Up-and-Down Conversion
Pick 10 different spots around the practice green. Chip and putt. Track up-and-down percentage. **Target**: 40% from straightforward lies.

#### Dispersion Circle
From 30 yards, hit 10 balls to a target. Measure the circle that contains 80% of your shots. Tour pros: 10-foot circle. Your goal: shrink your circle by 20% over a month.

### Full Swing Metrics

#### Carry Distance Consistency
If you have access to a launch monitor, the number that matters most isn't average distance — it's **standard deviation**. A 150-yard average with 5-yard standard deviation is far more useful than 155 yards with 15-yard deviation.

#### Directional Dispersion
Hit 20 balls with your 7-iron. How many finish within 15 feet of your target line? This is a better predictor of GIR than any other metric.

### Session Scoring

Create a simple scoring system for each practice session:
- **Putting game**: 10 putts from 6 feet. Score = number made. Track weekly.
- **Chipping game**: 10 chips from 3 spots. Score = number within 6 feet. Track weekly.
- **Iron game**: 10 approach shots to a specific target. Score = number within 30 feet. Track weekly.

Plotting these scores over time shows whether your practice is producing improvement — or just burning through range balls.

### Key Takeaway
What gets measured gets improved. Assign numbers to your practice sessions, track them over time, and watch the connection between deliberate practice and lower scores become undeniable.`,
    tags: ["practice", "metrics", "tracking", "improvement", "data"],
    featured: false,
    sortOrder: 4,
  },
];

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS performance_articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20),
  estimated_time VARCHAR(30),
  hero_image VARCHAR(500),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  video_url VARCHAR(500),
  published_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS performance_articles_category_idx ON performance_articles(category);
CREATE INDEX IF NOT EXISTS performance_articles_category_subcategory_idx ON performance_articles(category, subcategory);
CREATE INDEX IF NOT EXISTS performance_articles_featured_idx ON performance_articles(featured);
CREATE INDEX IF NOT EXISTS performance_articles_slug_idx ON performance_articles(slug);
`;

export async function GET() {
  try {
    // Check if table already exists and has rows
    const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count FROM performance_articles`
    );
    if (rows.length > 0 && Number(rows[0].count) > 0) {
      return NextResponse.json({
        success: true,
        message: "Already migrated",
        rowCount: Number(rows[0].count),
      });
    }
  } catch {
    // Table doesn't exist yet — proceed with migration
  }

  // Run the migration (same logic as POST but without auth)
  const results: string[] = [];

  try {
    const statements = CREATE_TABLE_SQL.split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${sql.substring(0, 60)}...`);
    }

    let insertedCount = 0;
    const now = new Date().toISOString();

    for (const article of articles) {
      const id = generateId();
      const tagsArray = `{${article.tags.map((t) => `"${t}"`).join(",")}}`;

      const sql = `
        INSERT INTO performance_articles (id, slug, title, subtitle, category, subcategory, difficulty, estimated_time, hero_image, content, tags, video_url, published_at, updated_at, featured, sort_order)
        VALUES (${esc(id)}, ${esc(article.slug)}, ${esc(article.title)}, ${esc(article.subtitle)}, ${esc(article.category)}, ${esc(article.subcategory)}, ${esc(article.difficulty)}, ${esc(article.estimatedTime)}, NULL, ${esc(article.content)}, '${tagsArray}', NULL, '${now}', '${now}', ${article.featured}, ${article.sortOrder})
        ON CONFLICT (slug) DO NOTHING
      `;

      const affected = await prisma.$executeRawUnsafe(sql);
      if (affected > 0) {
        insertedCount++;
        results.push(`Inserted: ${article.slug}`);
      } else {
        results.push(`Skipped (exists): ${article.slug}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalArticles: articles.length,
      insertedCount,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, results },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const key =
    req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key");
  if (key !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // Create table and indexes
    const statements = CREATE_TABLE_SQL.split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${sql.substring(0, 60)}...`);
    }

    // Insert articles
    let insertedCount = 0;
    const now = new Date().toISOString();

    for (const article of articles) {
      const id = generateId();
      const tagsArray = `{${article.tags.map((t) => `"${t}"`).join(",")}}`;

      const sql = `
        INSERT INTO performance_articles (id, slug, title, subtitle, category, subcategory, difficulty, estimated_time, hero_image, content, tags, video_url, published_at, updated_at, featured, sort_order)
        VALUES (${esc(id)}, ${esc(article.slug)}, ${esc(article.title)}, ${esc(article.subtitle)}, ${esc(article.category)}, ${esc(article.subcategory)}, ${esc(article.difficulty)}, ${esc(article.estimatedTime)}, NULL, ${esc(article.content)}, '${tagsArray}', NULL, '${now}', '${now}', ${article.featured}, ${article.sortOrder})
        ON CONFLICT (slug) DO NOTHING
      `;

      const affected = await prisma.$executeRawUnsafe(sql);
      if (affected > 0) {
        insertedCount++;
        results.push(`Inserted: ${article.slug}`);
      } else {
        results.push(`Skipped (exists): ${article.slug}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalArticles: articles.length,
      insertedCount,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, results },
      { status: 500 }
    );
  }
}
