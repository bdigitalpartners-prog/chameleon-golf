"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  X,
  Heart,
  Shield,
  Truck,
  RefreshCw,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

const products = [
  {
    id: 1,
    name: "Crowley Icon Polo",
    price: "$120",
    priceNum: 120,
    description:
      "Performance stretch cotton polo with knit collar — a classic Greyson icon crafted from premium performance fabric.",
    image:
      "https://greysonclothiers.com/cdn/shop/files/MSP26K41A_372_1_10945.png?v=1772737752&width=540",
    category: "polos",
    colors: "Multiple colors available",
    tag: "Best Seller",
  },
  {
    id: 2,
    name: "Omaha Pique Polo",
    price: "$110",
    priceNum: 110,
    description:
      "Cotton blend pique polo with spread collar — one of Greyson's signature polos in a breathable cotton blend fabric.",
    image:
      "https://greysonclothiers.com/cdn/shop/files/MCLSCK10_100_1_6441_0ed59b33-c498-42eb-99fe-5cc87ede13e1.png?v=1761683882&width=540",
    category: "polos",
    colors: "Multiple colors available",
    tag: null,
  },
  {
    id: 3,
    name: "Aurora Striped Polo",
    price: "$110",
    priceNum: 110,
    description:
      "Lightweight performance polo featuring tonal stripes and a comfortable jersey collar for all-day comfort.",
    image:
      "https://greysonclothiers.com/cdn/shop/files/MCLSCK61_283_1_7600.png?v=1770913852&width=540",
    category: "polos",
    colors: "Multiple colors available",
    tag: "New",
  },
  {
    id: 4,
    name: "Ponderous Wolf Polo",
    price: "$120",
    priceNum: 120,
    description:
      "Performance printed polo with knit collar featuring an allover wolf graphic print on performance stretch fabric.",
    image:
      "https://greysonclothiers.com/cdn/shop/files/MSP26K86_417_1_10571.png?v=1773154535&width=540",
    category: "polos",
    colors: "Black, Lavender",
    tag: null,
  },
  {
    id: 5,
    name: "Guide Sport Polo",
    price: "$120",
    priceNum: 120,
    description:
      "Performance cooling moisture-wicking polo engineered with cooling technology for peak on-course comfort.",
    image:
      "https://greysonclothiers.com/cdn/shop/files/MFA25K82_417_1_6663.png?v=1765401553&width=540",
    category: "polos",
    colors: "Black, Grey, Blue",
    tag: null,
  },
  {
    id: 6,
    name: "Tate Mock Neck Quarter-Zip",
    price: "$160",
    priceNum: 160,
    description:
      "Greyson's most essential midweight quarter-zip featuring a mock neck collar for added warmth and refined style.",
    image:
      "https://greysonclothiers.com/cdn/shop/files/MSP26K96_220_1_0383_bb14a6d3-d98d-4771-a9a9-55294443ac17.png?v=1773071235&width=540",
    category: "layers",
    colors: "Multiple colors available",
    tag: "Best Seller",
  },
  {
    id: 7,
    name: "Rhinebeck Hybrid Jacket",
    price: "$230",
    priceNum: 230,
    description:
      "Quilted performance quarter-zip jacket combining functional outerwear with the versatility of a quarter-zip silhouette.",
    image:
      "https://greysonclothiers.com/cdn/shop/files/MFA25O83_417_1__10706.png?v=1754599118&width=540",
    category: "layers",
    colors: "Black, Navy",
    tag: null,
  },
  {
    id: 8,
    name: "Sebonack Cashmere Quarter-Zip",
    price: "$320",
    priceNum: 320,
    description:
      "Exceptionally soft luxury quarter-zip crafted from a premium wool-cashmere blend for lightweight warmth.",
    image:
      "https://greysonclothiers.com/cdn/shop/files/MCLSCS20_050_1_7396_29fa05c9-1de8-4c7c-8643-cd7d1fc4acf8.png?v=1771865391&width=540",
    category: "layers",
    colors: "Multiple colors available",
    tag: "Premium",
  },
  {
    id: 9,
    name: "Montauk Performance Trouser",
    price: "$160",
    priceNum: 160,
    description:
      "Tailored fit lightweight stretch dress pant — Greyson's flagship performance trouser in 4-way stretch fabric.",
    image:
      "https://greysonclothiers.com/cdn/shop/files/MSP26B01_947_1.png?v=1773157177&width=540",
    category: "pants",
    colors: "Multiple colors available",
    tag: "Best Seller",
  },
  {
    id: 10,
    name: "Wainscott 5-Pocket Pant",
    price: "$180",
    priceNum: 180,
    description:
      "Classic fit lightweight performance pant blending the casual look of a 5-pocket jean with performance fabric.",
    image:
      "https://greysonclothiers.com/cdn/shop/files/MCLSCB66_262_1.png?v=1773159552&width=540",
    category: "pants",
    colors: "Multiple colors available",
    tag: null,
  },
];

