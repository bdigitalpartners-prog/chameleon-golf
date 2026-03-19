import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ContentSeed {
  title: string;
  url: string;
  sourceName: string;
  contentType: string;
  summary?: string;
  isFeatured: boolean;
  duration?: string;
  thumbnailUrl?: string;
  architects: string[];
  publishedAt?: string;
}

const CONTENT_ITEMS: ContentSeed[] = [
  {
    title: "The Essential Guide to Bandon Dunes",
    url: "https://golfclubatlas.com/in-my-opinion/the-essential-guide-to-bandon-dunes/",
    sourceName: "Golf Club Atlas",
    contentType: "article",
    summary: "Golf Club Atlas's comprehensive guide to all five Bandon Dunes courses (Bandon Dunes, Pacific Dunes, Bandon Trails, Old Macdonald, Sheep Ranch), ranking each in categories like best par-3s, best routing, best greens, hardest hole, and best overall \u2014 concluding Pacific Dunes edges Bandon Trails as the best course on property.",
    isFeatured: true,
    architects: ["David McLay Kidd", "Tom Doak", "Bill Coore", "Ben Crenshaw"],
  },
  {
    title: "The Essential Guide to Streamsong Resort",
    url: "https://golfclubatlas.com/in-my-opinion/the-essential-guide-to-streamsong-resort/",
    sourceName: "Golf Club Atlas",
    contentType: "article",
    summary: "Comprehensive evaluation of Streamsong Resort's three courses (Blue by Tom Doak, Red by Coore-Crenshaw, Black by Gil Hanse) across all major categories, noting Streamsong as the only resort where you can see all three architects' work in one visit.",
    isFeatured: true,
    architects: ["Tom Doak", "Bill Coore", "Ben Crenshaw", "Gil Hanse"],
  },
  {
    title: "The Pebble Beach Problem",
    url: "https://golfclubatlas.com/in-my-opinion/the-pebble-beach-problem/",
    sourceName: "Golf Club Atlas",
    contentType: "article",
    summary: "Golf Club Atlas examines the architectural issues at Pebble Beach \u2014 poorly added bunkers, shrinking green sizes, and thick rough replacing the original open sand surrounds \u2014 arguing the world's most famous coastal course falls short of its architectural potential.",
    isFeatured: true,
    architects: ["Jack Neville", "Douglas Grant", "H. Chandler Egan", "Alister MacKenzie", "Jack Nicklaus"],
  },
  {
    title: "The Architecture Timeline",
    url: "https://golfclubatlas.com/architecture-timeline/the-architecture-timeline/",
    sourceName: "Golf Club Atlas",
    contentType: "article",
    summary: "Golf Club Atlas's comprehensive index of course profiles organized by architectural era and architect \u2014 from Old Tom Morris through the modern minimalists. Profiles lesser-known but architecturally significant venues across every major design period.",
    isFeatured: true,
    architects: ["Old Tom Morris", "Alister MacKenzie", "Donald Ross", "C.B. Macdonald", "Seth Raynor", "Tom Doak"],
  },
  {
    title: "Every Hole at Royal Portrush Golf Club \u2013 2025 Open Championship | Golf Digest (YouTube)",
    url: "https://www.youtube.com/watch?v=191-RDPj8kA",
    sourceName: "Golf Digest",
    contentType: "video",
    summary: "Hole-by-hole aerial flyover of Royal Portrush (Dunluce Course) narrated for the 2025 Open Championship. Covers Harry Colt's 1932 design, the 2019 McKenzie & Ebert remodel that added two new holes, and the course's strategic dunescaping.",
    isFeatured: true,
    duration: "~20 min",
    thumbnailUrl: "https://img.youtube.com/vi/191-RDPj8kA/hqdefault.jpg",
    architects: ["Harry Colt", "McKenzie & Ebert"],
  },
  {
    title: "Every Hole at Point Hardy Golf Club at Cabot Saint Lucia | Golf Digest (YouTube)",
    url: "https://www.youtube.com/watch?v=XKdp4WoqUoU",
    sourceName: "Golf Digest",
    contentType: "video",
    summary: "Bill Coore himself narrates this spectacular aerial flyover of his and Ben Crenshaw's Point Hardy Golf Club at Cabot Saint Lucia, describing each hole's design decisions on the dramatic cliff-hanging oceanside property.",
    isFeatured: true,
    duration: "16 min",
    thumbnailUrl: "https://img.youtube.com/vi/XKdp4WoqUoU/hqdefault.jpg",
    architects: ["Bill Coore", "Ben Crenshaw"],
  },
  {
    title: "Every Hole at The #1 Course in Colorado, Ballyneal Golf Club | Golf Digest (YouTube)",
    url: "https://www.youtube.com/watch?v=xmWdN05ypkM",
    sourceName: "Golf Digest",
    contentType: "video",
    summary: "Aerial flyover of Ballyneal Golf Club in the rolling dunes of Northeast Colorado, one of Tom Doak's most celebrated minimalist designs, frequently ranked in the Top 100 courses in America.",
    isFeatured: true,
    duration: "~15 min",
    thumbnailUrl: "https://img.youtube.com/vi/xmWdN05ypkM/hqdefault.jpg",
    architects: ["Tom Doak"],
  },
  {
    title: "Every Hole at Pinehurst No. 2 | Golf Digest (YouTube)",
    url: "https://www.youtube.com/watch?v=o-e6617kfbU",
    sourceName: "Golf Digest",
    contentType: "video",
    summary: "Golf Digest Architecture Editor Derek Duncan narrates a hole-by-hole aerial of Pinehurst No. 2, site of the 2024 U.S. Open, explaining Donald Ross's iconic turtleback greens, the Coore & Crenshaw restoration, and each hole's strategic demands.",
    isFeatured: true,
    duration: "16 min",
    thumbnailUrl: "https://img.youtube.com/vi/o-e6617kfbU/hqdefault.jpg",
    architects: ["Donald Ross", "Bill Coore", "Ben Crenshaw"],
  },
  {
    title: "The Defining Trait of Good Golf-Course Architecture? It's Not Length",
    url: "https://golf.com/travel/courses/building-blocks-great-golf-course-architecture/",
    sourceName: "Golf Magazine / GOLF.com",
    contentType: "article",
    summary: "Ran Morrissett argues that great greens \u2014 not length \u2014 are the defining characteristic of elite golf course architecture, citing Pinehurst No. 2, Oakmont, Shinnecock Hills, Winged Foot, and Oakland Hills as the five best green complexes in the U.S.",
    isFeatured: true,
    architects: ["Donald Ross", "A.W. Tillinghast"],
  },
  {
    title: "In Golf-Course Architecture, Things Are Looking Up in the States",
    url: "https://golf.com/travel/golf-course-architecture-states-2024/",
    sourceName: "Golf Magazine / GOLF.com",
    contentType: "article",
    summary: "2024 outlook on American golf architecture, previewing Sedge Valley (Tom Doak/Sand Valley), The Chain by Coore-Crenshaw at Streamsong, Panther National (Nicklaus-Justin Thomas), Pinehurst No. 10, and Old Barnwell. Explores the trend toward shorter, more efficient courses.",
    isFeatured: true,
    architects: ["Tom Doak", "Bill Coore", "Ben Crenshaw", "Jack Nicklaus", "Kyle Franz", "Brian Schneider", "Blake Conant", "Angela Moser"],
  },
  {
    title: "Best Golf Courses in the U.S. for 2024\u201325, Ranked 1 to 100",
    url: "https://golf.com/travel/courses/best-golf-courses-united-states-2024-2025/",
    sourceName: "Golf Magazine / GOLF.com",
    contentType: "article",
    summary: "GOLF.com's full Top 100 Courses in the United States for 2024\u201325, compiled by 127 design panelists worldwide. Introduces The Lido, Old Barnwell, and Medinah No. 3 as notable newcomers while discussing the architecture trends behind the rankings.",
    isFeatured: true,
    architects: ["Tom Doak", "Brian Schneider", "Blake Conant"],
  },
  {
    title: "4 Architects Discuss Course Ratings \u2014 Their Answers Might Surprise You",
    url: "https://golf.com/travel/architects-course-ratings-answers-surprising/",
    sourceName: "Golf Magazine / GOLF.com",
    contentType: "article",
    summary: "A roundtable video and article with Tom Doak, Bill Coore, Andrew Green, and Rob Collins discussing what makes courses 'list-worthy,' their skepticism about rankings, and what they value in great golf course design.",
    isFeatured: true,
    architects: ["Tom Doak", "Bill Coore", "Andrew Green", "Rob Collins"],
  },
  {
    title: "Meet the 11 Newcomers on GOLF's Top 100 Courses in the U.S. List",
    url: "https://golf.com/travel/meet-11-newcomers-golf-top-100-courses-us/",
    sourceName: "Golf Magazine / GOLF.com",
    contentType: "article",
    summary: "In-depth profiles of all 11 newcomers to GOLF's 2024 Top 100 U.S. list, including The Lido (Tom Doak's Wisconsin recreation of C.B. Macdonald's lost Long Island course), Old Barnwell, and Medinah No. 3 (OCM Golf renovation).",
    isFeatured: true,
    architects: ["Tom Doak", "C.B. Macdonald", "Brian Schneider", "Blake Conant", "Gil Hanse", "Jim Wagner"],
  },
  {
    title: "When Were the Best Courses Built? We Rank the Decades of U.S. Golf Design",
    url: "https://golfweek.usatoday.com/story/sports/golf/2026/02/04/when-were-best-courses-built-rank-the-decades-of-u-s-golf-design-architecture/88497341007/",
    sourceName: "Golfweek",
    contentType: "article",
    summary: "Golfweek analyzes its 2025 top 200 Classic and Modern rankings by decade, confirming the 1920s Golden Age as the greatest era for course building while noting the current decade is on pace to be historically significant as well.",
    isFeatured: true,
    architects: ["Alister MacKenzie", "Charles Blair Macdonald", "Seth Raynor"],
  },
  {
    title: "Golfweek's Best 2025: Top 200 Modern Courses in the U.S., Ranked",
    url: "https://golfweek.usatoday.com/story/sports/golf/2025/06/16/golfweeks-best-2025-modern-top-200-golf-courses-united-states-ranked/83776504007/",
    sourceName: "Golfweek",
    contentType: "article",
    summary: "Golfweek's annual ranking of the top 200 modern (post-1960) courses in the United States, compiled by over 800 course raters using 10 criteria including routing, green quality, variety, and walkability.",
    isFeatured: true,
    architects: ["Robert Trent Jones Sr."],
  },
  {
    title: "Golfweek's Best: The Secret Sauce of Course Design",
    url: "https://golfweek.usatoday.com/story/sports/golf/2020/08/21/golfweeks-best-the-secret-sauce-of-course-design/76539693007/",
    sourceName: "Golfweek",
    contentType: "article",
    summary: "Golfweek examines what the highest-ranked courses on its Best lists have in common: core golf (no public roads or residences), open spaces with long views, waterfront locations, variety, walkability, and a 'golf first' culture.",
    isFeatured: true,
    architects: [],
  },
  {
    title: "Harry Colt: Golf's Greatest Architect?",
    url: "https://linksmagazine.com/harry-colt-golfs-greatest-architect/",
    sourceName: "Links Magazine",
    contentType: "article",
    summary: "Detailed profile of Harry S. Colt \u2014 arguing he was the most influential architect in golf history. Covers his 446 courses, his design tenets from 'Some Essays on Golf-Course Architecture,' his work at Sunningdale, Pine Valley, Royal Portrush, and his transformative effect on the profession.",
    isFeatured: true,
    architects: ["Harry S. Colt"],
  },
  {
    title: "Golf Course Architecture's Most Important Courses",
    url: "https://linksmagazine.com/game_changers/",
    sourceName: "Links Magazine",
    contentType: "article",
    summary: "A history of golf architecture's most important 'game-changing' courses from Sunningdale Old (1900) through Bandon Dunes (1999), explaining how each redirected the field \u2014 from Macdonald's template holes at National Golf Links to Pete Dye's TPC Sawgrass.",
    isFeatured: true,
    architects: ["H.S. Colt", "C.B. Macdonald", "Pete Dye", "Alister MacKenzie", "David McLay Kidd"],
  },
  {
    title: "The Next A-List Golf Architects",
    url: "https://linksmagazine.com/the-next-a-list-golf-architects/",
    sourceName: "Links Magazine",
    contentType: "article",
    summary: "Links Magazine profiles the architects positioned to join the current A-List of Coore/Crenshaw, Hanse/Wagner, Tom Doak, and David McLay Kidd. Features Beau Welling (Tiger Woods TGR Design collaborator), Kyle Phillips (Kingsbarns designer), and others.",
    isFeatured: true,
    architects: ["Bill Coore", "Ben Crenshaw", "Gil Hanse", "Jim Wagner", "Tom Doak", "David McLay Kidd", "Beau Welling", "Kyle Phillips"],
  },
  {
    title: "Tourist Sauce (Carolinas): Episode 10 \u2014 Tobacco Road GC (YouTube)",
    url: "https://www.youtube.com/watch?v=RL_l9FUQcUo",
    sourceName: "No Laying Up",
    contentType: "video",
    summary: "Season 5 finale visiting Tobacco Road GC near Pinehurst \u2014 Mike Strantz's most unique design built in a former sandpit. In-depth conversation with the Strantz family about his design philosophy of wide fairways, dramatic land use, and bold aesthetics.",
    isFeatured: true,
    duration: "44 min",
    thumbnailUrl: "https://img.youtube.com/vi/RL_l9FUQcUo/hqdefault.jpg",
    architects: ["Mike Strantz"],
  },
  {
    title: "Tourist Sauce (Michigan): Episode 5 \u2014 Kingsley Club (YouTube)",
    url: "https://www.youtube.com/watch?v=svMY80fnXB8",
    sourceName: "No Laying Up",
    contentType: "video",
    summary: "NLU visits Kingsley Club in Kingsley, Michigan \u2014 architect Mike DeVries's top-100 masterpiece that fits the land like a glove, celebrated for its stone walls, wildflowers, routing ingenuity, and exceptional conditioning in the northern Michigan pines.",
    isFeatured: true,
    duration: "26 min",
    thumbnailUrl: "https://img.youtube.com/vi/svMY80fnXB8/hqdefault.jpg",
    architects: ["Mike DeVries"],
  },
  {
    title: "Tourist Sauce (Scotland): Episode 12 \u2014 Royal Dornoch (YouTube)",
    url: "https://www.youtube.com/watch?v=U55uwfhBJj4",
    sourceName: "No Laying Up",
    contentType: "video",
    summary: "Season 2 finale at Royal Dornoch \u2014 the undisputed gem of Scottish links golf that inspired Donald Ross's American design career. The NLU crew completes their 'Tilt' competition and reflects on the course's natural rolling terrain and historic significance.",
    isFeatured: true,
    duration: "~25 min",
    thumbnailUrl: "https://img.youtube.com/vi/U55uwfhBJj4/hqdefault.jpg",
    architects: ["Old Tom Morris", "Donald Ross"],
  },
  {
    title: "Tourist Sauce (Oregon): Episode 8 \u2014 Bandon Dunes (YouTube)",
    url: "https://www.youtube.com/watch?v=aXMPIUmxnVc",
    sourceName: "No Laying Up",
    contentType: "video",
    summary: "NLU wraps their Bandon Dunes visit with the original David McLay Kidd course \u2014 interviewing Kidd himself about his design process, the railroad ties at hole 17, and why the course remains many golfers' favorite on property despite not being 'the most scenic.'",
    isFeatured: true,
    duration: "32 min",
    thumbnailUrl: "https://img.youtube.com/vi/aXMPIUmxnVc/hqdefault.jpg",
    architects: ["David McLay Kidd"],
  },
  {
    title: "No Laying Up: Nebraska (YouTube)",
    url: "https://www.youtube.com/watch?v=_jDQkGl4jI0",
    sourceName: "No Laying Up",
    contentType: "video",
    summary: "NLU makes a pilgrimage to Nebraska's Sand Hills region \u2014 the spiritual home of American minimalist architecture \u2014 visiting Sand Hills Golf Club (Coore & Crenshaw) and other courses in the region. Explores why Sand Hills launched the destination golf movement.",
    isFeatured: true,
    duration: "~60 min",
    thumbnailUrl: "https://img.youtube.com/vi/_jDQkGl4jI0/hqdefault.jpg",
    architects: ["Bill Coore", "Ben Crenshaw", "Dave Axland", "Dan Proctor"],
  },
  {
    title: "Tourist Sauce (Oregon): Episode 3 \u2014 Bandon 101 (YouTube)",
    url: "https://www.youtube.com/watch?v=9efPdSuB0f0",
    sourceName: "No Laying Up",
    contentType: "video",
    summary: "Before reviewing individual courses, NLU contextualizes the entire Bandon Dunes resort with special guest interviews featuring Mike Keiser and David McLay Kidd \u2014 explaining Keiser's vision, the resort's founding story, and Kidd's original design brief.",
    isFeatured: true,
    duration: "30 min",
    thumbnailUrl: "https://img.youtube.com/vi/9efPdSuB0f0/hqdefault.jpg",
    architects: ["David McLay Kidd"],
  },
  {
    title: "Erik Anders Lang Interviews Famed Golf Course Designer Tom Doak (YouTube)",
    url: "https://www.youtube.com/watch?v=u41LtBsQjzc",
    sourceName: "Random Golf Club",
    contentType: "video",
    summary: "Erik Anders Lang travels to Traverse City, Michigan to interview Tom Doak at Renaissance Golf Design's offices. They discuss Doak's design history, his Confidential Guide ratings, reversible course design, and his staff's top 10 favorite courses.",
    isFeatured: true,
    duration: "40 min",
    thumbnailUrl: "https://img.youtube.com/vi/u41LtBsQjzc/hqdefault.jpg",
    architects: ["Tom Doak"],
  },
  {
    title: "World-Class Course Architect Breaks Down 5 Iconic Golf Courses (YouTube)",
    url: "https://www.youtube.com/watch?v=shgpTK3-hCE",
    sourceName: "Random Golf Club",
    contentType: "video",
    summary: "Architect Agust\u00edn Piz\u00e1 breaks down the design strategy of 5 iconic courses including the Old Course at St Andrews and Tobacco Road, explaining dynamic diagonal lines, pin placement variety, and the creation of risk-reward scenarios.",
    isFeatured: true,
    duration: "16 min",
    thumbnailUrl: "https://img.youtube.com/vi/shgpTK3-hCE/hqdefault.jpg",
    architects: ["Agust\u00edn Piz\u00e1"],
  },
  {
    title: "This Reversible Golf Course Blew Our Minds (YouTube)",
    url: "https://www.youtube.com/watch?v=aOoMYOQ22f0",
    sourceName: "Random Golf Club",
    contentType: "video",
    summary: "Erik Anders Lang plays The Loop at Forest Dunes \u2014 America's only truly reversible 18-hole course \u2014 and interviews designer Tom Doak about the challenges of creating a routing that works in both directions without sacrificing strategic quality.",
    isFeatured: true,
    duration: "~30 min",
    thumbnailUrl: "https://img.youtube.com/vi/aOoMYOQ22f0/hqdefault.jpg",
    architects: ["Tom Doak"],
  },
  {
    title: "How the Second Golden Age of Golf Architecture Started (YouTube)",
    url: "https://www.youtube.com/watch?v=s6Drcz_fPxM",
    sourceName: "Random Golf Club",
    contentType: "video",
    summary: "Bruce Hepner discusses his beginnings as a restoration architect, his early years with Tom Doak, and the foundational impact of Coore & Crenshaw's Sand Hills on launching the second renaissance in golf course design.",
    isFeatured: true,
    duration: "~45 min",
    thumbnailUrl: "https://img.youtube.com/vi/s6Drcz_fPxM/hqdefault.jpg",
    architects: ["Bruce Hepner", "Tom Doak", "Bill Coore", "Ben Crenshaw"],
  },
  {
    title: "The Templates: Eden",
    url: "https://www.thefriedegg.com/articles/eden-template-hole",
    sourceName: "The Fried Egg",
    contentType: "article",
    summary: "An in-depth look at C.B. Macdonald's Eden template hole, tracing its origins to the famous 11th hole at St. Andrews and analyzing its defining characteristics and famous examples across American golf architecture.",
    isFeatured: true,
    architects: ["C.B. Macdonald", "Seth Raynor"],
  },
  {
    title: "The Templates: Biarritz",
    url: "https://www.thefriedegg.com/articles/biarritz-template-hole",
    sourceName: "The Fried Egg",
    contentType: "article",
    summary: "History and analysis of C.B. Macdonald's Biarritz template \u2014 long par-3s with a bisecting swale in a massive green. Covers the original 1888 Biarritz Golf Club hole, how Macdonald adopted it, and contemporary examples built by modern architects.",
    isFeatured: true,
    architects: ["C.B. Macdonald", "Seth Raynor"],
  },
  {
    title: "The Three Schools of Golf Course Design",
    url: "https://www.thefriedegg.com/articles/three-schools-of-golf-course-design",
    sourceName: "The Fried Egg",
    contentType: "article",
    summary: "The foundational explainer on penal, strategic, and heroic design philosophies, tracing how each school developed historically and how to identify them on the course.",
    isFeatured: true,
    architects: [],
  },
  {
    title: "10 Defining Golf Courses From 2010\u20132025",
    url: "https://www.thefriedegg.com/articles/10-defining-golf-courses-2010-2025",
    sourceName: "The Fried Egg",
    contentType: "article",
    summary: "Fried Egg staff pick 10 courses that defined the post-Recession and post-COVID era of golf architecture, including Sweetens Cove, The Lido, and Medinah No. 3 (OCM Golf renovation), examining why each had outsized influence on the field.",
    isFeatured: true,
    architects: ["Tom Doak", "Brian Schneider", "King-Collins Golf Course Design", "OCM Golf"],
  },
  {
    title: "Golf Architecture 101: Template Holes | Designing Golf (Podcast/YouTube)",
    url: "https://www.thefriedegg.com/podcasts/golf-architecture-101-template-holes",
    sourceName: "The Fried Egg",
    contentType: "podcast",
    summary: "Garrett Morrison introduces colleague PJ Clark to C.B. Macdonald's ideal hole system \u2014 discussing the Redan, Alps, and Road templates \u2014 and explains how Macdonald extracted strategic essences from famous British holes rather than copying them.",
    isFeatured: true,
    duration: "~50 min",
    architects: ["C.B. Macdonald", "Seth Raynor"],
  },
  {
    title: "Pete Dye's Design Legacy (feat. Scot Sherman) | Designing Golf",
    url: "https://www.thefriedegg.com/podcasts/pete-dyes-design-legacy-feat-scot-sherman",
    sourceName: "The Fried Egg",
    contentType: "podcast",
    summary: "With the Players Championship approaching, Garrett explains why architecture nerds admire Pete Dye, then brings on Scot Sherman of Love Golf Design to discuss his history with the Dye family and recent work at TPC Sawgrass and Harbour Town.",
    isFeatured: true,
    duration: "~45 min",
    architects: ["Pete Dye", "Scot Sherman"],
  },
  {
    title: "Why Golf Architecture Nerds Love Pete Dye | Designing Golf (YouTube)",
    url: "https://www.youtube.com/watch?v=mjgKyXHhF2Y",
    sourceName: "The Fried Egg",
    contentType: "video",
    summary: "Garrett Morrison explains the apparent contradiction of architecture enthusiasts loving Pete Dye despite his use of water, trees, and difficulty. Covers Dye's originality after his Scotland trip, the TPC Sawgrass design brief, and his design-build methodology that influenced Coore, Doak, and others.",
    isFeatured: true,
    duration: "12 min",
    thumbnailUrl: "https://img.youtube.com/vi/mjgKyXHhF2Y/hqdefault.jpg",
    architects: ["Pete Dye", "Alice Dye"],
  },
  {
    title: "Golf Architecture 101: The Three (or Two?) Schools of Design | Designing Golf (YouTube)",
    url: "https://www.youtube.com/watch?v=GGVkXgvGigw",
    sourceName: "The Fried Egg",
    contentType: "video",
    summary: "First installment of the Fried Egg's video Golf Architecture 101 series. Garrett Morrison walks PJ Clark through penal, strategic, and heroic design philosophies using a hypothetical 400-yard par-4 to illustrate each school.",
    isFeatured: true,
    duration: "~45 min",
    thumbnailUrl: "https://img.youtube.com/vi/GGVkXgvGigw/hqdefault.jpg",
    architects: [],
  },
  {
    title: "Early Thoughts From a Too-Early Visit to High Grove Club",
    url: "https://golfclubatlas.com/early-thoughts/early-thoughts-from-a-too-early-visit-to-high-grove-club/",
    sourceName: "Golf Club Atlas",
    contentType: "article",
    summary: "An early construction visit to Gil Hanse and Jim Wagner's High Grove Club in Florida, claiming it has the best natural property for golf in Florida \u2014 with significant elevation and sandy soil. Contextualizes it within Hanse/Wagner's five Florida courses built post-COVID.",
    isFeatured: false,
    architects: ["Gil Hanse", "Jim Wagner"],
  },
  {
    title: "A Juxtaposition & Comparison Between Augusta National and The Mines (Mike DeVries)",
    url: "https://golfclubatlas.com/in-my-opinion/a-juxtaposition-comparison-between-augusta-national-and-the-mines-from-mike-devries/",
    sourceName: "Golf Club Atlas",
    contentType: "article",
    summary: "Golf Club Atlas author visits Mike DeVries's The Mines in Grand Rapids during Masters Week and draws compelling parallels between DeVries's Alister MacKenzie-influenced green complexes and the three distinct green styles at Augusta National.",
    isFeatured: false,
    architects: ["Mike DeVries", "Alister MacKenzie"],
  },
  {
    title: "Golf Architecture Resources for Beginners, Intermediates, and Nerds",
    url: "https://golfclubatlas.com/in-my-opinion/golf-architecture-resources-for-beginners-intermediates-and-nerds/",
    sourceName: "Golf Club Atlas",
    contentType: "article",
    summary: "Golf Club Atlas's curated guide to the best books, websites, podcasts, and online resources for learning golf architecture at every level \u2014 from Geoff Shackelford's writings to Tom Doak's Confidential Guide series to the Golf Club Atlas course-by-country database.",
    isFeatured: false,
    architects: ["Tom Doak", "Bill Coore", "Harry Colt", "George Thomas"],
  },
  {
    title: "Feature Interview with Keith Cutten",
    url: "https://golfclubatlas.com/feature-interview/feature-interview-with-keith-cutten/",
    sourceName: "Golf Club Atlas",
    contentType: "article",
    summary: "In-depth interview with architect and author Keith Cutten (Cabot Links, Cabot Cliffs) about his book 'The Evolution of Golf Course Design,' the influence of Harry Colt and Stanley Thompson, and why studying architectural history is essential for modern practitioners.",
    isFeatured: false,
    architects: ["Keith Cutten", "Rod Whitman", "Harry Colt", "Stanley Thompson"],
  },
  {
    title: "Every Hole at Castle Pines Golf Club | Golf Digest (YouTube)",
    url: "https://www.youtube.com/watch?v=v3W9J2HPjh8",
    sourceName: "Golf Digest",
    contentType: "video",
    summary: "Jim Nantz narrates a hole-by-hole flyover of Castle Pines Golf Club in Castle Rock, Colorado, site of the 2024 BMW Championship. Covers Jack Nicklaus's original design and the architectural alterations that elevated it into the top 50 American courses.",
    isFeatured: false,
    duration: "~18 min",
    thumbnailUrl: "https://img.youtube.com/vi/v3W9J2HPjh8/hqdefault.jpg",
    architects: ["Jack Nicklaus"],
  },
  {
    title: "Every Hole at The Park West Palm | Golf Digest (YouTube)",
    url: "https://www.youtube.com/watch?v=N147UFDp070",
    sourceName: "Golf Digest",
    contentType: "video",
    summary: "Architecture Editor Derek Duncan narrates the flyover of The Park West Palm, Gil Hanse and Jim Wagner's reimagining of a 1947 Dick Wilson municipal course. Covers the design philosophy, diagonal carries, and playable ground game features.",
    isFeatured: false,
    duration: "~15 min",
    thumbnailUrl: "https://img.youtube.com/vi/N147UFDp070/hqdefault.jpg",
    architects: ["Gil Hanse", "Jim Wagner", "Dick Wilson"],
  },
  {
    title: "Every Hole at Sleepy Hollow Country Club | Golf Digest (YouTube)",
    url: "https://www.youtube.com/watch?v=76XhdFDR4Mw",
    sourceName: "Golf Digest",
    contentType: "video",
    summary: "Hole-by-hole aerial of Sleepy Hollow Country Club, 30 miles up the Hudson River Valley from Manhattan \u2014 one of the last landmark designs of the Gilded Age. Covers the major 2006\u20132018 remodel that restored architectural clarity.",
    isFeatured: false,
    duration: "~18 min",
    thumbnailUrl: "https://img.youtube.com/vi/76XhdFDR4Mw/hqdefault.jpg",
    architects: [],
  },
  {
    title: "9 Must-Play Public Golf Courses Set to Open in 2024",
    url: "https://golf.com/travel/9-must-play-public-golf-courses-set-to-open-in-2024/",
    sourceName: "Golf Magazine / GOLF.com",
    contentType: "article",
    summary: "Profiles of the most anticipated public course openings of 2024, including Pinehurst No. 10 (Tom Doak/Angela Moser), Sedge Valley at Sand Valley (Tom Doak), The Chain at Streamsong (Coore-Crenshaw), and Cabot Citrus Farms.",
    isFeatured: false,
    architects: ["Tom Doak", "Angela Moser", "Bill Coore", "Ben Crenshaw", "Kyle Franz"],
  },
  {
    title: "Which Architect Has the Most Top 100 Course Designs?",
    url: "https://golf.com/travel/architect-most-top-100-courses-in-world/",
    sourceName: "Golf Magazine / GOLF.com",
    contentType: "article",
    summary: "Analysis of GOLF.com's World Top 100 rankings reveals Harry S. Colt leads all architects with 11 design credits \u2014 ahead of Alister MacKenzie and Old Tom Morris (8 each) and A.W. Tillinghast (7). Discusses Colt's outsized influence on golf architecture.",
    isFeatured: false,
    architects: ["Harry S. Colt", "Alister MacKenzie", "Old Tom Morris", "A.W. Tillinghast"],
  },
  {
    title: "Golfweek's Best: How We Rank Courses with a Score of 1 to 10",
    url: "https://sports.yahoo.com/golfweek-best-rank-courses-score-120039327.html",
    sourceName: "Golfweek",
    contentType: "article",
    summary: "Methodology explainer for Golfweek's Best rankings, detailing all 10 rating criteria used by 800+ raters worldwide: routing, design integrity, land plan, greens and surrounds, par-3/4/5 variety, tree management, conditioning/ecology, and the 'walk in the park' test.",
    isFeatured: false,
    architects: [],
  },
  {
    title: "Gil Hanse, Jim Wagner Focus on Strategy at New Kinsale Club in Florida",
    url: "https://golfweek.usatoday.com/story/sports/golf/2025/03/28/kinsale-club-new-golf-course-florida-gil-hanse-jim-wagner-florida/82695746007/",
    sourceName: "Golfweek",
    contentType: "article",
    summary: "Profile of Kinsale Club in Naples, Florida \u2014 Gil Hanse and Jim Wagner's newest private course \u2014 featuring a classic design inspired by Golden Age architects with strategically placed bunkers and firm, fast playing surfaces.",
    isFeatured: false,
    architects: ["Gil Hanse", "Jim Wagner"],
  },
  {
    title: "Architect Bill Bergin Shares Thoughts on New Georgia Course The Keep",
    url: "https://golfweek.usatoday.com/story/sports/golf/2025/04/09/mclemore-the-keep-architect-bill-bergin-new-golf-course-clifftop-lookout-mountain-georgia/82496489007/",
    sourceName: "Golfweek",
    contentType: "article",
    summary: "Interview with architect Bill Bergin on The Keep at McLemore on Lookout Mountain, Georgia \u2014 a clifftop course with five holes on the cliff's edge offering panoramic views. Discusses the design approach for building on extreme terrain.",
    isFeatured: false,
    architects: ["Bill Bergin", "Rees Jones"],
  },
  {
    title: "Design Boot Camp Offers Chance to Learn Golf Architecture at Pinehurst",
    url: "https://golfweek.usatoday.com/story/sports/golf/2025/09/03/design-boot-camp-2026-asgca-pinehurst-resort-no-11-bill-coore-course-architecture-north-carolina/85953474007/",
    sourceName: "Golfweek",
    contentType: "article",
    summary: "Golfweek profiles the 2026 ASGCA Design Boot Camp at Pinehurst Resort, which includes a course tour of the new Pinehurst No. 11 with architect Bill Coore \u2014 an opportunity for design enthusiasts to learn directly from one of the great modern architects.",
    isFeatured: false,
    architects: ["Bill Coore"],
  },
  {
    title: "Golfweek's Best 2026 Top 200 Residential Golf Courses in the U.S.",
    url: "https://golfweek.usatoday.com/story/sports/golf/2026/01/09/top-200-residential-golf-courses-united-states-2026-golfweeks-best-rankings-list/88053264007/",
    sourceName: "Golfweek",
    contentType: "article",
    summary: "Golfweek's 2026 ranking of the top 200 residential golf courses in the U.S., noting Tom Fazio leads with 43 credits and Jack Nicklaus has 40 \u2014 together representing nearly 42% of the list \u2014 while highlighting 6 newcomers designed by Doak, Nicklaus-Thomas, and Kyle Franz.",
    isFeatured: false,
    architects: ["Tom Fazio", "Jack Nicklaus", "Tom Doak", "Kyle Franz"],
  },
  {
    title: "The Moment I Knew I Wanted to Design Golf Courses",
    url: "https://linksmagazine.com/golf-architects-the-moment-i-knew-i-wanted-to-design-golf-courses/",
    sourceName: "Links Magazine",
    contentType: "article",
    summary: "Five architects share the personal moments \u2014 often involving a specific course, hole, or experience \u2014 that made them realize they wanted to design golf courses professionally. Features reflections on Jack Nicklaus, Arthur Hills, and Pete Dye as design influences.",
    isFeatured: false,
    architects: ["Jack Nicklaus", "Arthur Hills", "Pete Dye"],
  },
  {
    title: "The Future of Golf Course Architecture",
    url: "https://linksmagazine.com/architecture_course_of_most_resistance/",
    sourceName: "Links Magazine",
    contentType: "article",
    summary: "An analysis of how minimalism \u2014 driven by Doak, Coore, Hanse, and McLay Kidd \u2014 became the dominant philosophy in golf design by the early 2010s. Examines the economic pressures shaping the field and the rise of low-cost minimalist builds.",
    isFeatured: false,
    architects: ["Tom Doak", "Bill Coore", "Gil Hanse", "David McLay Kidd"],
  },
  {
    title: "The Value of Variety in Golf Course Design",
    url: "https://linksmagazine.com/the-value-of-variety-in-golf-course-design/",
    sourceName: "Links Magazine",
    contentType: "article",
    summary: "Links Magazine examines how MacKenzie, Ross, Doak, and modern architects approach variety as the antidote to monotony \u2014 the deadliest sin in golf design \u2014 featuring perspectives from Mike DeVries and other contemporary designers.",
    isFeatured: false,
    architects: ["Alister MacKenzie", "Donald Ross", "Tom Doak", "Mike DeVries"],
  },
  {
    title: "The Evolution of Golf Course Architecture",
    url: "https://linksmagazine.com/golf_course_architecture_evolution/",
    sourceName: "Links Magazine",
    contentType: "article",
    summary: "Survey of golf architecture over LINKS Magazine's first 20 years (1988\u20132008), examining the artist-patron relationships of Tom Doak/Mike Keiser (Bandon Dunes), Rees Jones/David Fay (US Open venues), and Tom Fazio/Jim Anthony (private golf communities).",
    isFeatured: false,
    architects: ["Tom Doak", "Rees Jones", "Tom Fazio", "Bill Coore", "Ben Crenshaw"],
  },
  {
    title: "A Rant Against Golden Age Golf Architects",
    url: "https://linksmagazine.com/a-rant-against-golden-age-golf-architects/",
    sourceName: "Links Magazine",
    contentType: "article",
    summary: "A contrarian take on the Golden Age revival, arguing that figures like Ross, MacKenzie, and Colt weren't actually minimalists \u2014 they simply lacked bulldozers \u2014 and questioning whether the current reverence for their work distorts how we evaluate modern architecture.",
    isFeatured: false,
    architects: ["Donald Ross", "Alister MacKenzie", "H.S. Colt", "A.W. Tillinghast"],
  },
  {
    title: "Tourist Sauce (Oregon): Episode 7 \u2014 Bandon Trails (YouTube)",
    url: "https://www.youtube.com/watch?v=MauceFJMwrs",
    sourceName: "No Laying Up",
    contentType: "video",
    summary: "NLU explores Bandon Trails \u2014 Bill Coore & Ben Crenshaw's 2007 inland routing through the forest at Bandon Dunes \u2014 making the case that despite lacking oceanfront drama, Trails is the most complete and satisfying of the resort's courses.",
    isFeatured: false,
    duration: "28 min",
    thumbnailUrl: "https://img.youtube.com/vi/MauceFJMwrs/hqdefault.jpg",
    architects: ["Bill Coore", "Ben Crenshaw"],
  },
  {
    title: "Tourist Sauce (Ireland): Episode 8 \u2014 Carne Golf Links (YouTube)",
    url: "https://www.youtube.com/watch?v=QyvHOP-bqAI",
    sourceName: "No Laying Up",
    contentType: "video",
    summary: "NLU visits Carne Golf Links on the Mullet Peninsula, designed by Eddie Hackett \u2014 described by Tom Coyne as one of his favorites in the world. The crew learns about Hackett's no-machinery minimalist approach and the course's status as the last masterpiece by Ireland's 'architect of links golf.'",
    isFeatured: false,
    duration: "27 min",
    thumbnailUrl: "https://img.youtube.com/vi/QyvHOP-bqAI/hqdefault.jpg",
    architects: ["Eddie Hackett"],
  },
  {
    title: "The Fried Egg's Masterclass In Golden Age Golf Course Architecture (YouTube)",
    url: "https://www.youtube.com/watch?v=UBEHjVO7fW8",
    sourceName: "Random Golf Club",
    contentType: "video",
    summary: "Random Golf Club Films features Agust\u00edn Piz\u00e1 breaking down iconic holes from St Andrews and Tobacco Road, analyzing what makes courses architecturally stand out through the lens of modern design principles.",
    isFeatured: false,
    duration: "~15 min",
    thumbnailUrl: "https://img.youtube.com/vi/UBEHjVO7fW8/hqdefault.jpg",
    architects: ["Agust\u00edn Piz\u00e1"],
  },
  {
    title: "Searching for the Architect | Adventures In Golf Season 4 (YouTube)",
    url: "https://www.youtube.com/watch?v=nJbKaxZ_0s4",
    sourceName: "Random Golf Club",
    contentType: "video",
    summary: "Season 4 premiere of Adventures In Golf. Erik Anders Lang visits Golf de Dunkerque Grand Littoral in northern France, a course inspired by military architect S\u00e9bastien Vauban's 17th-century fortress designs \u2014 featuring angular walls, raised edges, and imposing cement features.",
    isFeatured: false,
    duration: "~25 min",
    thumbnailUrl: "https://img.youtube.com/vi/nJbKaxZ_0s4/hqdefault.jpg",
    architects: ["S\u00e9bastien Vauban"],
  },
  {
    title: "Benjamin Warren of Artisan Golf Design on the 'Source Material' for Golf Course Architecture (YouTube)",
    url: "https://www.youtube.com/watch?v=jr12uoFJjVU",
    sourceName: "Random Golf Club",
    contentType: "video",
    summary: "Random Golf Club Films interviews Benjamin Warren of Artisan Golf Design on his design philosophy and the historical 'source material' that informs modern golf course architecture.",
    isFeatured: false,
    duration: "~20 min",
    thumbnailUrl: "https://img.youtube.com/vi/jr12uoFJjVU/hqdefault.jpg",
    architects: ["Benjamin Warren"],
  },
  {
    title: "The Look of Golf \u2014 YouTube Channel",
    url: "https://www.youtube.com/@TheLookOfGolf",
    sourceName: "The Look of Golf",
    contentType: "video",
    summary: "The Look of Golf is a YouTube channel dedicated to the visual and architectural beauty of golf courses, producing documentary-style videos exploring design, history, and the aesthetic details of notable golf venues.",
    isFeatured: false,
    architects: [],
  }
];

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth(request);
  if (authError) return authError;

  try {
    // Collect all unique architect names from the content items
    const allArchitectNames = [
      ...new Set(CONTENT_ITEMS.flatMap((item) => item.architects)),
    ];

    // Look up architects by name (case-insensitive)
    const architectRecords = await prisma.architect.findMany({
      where: {
        OR: allArchitectNames.map((name) => ({
          name: { contains: name, mode: "insensitive" as const },
        })),
      },
      select: { id: true, name: true },
    });

    // Build a name -> id map (case-insensitive)
    const architectMap = new Map<string, number>();
    for (const arch of architectRecords) {
      architectMap.set(arch.name.toLowerCase(), arch.id);
    }

    // Delete all existing external content (cascade deletes links)
    await prisma.externalContent.deleteMany({});

    const now = new Date();
    const created: any[] = [];

    for (const item of CONTENT_ITEMS) {
      const { architects: architectNames, publishedAt, thumbnailUrl, ...contentData } = item;

      const content = await prisma.externalContent.create({
        data: {
          ...contentData,
          thumbnailUrl: thumbnailUrl || null,
          isApproved: true,
          linkStatus: "ok",
          lastCheckedAt: now,
          publishedAt: publishedAt ? new Date(publishedAt) : null,
          tags: [],
        },
      });

      // Link architects
      const architectIds: number[] = [];
      for (const name of architectNames) {
        const id = architectMap.get(name.toLowerCase());
        if (id) architectIds.push(id);
      }

      if (architectIds.length > 0) {
        await prisma.contentArchitectLink.createMany({
          data: architectIds.map((architectId) => ({
            contentId: content.id,
            architectId,
            relevance: "primary",
          })),
        });
      }

      created.push({ id: content.id, title: content.title, architects: architectIds.length });
    }

    return NextResponse.json({
      success: true,
      message: `Re-enriched Fairway with ${created.length} content items`,
      items: created,
      architectsFound: architectRecords.map((a) => a.name),
    });
  } catch (err: any) {
    console.error("Re-enrich fairway error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