type Product = (typeof products)[number];
type Category = "all" | "polos" | "layers" | "pants";

const categories: { key: Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "polos", label: "Polos" },
  { key: "layers", label: "Layers" },
  { key: "pants", label: "Pants" },
];

const features = [
  { icon: Shield, title: "Authentic Guarantee", desc: "100% genuine products from authorized retailers" },
  { icon: Truck, title: "Complimentary Shipping", desc: "Free shipping on all orders over $150" },
  { icon: RefreshCw, title: "Easy Returns", desc: "30-day hassle-free return policy" },
  { icon: Heart, title: "Member Perks", desc: "Exclusive access and early drops for members" },
];

export default function ProShopPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);

  const filtered =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  function addToCart(e: React.MouseEvent | null, product: Product) {
    if (e) e.stopPropagation();
    setCartCount((c) => c + 1);
    setToast(`${product.name} added to cart`);
  }

  function toggleWishlist(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!selectedProduct) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedProduct(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedProduct]);

  return (
    <div style={{ backgroundColor: "var(--cg-bg-primary)", color: "var(--cg-text-primary)" }} className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, var(--cg-accent-bg) 0%, transparent 70%)" }} />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <span
              className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-medium tracking-wider uppercase"
              style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)", border: "1px solid var(--cg-accent-muted)" }}
            >
              Spring/Summer 2026
            </span>
          </div>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "Georgia, serif" }}
          >
            The Pro Shop
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-8" style={{ color: "var(--cg-text-secondary)" }}>
            Curated luxury golf apparel from the finest brands
          </p>
          <a
            href="#collection"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all"
            style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cg-accent-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--cg-accent)")}
          >
            Shop Collection <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Filter Bar + Cart Badge */}
      <section id="collection" className="mx-auto max-w-7xl px-4 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                style={
                  activeCategory === c.key
                    ? { backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }
                    : { backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)", border: "1px solid var(--cg-border)" }
                }
                onMouseEnter={(e) => {
                  if (activeCategory !== c.key) e.currentTarget.style.borderColor = "var(--cg-accent)";
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== c.key) e.currentTarget.style.borderColor = "var(--cg-border)";
                }}
              >
                {c.label}
              </button>
            ))}
            <span className="text-sm ml-2" style={{ color: "var(--cg-text-muted)" }}>
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </span>
          </div>

          <button className="relative rounded-lg p-2 transition-colors" style={{ color: "var(--cg-text-secondary)" }}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Product Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
              style={{
                backgroundColor: "var(--cg-bg-card)",
                border: "1px solid var(--cg-border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.borderColor = "var(--cg-accent-muted)";
                e.currentTarget.style.boxShadow = "0 8px 30px var(--cg-accent-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "var(--cg-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {product.tag && (
                  <span
                    className="absolute top-3 left-3 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
                  >
                    {product.tag}
                  </span>
                )}
                <button
                  onClick={(e) => toggleWishlist(e, product.id)}
                  className="absolute top-3 right-3 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
                >
                  <Heart
                    className="h-4 w-4"
                    style={{ color: wishlist.has(product.id) ? "var(--cg-error, #ef4444)" : "var(--cg-text-secondary)" }}
                    fill={wishlist.has(product.id) ? "var(--cg-error, #ef4444)" : "none"}
                  />
                </button>
              </div>

              {/* Details */}
              <div className="p-4">
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  {product.category}
                </p>
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ fontFamily: "Georgia, serif", color: "var(--cg-text-primary)" }}
                >
                  {product.name}
                </h3>
                <p
                  className="text-xs mb-3 line-clamp-2"
                  style={{ color: "var(--cg-text-muted)" }}
                >
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold" style={{ color: "var(--cg-text-primary)" }}>
                    {product.price}
                  </span>
                  <button
                    onClick={(e) => addToCart(e, product)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cg-accent-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--cg-accent)")}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Strip */}
      <section className="py-16" style={{ borderTop: "1px solid var(--cg-border)", borderBottom: "1px solid var(--cg-border)", backgroundColor: "var(--cg-bg-secondary)" }}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--cg-accent-bg)", color: "var(--cg-accent)" }}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-semibold" style={{ color: "var(--cg-text-primary)" }}>
                  {f.title}
                </h4>
                <p className="text-xs" style={{ color: "var(--cg-text-muted)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "Georgia, serif", color: "var(--cg-text-primary)" }}>
                Shop
              </h4>
              <div className="flex flex-col gap-2">
                {["Polos", "Layers", "Pants", "New Arrivals"].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      const cat = item.toLowerCase() as Category;
                      if (cat === "polos" || cat === "layers" || cat === "pants") {
                        setActiveCategory(cat);
                        document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="text-left text-sm transition-colors"
                    style={{ color: "var(--cg-text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cg-accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cg-text-muted)")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "Georgia, serif", color: "var(--cg-text-primary)" }}>
                Brands
              </h4>
              <div className="flex flex-col gap-2">
                {["Greyson Clothiers", "Coming Soon"].map((item) => (
                  <span key={item} className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4" style={{ fontFamily: "Georgia, serif", color: "var(--cg-text-primary)" }}>
                Support
              </h4>
              <div className="flex flex-col gap-2">
                {["Sizing Guide", "Shipping Info", "Returns", "Contact Us"].map((item) => (
                  <span key={item} className="text-sm" style={{ color: "var(--cg-text-muted)" }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium shadow-xl animate-[slideUp_0.3s_ease-out]"
          style={{
            backgroundColor: "var(--cg-accent)",
            color: "var(--cg-text-inverse)",
          }}
        >
          <ShoppingCart className="h-4 w-4" />
          {toast}
        </div>
      )}

      {/* Quick View Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "var(--cg-bg-overlay)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProduct(null);
          }}
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]"
            style={{ backgroundColor: "var(--cg-bg-card)", border: "1px solid var(--cg-border)" }}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 rounded-full p-2 transition-colors"
              style={{ backgroundColor: "var(--cg-bg-tertiary)", color: "var(--cg-text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cg-text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cg-text-secondary)")}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-square" style={{ backgroundColor: "var(--cg-bg-tertiary)" }}>
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "var(--cg-accent)" }}
                >
                  {selectedProduct.category}
                </p>
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: "Georgia, serif", color: "var(--cg-text-primary)" }}
                >
                  {selectedProduct.name}
                </h2>
                <p className="text-2xl font-bold mb-4" style={{ color: "var(--cg-accent)" }}>
                  {selectedProduct.price}
                </p>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--cg-text-secondary)" }}>
                  {selectedProduct.description}
                </p>
                <p className="text-xs mb-6" style={{ color: "var(--cg-text-muted)" }}>
                  Colors: {selectedProduct.colors}
                </p>
                <button
                  onClick={(e) => {
                    addToCart(null, selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full rounded-lg py-3 text-sm font-semibold transition-all"
                  style={{ backgroundColor: "var(--cg-accent)", color: "var(--cg-text-inverse)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cg-accent-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--cg-accent)")}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
