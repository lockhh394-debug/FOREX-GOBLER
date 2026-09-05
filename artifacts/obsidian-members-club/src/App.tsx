import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  useAuth,
  useClerk,
  useUser,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import {
  getListReviewOrdersQueryKey,
  getListOrdersQueryKey,
  useCreateOrder,
  useListOrders,
  useListProducts,
  useListReviewOrders,
  useRequestUploadUrl,
  useSubmitPaymentProof,
  useVerifyOrderPayment,
} from "@workspace/api-client-react";
import type { Order, Product, ReviewOrder } from "@workspace/api-client-react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Loader2,
  LogOut,
  LayoutDashboard,
  Menu,
  MoveUpRight,
  FileCheck2,
  HelpCircle,
  ShieldCheck,
  TriangleAlert,
  UploadCloud,
  UserRound,
  MessageCircle,
  Trophy,
  Wallet,
  X,
} from "lucide-react";
import { Redirect, Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const RECEIVING_ADDRESS = "TD2NkgvoYBucfcas6gDQYq5ZdGWUNbnUcU";

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#d6a447",
    colorForeground: "#eee9de",
    colorMutedForeground: "#b3a993",
    colorDanger: "#e0715c",
    colorBackground: "#211d18",
    colorInput: "#171411",
    colorInputForeground: "#eee9de",
    colorNeutral: "#5a5144",
    fontFamily: "Manrope, sans-serif",
    borderRadius: "0px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#211d18] rounded-none w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-display text-[#eee9de]",
    headerSubtitle: "text-[#b3a993]",
    socialButtonsBlockButtonText: "text-[#eee9de]",
    formFieldLabel: "text-[#eee9de]",
    footerActionLink: "text-[#d6a447]",
    footerActionText: "text-[#b3a993]",
    dividerText: "text-[#b3a993]",
    identityPreviewEditButton: "text-[#d6a447]",
    formFieldSuccessText: "text-[#7fac84]",
    alertText: "text-[#eee9de]",
    logoBox: "h-10",
    logoImage: "max-h-10",
    socialButtonsBlockButton: "!border-[#5a5144] !bg-[#171411]",
    formButtonPrimary: "!bg-[#d6a447] !text-[#171411] hover:!bg-[#e4b85f]",
    formFieldInput: "!border-[#5a5144] !bg-[#171411] !text-[#eee9de]",
    footerAction: "text-[#b3a993]",
    dividerLine: "!bg-[#5a5144]",
    alert: "!border-[#e0715c] !bg-[#35221f]",
    otpCodeFieldInput: "!border-[#5a5144] !bg-[#171411] !text-[#eee9de]",
    formFieldRow: "text-[#eee9de]",
    main: "text-[#eee9de]",
  },
};

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function scrollToId(id: string, closeMenu?: () => void) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  closeMenu?.();
}

function Home() {
  const [, setLocation] = useLocation();
  const { isSignedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const items = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        }),
      { threshold: 0.08 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const openCommerce = () => {
    if (isSignedIn) {
      setLocation("/user-portal");
      return;
    }
    setAccessOpen(true);
  };

  const faqs = [
    [
      "What exactly do I receive?",
      "You receive access to the Forex Gobler EA plan you select, plus the delivery instructions after your payment proof has been reviewed.",
    ],
    [
      "Do I need an account before I purchase?",
      "Yes. Create an account or sign in first so your order and payment proof stay attached to you. Your account is the private record of your purchase.",
    ],
    [
      "Is there a guaranteed return?",
      "No. Trading carries risk. The systems are designed with different levels of control and risk-management features, not guaranteed outcomes.",
    ],
  ];

  return (
    <div className="obsidian-app grain min-h-[100dvh] text-center">
      <header className="nav-shell fixed left-0 right-0 top-0 z-40">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 md:px-10">
          <button
            type="button"
            onClick={() => scrollToId("top")}
            className="group flex items-center gap-3"
            data-testid="button-brand"
          >
            <span className="display flex h-8 w-8 items-center justify-center border border-[#efb84f] text-sm font-bold text-gold">
              O
            </span>
            <span className="display text-[13px] font-bold tracking-[.16em] text-paper">
              FOREX<span className="text-gold">/</span>GOBLER
            </span>
          </button>
          <nav className="hidden items-center gap-8 md:flex">
            {["The thesis", "The system", "Inside"].map((item, i) => (
              <button
                type="button"
                key={item}
                onClick={() =>
                  scrollToId(["thesis", "system", "inside"][i])
                }
                className="mono text-[10px] uppercase text-sand transition-colors hover:text-gold"
                data-testid={`button-nav-${i}`}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openCommerce}
              className="hidden border border-[#efb84f] px-4 py-2 mono text-[10px] uppercase tracking-[.12em] text-gold transition-colors hover:bg-[#efb84f] hover:text-[#171411] sm:block"
              data-testid="button-nav-join"
            >
              {isSignedIn ? "Browse systems" : "Choose your EA"}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="border border-[#eee9de]/20 p-2 md:hidden"
              aria-label="Toggle navigation"
              data-testid="button-menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-[#eee9de]/15 bg-[#171411] px-5 py-5 md:hidden">
            <div className="flex flex-col gap-5">
              {["The thesis", "The system", "Inside"].map((item, i) => (
                <button
                  type="button"
                  key={item}
                  onClick={() =>
                    scrollToId(["thesis", "system", "inside"][i], () =>
                      setMenuOpen(false),
                    )
                  }
                  className="mono text-center text-[11px] uppercase tracking-[.14em] text-sand"
                >
                  {item}
                </button>
              ))}
              <button
                type="button"
                onClick={openCommerce}
                className="gold-button px-4 py-3 mono text-[10px] uppercase"
                data-testid="button-mobile-join"
              >
                Choose your EA
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section id="top" className="hero-section relative min-h-[850px] overflow-hidden border-b border-[#eee9de]/10 pt-[72px]">
          <div className="orbital-grid absolute inset-0 opacity-80" />
          <div className="absolute right-[4%] top-[10%] h-[510px] w-[510px] rounded-full border border-[#d6a447]/20 md:h-[760px] md:w-[760px]" />
          <div className="hero-orb absolute right-[9%] top-[16%] h-[330px] w-[330px] rounded-full md:h-[520px] md:w-[520px]" />
          <div className="relative mx-auto flex min-h-[778px] max-w-[1320px] items-center px-5 py-20 md:px-10">
            <div className="reveal relative z-10 mx-auto max-w-[850px] text-center">
              <div className="mono flex items-center gap-3 text-[10px] uppercase tracking-[.2em] text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                A private room for public ambition
              </div>
              <h1 className="display mt-8 max-w-[830px] text-[clamp(70px,10.2vw,148px)] font-semibold leading-[.8] tracking-[-.08em] text-paper">
                BUILD
                <br />
                <span className="text-gold">THE EDGE.</span>
              </h1>
              <p className="mx-auto mt-9 max-w-[400px] text-base leading-7 text-sand">
                Forex Gobler systems for people who are done gambling with
                their attention, their capital, and their next move.
              </p>
              <button
                type="button"
                onClick={openCommerce}
                className="gold-button group mx-auto mt-8 flex w-fit items-center gap-5 px-5 py-4 mono text-[10px] uppercase tracking-[.12em]"
                data-testid="button-hero-join"
              >
                Browse the systems
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            <div className="absolute bottom-8 left-5 flex items-center gap-3 md:left-10">
              <ArrowDownRight size={17} className="text-gold" />
              <span className="mono text-[9px] uppercase tracking-[.16em] text-sand">
                Scroll to begin
              </span>
            </div>
            <div className="mono absolute right-5 top-1/2 hidden -translate-y-1/2 rotate-90 text-[9px] uppercase tracking-[.16em] text-sand/60 lg:block">
              A club for the relentlessly unfinished
            </div>
          </div>
        </section>

        <div className="ticker border-b border-[#eee9de]/10 py-4">
          <div className="ticker-track mono text-[10px] uppercase tracking-[.14em] text-sand">
            <span>Execution over intention</span><b>+</b><span>Leverage is a practice</span><b>+</b><span>Build in public</span><b>+</b><span>Sharpened in private</span><b>+</b><span>Execution over intention</span><b>+</b><span>Leverage is a practice</span>
          </div>
        </div>

        <section id="thesis" className="border-b border-[#171411]/20 bg-[#eee9de] text-[#171411]">
          <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-24 md:grid-cols-[1.1fr_.9fr] md:px-10 md:py-36">
            <div className="reveal">
              <div className="mono text-[10px] uppercase tracking-[.2em] text-[#567965]">01 / The thesis</div>
              <h2 className="display mt-8 max-w-[760px] text-[clamp(55px,7vw,106px)] font-semibold leading-[.87] tracking-[-.07em]">
                Your environment
                <br />
                is your <span className="text-[#567965]">strategy.</span>
              </h2>
            </div>
            <div className="reveal flex flex-col justify-end">
              <p className="max-w-[450px] text-base leading-8 text-[#3a3329]">
                Most people do not need more information. They need a system for
                the moments when emotion, distraction, and impulse take the wheel.
              </p>
              <button
                type="button"
                onClick={() => scrollToId("system")}
                className="ghost-button mt-9 flex w-fit items-center gap-4 border-[#171411]/30 px-4 py-3 mono text-[10px] uppercase tracking-[.12em]"
              >
                See the operating system <MoveUpRight size={14} className="text-[#567965]" />
              </button>
            </div>
          </div>
        </section>

        <section id="system" className="border-b border-[#eee9de]/10">
          <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-10 md:py-36">
            <div className="reveal flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div>
                <div className="mono text-[10px] uppercase tracking-[.2em] text-gold">02 / The system</div>
                <h2 className="display mt-7 max-w-[720px] text-[clamp(54px,7vw,104px)] font-semibold leading-[.86] tracking-[-.07em]">
                  Less noise.
                  <br />
                  More <span className="text-gold">control.</span>
                </h2>
              </div>
              <p className="max-w-[250px] text-sm leading-6 text-sand">
                Pick the system that matches your level of control. Every
                choice is documented. Nothing is hidden behind a vague promise.
              </p>
            </div>
            <div className="mt-16 grid gap-px border border-[#eee9de]/15 bg-[#eee9de]/15 md:grid-cols-3">
              {[
                ["01", "Choose your system", "Start with the Forex Gobler EA plan that fits the way you trade."],
                ["02", "Make the move", "Pay by USDT-TRC20, then attach one screenshot as your proof."],
                ["03", "Get cleared", "Your order stays visible in your account while payment is manually reviewed."],
              ].map(([number, title, body], index) => (
                <article key={number} className={`reveal delay-${index + 1} bg-[#211d18] p-7 md:min-h-[280px]`}>
                  <div className="mono text-[10px] text-gold">{number}</div>
                  <h3 className="display mt-16 text-3xl tracking-[-.04em] text-paper">{title}</h3>
                  <p className="mt-5 text-sm leading-6 text-sand">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="inside" className="border-b border-[#171411]/20 bg-[#d6a447] text-[#171411]">
          <div className="mx-auto grid max-w-[1320px] gap-12 px-5 py-24 md:grid-cols-[.9fr_1.1fr] md:px-10 md:py-36">
            <div className="reveal">
              <div className="mono text-[10px] uppercase tracking-[.2em] text-[#171411]/60">03 / Inside the room</div>
              <h2 className="display mt-8 max-w-[620px] text-[clamp(55px,7.2vw,110px)] font-semibold leading-[.84] tracking-[-.08em]">
                A higher
                <br />
                standard is
                <br />
                <span className="text-[#eee9de]">contagious.</span>
              </h2>
            </div>
            <div className="reveal flex flex-col justify-end">
              <p className="max-w-[470px] text-base leading-8 text-[#171411]/75">
                The room is built for action. Choose your Forex Gobler setup,
                document the move, and keep a private record of the work.
                Serious tools for serious operators.
              </p>
              <button
                type="button"
                onClick={openCommerce}
                className="mt-9 flex w-fit items-center gap-4 bg-[#171411] px-5 py-4 mono text-[10px] uppercase tracking-[.12em] text-[#eee9de] transition-transform hover:-translate-y-1"
                data-testid="button-inside-join"
              >
                Choose your system <ArrowRight size={15} className="text-gold" />
              </button>
            </div>
          </div>
        </section>

        <section className="border-b border-[#eee9de]/10">
          <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-10 md:py-36">
            <div className="reveal">
              <div className="mono text-[10px] uppercase tracking-[.2em] text-gold">04 / The questions</div>
              <h2 className="display mt-7 text-[clamp(52px,6.5vw,94px)] font-semibold leading-[.86] tracking-[-.07em]">
                Read the
                <br />
                fine <span className="text-gold">print.</span>
              </h2>
            </div>
            <div className="mt-14 divide-y divide-[#eee9de]/15 border-y border-[#eee9de]/15">
              {faqs.map(([question, answer], index) => (
                <div key={question} className="reveal">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-center gap-5 py-6 text-center"
                    aria-expanded={openFaq === index}
                  >
                    <span className="display max-w-[700px] text-2xl tracking-[-.03em] text-paper md:text-3xl">{question}</span>
                    <ChevronDown size={20} className={`shrink-0 text-gold transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === index && <p className="mx-auto max-w-[690px] pb-7 text-sm leading-7 text-sand">{answer}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#eee9de] text-[#171411]">
          <div className="relative mx-auto max-w-[1320px] px-5 py-24 md:px-10 md:py-36">
            <div className="reveal max-w-[850px]">
              <div className="mono text-[10px] uppercase tracking-[.2em] text-[#567965]">05 / Your move</div>
              <h2 className="display mt-8 text-[clamp(60px,9vw,136px)] font-semibold leading-[.82] tracking-[-.08em]">
                THE NEXT
                <br />
                MOVE IS
                <br />
                <span className="text-[#567965]">YOURS.</span>
              </h2>
              <p className="mt-10 max-w-[410px] text-lg leading-7 text-[#3a3329]">
                Pick the system. Build the record. Stop waiting for permission.
              </p>
              <button
                type="button"
                onClick={openCommerce}
                className="group mt-9 flex items-center gap-6 bg-[#171411] px-6 py-5 mono text-[10px] uppercase tracking-[.14em] text-[#eee9de] transition-transform hover:-translate-y-1"
                data-testid="button-final-join"
              >
                Browse Forex Gobler <ArrowRight size={16} className="text-gold transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1320px] flex-col justify-between gap-8 px-5 py-10 md:flex-row md:items-end md:px-10">
        <div>
          <div className="display text-lg font-bold tracking-[.12em]">FOREX<span className="text-gold">/</span>GOBLER</div>
          <div className="mono mt-3 text-[9px] uppercase text-sand">A members club for the relentlessly unfinished</div>
        </div>
        <div className="flex gap-7 mono text-[9px] uppercase text-sand">
          <button type="button" onClick={() => scrollToId("top")} className="hover:text-gold">Back to top</button>
          <button type="button" onClick={openCommerce} className="hover:text-gold" data-testid="button-footer-access">Choose your EA</button>
          <span>Â© 2026</span>
        </div>
      </footer>

      {accessOpen && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="access-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAccessOpen(false);
          }}
        >
          <div className="modal-panel relative w-full max-w-[520px] border border-[#eee9de]/20 bg-[#211d18] p-7 md:p-10">
            <button type="button" onClick={() => setAccessOpen(false)} className="absolute right-5 top-5 p-1 text-sand hover:text-gold" aria-label="Close access prompt">
              <X size={18} />
            </button>
            <div className="mono text-[10px] uppercase tracking-[.2em] text-gold">Forex Gobler / Account required</div>
            <h2 className="display mt-7 max-w-[390px] text-5xl leading-[.92] tracking-[-.06em] text-paper" id="access-title">
              Choose your
              <br />
              <span className="text-gold">advantage.</span>
            </h2>
            <p className="mt-5 max-w-[390px] text-sm leading-6 text-sand">
              Create an account or sign in first. Your account keeps your order, payment proof, and delivery status together.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setLocation("/sign-up")}
                className="gold-button flex items-center justify-between px-5 py-4 mono text-[10px] uppercase tracking-[.12em]"
                data-testid="button-register"
              >
                Create account <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setLocation("/sign-in")}
                className="ghost-button flex items-center justify-between px-5 py-4 mono text-[10px] uppercase tracking-[.12em] text-paper"
                data-testid="button-login"
              >
                Sign in <ArrowRight size={16} className="text-gold" />
              </button>
            </div>
            <div className="mt-5 flex items-center gap-2 mono text-[9px] uppercase text-[#eee9de]/40">
              <ShieldCheck size={12} /> Account data is handled privately by secure sign-in.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  onChoose,
  busy,
}: {
  product: Product;
  onChoose: (product: Product) => void;
  busy: boolean;
}) {
  return (
    <article className="portal-product group flex h-full flex-col border border-[#eee9de]/15 bg-[#211d18] p-6 transition-transform hover:-translate-y-1 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="mono text-[10px] uppercase tracking-[.16em] text-gold">{product.tagline}</div>
        <div className="mono text-[10px] uppercase text-sand">{product.paymentNetwork}</div>
      </div>
      <h2 className="display mt-12 text-4xl tracking-[-.05em] text-paper">{product.name}</h2>
      <div className="mt-5 display text-5xl tracking-[-.06em] text-gold">{money(product.priceCents)}</div>
      <p className="mt-5 min-h-[96px] text-sm leading-6 text-sand">{product.description}</p>
      <ul className="mt-7 space-y-3 border-t border-[#eee9de]/10 pt-5">
        {product.features.map((feature) => (
          <li key={feature} className="flex gap-3 text-xs text-paper/80">
            <Check size={15} className="mt-0.5 shrink-0 text-gold" />
            {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChoose(product)}
        disabled={busy}
        className="gold-button mt-8 flex items-center justify-between px-5 py-4 mono text-[10px] uppercase tracking-[.12em] disabled:cursor-wait disabled:opacity-60"
        data-testid={`button-choose-${product.slug}`}
      >
        {busy ? "Starting order..." : "Choose this system"}
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
      </button>
    </article>
  );
}

function OrdersList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="border border-dashed border-[#eee9de]/20 p-6 text-sm text-sand">
        No orders yet. Choose a system above to start your first order.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="flex flex-col justify-between gap-4 border border-[#eee9de]/15 bg-[#211d18] p-5 md:flex-row md:items-center">
          <div className="flex flex-1 items-center justify-between gap-4">
            <div>
              <div className="mono text-[9px] uppercase tracking-[.14em] text-gold">Order #{order.id}</div>
              <div className="display mt-2 text-2xl text-paper">{order.product.name}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="mono text-[9px] uppercase text-sand">Status</div>
                <div className="mt-1 text-sm text-paper">
                  {order.status === "payment_verification_pending"
                    ? "Proof under review"
                    : order.status === "payment_verified"
                      ? order.deliveryStatus === "license_emailed"
                        ? "License emailed Â· delivery in 3â€“5 business days"
                        : "Payment verified"
                      : order.status === "activated"
                        ? "Ready for delivery"
                        : "Awaiting payment"}
                </div>
              </div>
              {order.status === "payment_verification_pending" ? (
                <Clock3 className="text-gold" size={18} />
              ) : (
                <CheckCircle2 className="text-[#7fac84]" size={18} />
              )}
            </div>
          </div>
          {order.licenseKey && (
            <div className="mt-4 border-t border-[#eee9de]/10 pt-4 mono text-[10px] uppercase tracking-[.12em] text-[#a9d4ad]">
              License: <span className="text-paper">{order.licenseKey}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewPortal() {
  const [, setLocation] = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const reviewQuery = useListReviewOrders({
    query: {
      queryKey: getListReviewOrdersQueryKey(),
      enabled: isLoaded && Boolean(isSignedIn),
    },
  });
  const verifyOrder = useVerifyOrderPayment();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  if (!isLoaded) {
    return <div className="portal-loading min-h-[100dvh]"><Loader2 className="animate-spin text-gold" /></div>;
  }
  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  const verify = async (order: ReviewOrder) => {
    setError("");
    setVerifyingId(order.id);
    try {
      await verifyOrder.mutateAsync({ id: order.id, data: {} });
      await queryClient.invalidateQueries({ queryKey: getListReviewOrdersQueryKey() });
    } catch {
      setError("Verification or email delivery failed. The order remains pending.");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="obsidian-app grain min-h-[100dvh] text-center">
      <header className="nav-shell sticky left-0 right-0 top-0 z-40">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 md:px-10">
          <button type="button" onClick={() => setLocation("/user-portal")} className="group flex items-center gap-3">
            <span className="display flex h-8 w-8 items-center justify-center border border-[#efb84f] text-sm font-bold text-gold">O</span>
            <span className="display text-[13px] font-bold tracking-[.16em] text-paper">FOREX<span className="text-gold">/</span>GOBLER</span>
          </button>
          <span className="mono text-[9px] uppercase tracking-[.14em] text-gold">Reviewer console</span>
        </div>
      </header>
      <main className="mx-auto max-w-[1320px] px-5 py-16 md:px-10 md:py-24">
        <div className="mono text-[10px] uppercase tracking-[.2em] text-gold">Payment review</div>
        <h1 className="display mt-7 max-w-[800px] text-[clamp(56px,8vw,116px)] font-semibold leading-[.84] tracking-[-.08em] text-paper">CLEAR THE<br /><span className="text-gold">NEXT MOVE.</span></h1>
        <p className="mt-8 max-w-[520px] text-base leading-7 text-sand">Verify the payment screenshot before the unique license email is sent.</p>
        {error && <div className="mt-8 flex items-center gap-3 border border-[#e0715c]/60 bg-[#35221f] px-4 py-3 text-sm text-paper"><AlertCircle size={17} className="text-[#e0715c]" /> {error}</div>}
        {reviewQuery.isError ? (
          <div className="mt-14 border border-[#e0715c]/50 bg-[#35221f] p-7 text-sm leading-6 text-paper">
            Reviewer access is not enabled for this account. Add the authorized reviewer account ID to <span className="mono text-gold">ADMIN_USER_IDS</span> before using this console.
          </div>
        ) : reviewQuery.isLoading ? (
          <div className="mt-14 flex items-center gap-3 text-sm text-sand"><Loader2 className="animate-spin text-gold" /> Loading pending proofs...</div>
        ) : (reviewQuery.data ?? []).length === 0 ? (
          <div className="mt-14 border border-dashed border-[#eee9de]/20 p-7 text-sm text-sand">No payment proofs are waiting for review.</div>
        ) : (
          <div className="mt-14 space-y-5">
            {(reviewQuery.data ?? []).map((order) => (
              <article key={order.id} className="grid gap-7 border border-[#eee9de]/15 bg-[#211d18] p-6 md:grid-cols-[220px_1fr_auto] md:items-center">
                {order.proofObjectPath ? (
                  <img
                    src={`/api/storage/objects/${order.proofObjectPath.replace(/^\/objects\//, "")}`}
                    alt={`Payment proof for order ${order.id}`}
                    className="h-44 w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-[#171411] text-xs text-sand">No proof image</div>
                )}
                <div>
                  <div className="mono text-[9px] uppercase tracking-[.14em] text-gold">Order #{order.id} Â· {order.customerEmail}</div>
                  <h2 className="display mt-3 text-3xl text-paper">{order.product.name}</h2>
                  <p className="mt-2 text-sm text-sand">{money(order.product.priceCents)} Â· {order.paymentSubmission?.network}</p>
                  <p className="mt-4 text-xs leading-5 text-sand">Confirm the screenshot shows the exact USDT-TRC20 amount before approving.</p>
                </div>
                <button type="button" onClick={() => verify(order)} disabled={verifyingId === order.id} className="gold-button flex items-center justify-center gap-3 px-5 py-4 mono text-[10px] uppercase tracking-[.12em] disabled:cursor-wait disabled:opacity-60">
                  {verifyingId === order.id ? "Sending license..." : "Verify & email license"}
                  {verifyingId === order.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

type PortalTab = "dashboard" | "community" | "profile" | "kyc";

function MemberRail({
  tab,
  setTab,
  user,
  signOut,
}: {
  tab: PortalTab;
  setTab: (tab: PortalTab) => void;
  user: ReturnType<typeof useUser>["user"];
  signOut: () => void;
}) {
  const initials = user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? "F";
  return (
    <aside className="member-rail border-r border-[#eee9de]/10 bg-[#211d18] p-5 lg:sticky lg:top-[72px] lg:h-[calc(100dvh-72px)]">
      <div className="flex items-center gap-3 border-b border-[#eee9de]/10 pb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d6a447] font-bold text-[#171411]">{initials.toUpperCase()}</div>
        <div className="min-w-0">
          <div className="truncate text-sm text-paper">{user?.firstName || "Forex member"}</div>
          <div className="truncate text-[11px] text-sand">{user?.primaryEmailAddress?.emailAddress || "Private account"}</div>
        </div>
      </div>
      <nav className="mt-6 space-y-2" aria-label="Member navigation">
        <button type="button" onClick={() => setTab("dashboard")} className={`member-rail-link ${tab === "dashboard" ? "is-active" : ""}`}><LayoutDashboard size={16} /> Dashboard</button>
        <button type="button" onClick={() => setTab("community")} className={`member-rail-link ${tab === "community" ? "is-active" : ""}`}><MessageCircle size={16} /> Community</button>
        <button type="button" onClick={() => setTab("profile")} className={`member-rail-link ${tab === "profile" ? "is-active" : ""}`}><UserRound size={16} /> Profile</button>
        <button type="button" onClick={() => setTab("kyc")} className={`member-rail-link ${tab === "kyc" ? "is-active" : ""}`}><FileCheck2 size={16} /> KYC & security</button>
      </nav>
      <div className="mt-auto hidden border-t border-[#eee9de]/10 pt-5 lg:block">
        <button type="button" onClick={signOut} className="member-rail-link"><LogOut size={16} /> Sign out</button>
      </div>
    </aside>
  );
}

function ProfilePanel({ user }: { user: ReturnType<typeof useUser>["user"] }) {
  return (
    <section className="portal-panel max-w-[760px]">
      <div className="mono text-[10px] uppercase tracking-[.2em] text-gold">Your identity</div>
      <h1 className="display mt-6 text-5xl leading-[.9] tracking-[-.06em] text-paper">PROFILE.</h1>
      <p className="mt-5 max-w-[520px] text-sm leading-7 text-sand">Keep the account attached to the person making the move. Your order history stays private to this account.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="profile-field"><span>First name</span><strong>{user?.firstName || "Not set"}</strong></div>
        <div className="profile-field"><span>Last name</span><strong>{user?.lastName || "Not set"}</strong></div>
        <div className="profile-field sm:col-span-2"><span>Account email</span><strong>{user?.primaryEmailAddress?.emailAddress || "Private"}</strong></div>
      </div>
    </section>
  );
}

function KycPanel() {
  return (
    <section className="portal-panel max-w-[760px]">
      <div className="mono text-[10px] uppercase tracking-[.2em] text-gold">Trust & safety</div>
      <h1 className="display mt-6 text-5xl leading-[.9] tracking-[-.06em] text-paper">KYC & SECURITY.</h1>
      <p className="mt-5 max-w-[560px] text-sm leading-7 text-sand">Verification is handled privately when it is required for your order. We do not display sensitive identity documents in the member feed.</p>
      <div className="mt-10 border border-[#7fac84]/40 bg-[#203329] p-6">
        <div className="flex items-center gap-3 text-[#a9d4ad]"><ShieldCheck size={20} /> <span className="mono text-[10px] uppercase tracking-[.16em]">Account security active</span></div>
        <p className="mt-4 text-sm leading-6 text-[#c9dfcb]">Email verification protects access to your account. Payment proof is only available inside an authenticated order flow.</p>
      </div>
      <div className="mt-4 border border-[#eee9de]/15 p-6 text-sm leading-6 text-sand">No identity document is requested on this screen. A review request, when needed, will appear here with a clear explanation before anything is submitted.</div>
    </section>
  );
}

function CommunityPanel() {
  const [section, setSection] = useState<"achievements" | "questions" | "ask">("achievements");
  const sections = [
    { id: "achievements" as const, label: "Achievements", icon: Trophy },
    { id: "questions" as const, label: "Questions & concerns", icon: HelpCircle },
    { id: "ask" as const, label: "Ask Forex Gobler", icon: MessageCircle },
  ];
  return (
    <section className="portal-panel max-w-[900px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mono text-[10px] uppercase tracking-[.2em] text-gold">Member room</div>
          <h1 className="display mt-6 text-5xl leading-[.9] tracking-[-.06em] text-paper">THE COMMONS.</h1>
          <p className="mt-5 max-w-[560px] text-sm leading-7 text-sand">A private place to share real progress, ask better questions, and learn without performing for the algorithm.</p>
        </div>
        <div className="community-presence"><span className="presence-dot" /> Live presence will reflect verified members</div>
      </div>
      <div className="mt-10 grid gap-2 border-b border-[#eee9de]/10 pb-3 sm:grid-cols-3">
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setSection(id)} className={`community-tab ${section === id ? "is-active" : ""}`}><Icon size={15} /> {label}</button>
        ))}
      </div>
      <div className="community-empty mt-8">
        {section === "achievements" && <><Trophy size={26} className="text-gold" /><h2 className="display mt-5 text-3xl text-paper">Your wins belong here.</h2><p className="mt-3 max-w-[460px] text-sm leading-6 text-sand">Verified member achievements will appear here after members choose to share them. No invented profiles. No manufactured hype.</p><button type="button" className="gold-button mt-7 px-5 py-3 mono text-[10px] uppercase tracking-[.12em]">Share a real achievement</button></>}
        {section === "questions" && <><HelpCircle size={26} className="text-gold" /><h2 className="display mt-5 text-3xl text-paper">Ask without the noise.</h2><p className="mt-3 max-w-[460px] text-sm leading-6 text-sand">Questions and concerns will be visible to the community when the discussion service is connected. Start with a specific problem, not a performance.</p><button type="button" className="gold-button mt-7 px-5 py-3 mono text-[10px] uppercase tracking-[.12em]">Post a question</button></>}
        {section === "ask" && <><MessageCircle size={26} className="text-gold" /><h2 className="display mt-5 text-3xl text-paper">Ask Forex Gobler.</h2><p className="mt-3 max-w-[460px] text-sm leading-6 text-sand">Bring the decision you are stuck on. A real response will replace the dopamine loop of chasing another signal.</p><button type="button" className="gold-button mt-7 px-5 py-3 mono text-[10px] uppercase tracking-[.12em]">Start a private question</button></>}
      </div>
    </section>
  );
}

function UserPortal() {
  const [, setLocation] = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut: signOutUser } = useClerk();
  const queryClient = useQueryClient();
  const { data: products = [], isLoading: productsLoading } = useListProducts();
  const ordersQuery = useListOrders({
    query: {
      queryKey: getListOrdersQueryKey(),
      enabled: isLoaded && Boolean(isSignedIn),
      refetchInterval: 15000,
    },
  });
  const createOrder = useCreateOrder();
  const requestUploadUrl = useRequestUploadUrl();
  const submitPaymentProof = useSubmitPaymentProof();
  const [step, setStep] = useState<"catalog" | "payment" | "submitted">("catalog");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [portalTab, setPortalTab] = useState<PortalTab>("dashboard");

  const existingPendingOrder = useMemo(
    () => (Array.isArray(ordersQuery.data) ? ordersQuery.data : []).find((order) => order.status === "payment_verification_pending"),
    [ordersQuery.data],
  );
  const orders = Array.isArray(ordersQuery.data) ? ordersQuery.data : [];

  useEffect(() => {
    if (existingPendingOrder && !activeOrder && step === "catalog") {
      setActiveOrder(existingPendingOrder);
      setSelectedProduct(existingPendingOrder.product);
      setStep("submitted");
    }
  }, [activeOrder, existingPendingOrder, step]);

  if (!isLoaded) {
    return <div className="portal-loading min-h-[100dvh]"><Loader2 className="animate-spin text-gold" /></div>;
  }
  if (!isSignedIn) {
    return <Redirect to="/" />;
  }

  const chooseProduct = async (product: Product) => {
    setError("");
    setBusy(true);
    try {
      const order = await createOrder.mutateAsync({ data: { productSlug: product.slug } });
      setSelectedProduct(product);
      setActiveOrder(order);
      setStep("payment");
    } catch {
      setError("We could not start that order. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(RECEIVING_ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copy failed. Select the address manually.");
    }
  };

  const submitProof = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!proofFile || !selectedProduct || !activeOrder) {
      setError("Attach the payment screenshot before submitting.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const upload = await requestUploadUrl.mutateAsync({
        data: {
          name: proofFile.name,
          size: proofFile.size,
          contentType: proofFile.type || "image/jpeg",
        },
      });
      const uploaded = await fetch(upload.uploadURL, {
        method: "PUT",
        headers: { "Content-Type": proofFile.type || "image/jpeg" },
        body: proofFile,
      });
      if (!uploaded.ok) throw new Error("Upload failed");
      const updated = await submitPaymentProof.mutateAsync({
        id: activeOrder.id,
        data: {
          network: selectedProduct.paymentNetwork,
          amountCents: selectedProduct.priceCents,
          proofObjectPath: upload.objectPath,
        },
      });
      setActiveOrder(updated);
      setStep("submitted");
      setProofFile(null);
      await queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
    } catch {
      setError("We could not submit the screenshot. Check the file and try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = () => { void signOutUser({ redirectUrl: basePath || "/" }); };

  return (
    <div className="obsidian-app grain min-h-[100dvh] text-center">
      <header className="nav-shell sticky left-0 right-0 top-0 z-40">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 md:px-10">
          <button type="button" onClick={() => setLocation("/")} className="group flex items-center gap-3">
            <span className="display flex h-8 w-8 items-center justify-center border border-[#efb84f] text-sm font-bold text-gold">O</span>
            <span className="display text-[13px] font-bold tracking-[.16em] text-paper">FOREX<span className="text-gold">/</span>GOBLER</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="hidden mono text-[9px] uppercase tracking-[.14em] text-sand sm:block">
              {user?.firstName ? `Welcome, ${user.firstName}` : "Member portal"}
            </span>
            <button type="button" onClick={handleSignOut} className="flex items-center gap-2 border border-[#eee9de]/20 px-3 py-2 mono text-[9px] uppercase text-sand hover:text-gold" data-testid="button-logout">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="member-layout mx-auto max-w-[1440px] lg:grid lg:grid-cols-[240px_1fr]">
        <MemberRail tab={portalTab} setTab={setPortalTab} user={user} signOut={handleSignOut} />
      <main className="mx-auto w-full max-w-[1200px] px-5 py-16 md:px-10 md:py-24">
        {portalTab === "community" ? <CommunityPanel /> : portalTab === "profile" ? <ProfilePanel user={user} /> : portalTab === "kyc" ? <KycPanel /> : <>
        <div className="reveal">
          <div className="mono text-[10px] uppercase tracking-[.2em] text-gold">Member portal / Forex Gobler</div>
          <h1 className="display mt-7 max-w-[880px] text-[clamp(56px,8vw,116px)] font-semibold leading-[.84] tracking-[-.08em] text-paper">
            CHOOSE YOUR
            <br />
            <span className="text-gold">SYSTEM.</span>
          </h1>
          <p className="mt-8 max-w-[510px] text-base leading-7 text-sand">
            Three levels of control. One private order trail. Choose the EA,
            complete the USDT-TRC20 payment, and attach your proof. Payment
            tools appear only after your account is authenticated.
          </p>
        </div>

        {error && (
          <div className="mt-8 flex items-center gap-3 border border-[#e0715c]/60 bg-[#35221f] px-4 py-3 text-sm text-paper">
            <AlertCircle size={17} className="text-[#e0715c]" /> {error}
          </div>
        )}

        {step === "catalog" && (
          <section className="mt-14">
            {productsLoading ? (
              <div className="flex items-center gap-3 py-16 text-sm text-sand"><Loader2 className="animate-spin text-gold" /> Loading systems...</div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.slug} product={product} onChoose={chooseProduct} busy={busy} />
                ))}
              </div>
            )}
          </section>
        )}

        {step === "payment" && selectedProduct && activeOrder && (
          <section className="mt-14 grid gap-8 lg:grid-cols-[.86fr_1.14fr]">
            <div className="border border-[#eee9de]/15 bg-[#211d18] p-7 md:p-9">
              <button type="button" onClick={() => setStep("catalog")} className="mono text-[9px] uppercase tracking-[.14em] text-sand hover:text-gold">â† Back to systems</button>
              <div className="mt-12 mono text-[10px] uppercase tracking-[.18em] text-gold">Order #{activeOrder.id}</div>
              <h2 className="display mt-5 text-5xl leading-[.9] tracking-[-.06em] text-paper">{selectedProduct.name}</h2>
              <div className="mt-8 flex items-end justify-between border-t border-[#eee9de]/10 pt-5">
                <span className="mono text-[10px] uppercase text-sand">Amount due</span>
                <span className="display text-4xl text-gold">{money(selectedProduct.priceCents)}</span>
              </div>
              <div className="mt-8 space-y-4 text-sm leading-6 text-sand">
                <div className="flex gap-3"><Check size={16} className="mt-1 shrink-0 text-gold" /> Send the exact amount using USDT on TRC20.</div>
                <div className="flex gap-3"><Check size={16} className="mt-1 shrink-0 text-gold" /> Take a clear screenshot showing the completed payment.</div>
                <div className="flex gap-3"><Check size={16} className="mt-1 shrink-0 text-gold" /> Transaction ID is not required for this review flow.</div>
              </div>
            </div>
            <form onSubmit={submitProof} className="border border-[#d6a447]/40 bg-[#eee9de] p-7 text-[#171411] md:p-9">
              <div className="flex items-center gap-3 mono text-[10px] uppercase tracking-[.18em] text-[#567965]"><Wallet size={15} /> Payment destination</div>
              <h2 className="display mt-6 text-4xl leading-[.9] tracking-[-.05em]">Send USDT-TRC20.</h2>
              <p className="mt-4 text-sm leading-6 text-[#3a3329]">Use the address below. Double-check the network before sending.</p>
              <div className="mt-7 border border-[#171411]/20 bg-[#f7f1e5] p-4">
                <div className="mono break-all text-sm leading-6 text-[#171411]" data-testid="text-receiving-address">{RECEIVING_ADDRESS}</div>
                <button type="button" onClick={copyAddress} className="mt-3 flex items-center gap-2 mono text-[10px] uppercase tracking-[.14em] text-[#567965]" data-testid="button-copy-address">
                  <Copy size={14} /> {copied ? "Copied" : "Copy address"}
                </button>
              </div>
              <div className="mt-6 flex gap-3 border border-[#b66a22]/50 bg-[#fff0d8] p-4 text-xs leading-5 text-[#6b351d]" role="alert">
                <TriangleAlert size={18} className="mt-0.5 shrink-0 text-[#b66a22]" />
                <p><strong className="uppercase tracking-[.08em]">Warning:</strong> AI-generated or altered payment screenshots are not accepted. If AI is used to create or manipulate a screenshot, your account will be blocked.</p>
              </div>
              <label className="mt-8 block">
                <span className="mono text-[10px] uppercase tracking-[.14em] text-[#3a3329]">Payment screenshot</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                  className="mt-3 block w-full cursor-pointer border border-dashed border-[#171411]/30 bg-[#f7f1e5] p-4 text-sm text-[#3a3329] file:mr-4 file:border-0 file:bg-[#171411] file:px-3 file:py-2 file:mono file:text-[10px] file:uppercase file:text-[#eee9de]"
                  data-testid="input-payment-screenshot"
                />
              </label>
              {proofFile && <div className="mt-3 flex items-center gap-2 text-sm text-[#567965]"><UploadCloud size={15} /> {proofFile.name}</div>}
              <button type="submit" disabled={busy || !proofFile} className="mt-8 flex w-full items-center justify-between bg-[#171411] px-5 py-4 mono text-[10px] uppercase tracking-[.14em] text-[#eee9de] transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-submit-payment-proof">
                {busy ? "Uploading proof..." : "Submit for review"}
                {busy ? <Loader2 size={16} className="animate-spin text-gold" /> : <ArrowRight size={16} className="text-gold" />}
              </button>
              <div className="mt-4 flex gap-2 text-xs leading-5 text-[#3a3329]"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#567965]" /> Your screenshot is stored privately with your order.</div>
            </form>
          </section>
        )}

        {step === "submitted" && activeOrder && (
          <section className="mt-14 max-w-[760px] border border-[#7fac84]/50 bg-[#203329] p-8 md:p-12">
            <CheckCircle2 size={34} className="text-[#a9d4ad]" />
            <div className="mono mt-7 text-[10px] uppercase tracking-[.2em] text-[#a9d4ad]">Order #{activeOrder.id} / Proof received</div>
            <h2 className="display mt-6 text-5xl leading-[.9] tracking-[-.06em] text-paper">Payment is under review.</h2>
            <p className="mt-6 max-w-[520px] text-base leading-7 text-[#c9dfcb]">
              Your screenshot is attached to the order. Once the payment is
              verified, a unique license code will be emailed to the email on
              your account. The Forex Gobler app will be sent within 3â€“5
              business days after successful verification.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => { setStep("catalog"); setActiveOrder(null); setSelectedProduct(null); }} className="gold-button px-5 py-4 mono text-[10px] uppercase tracking-[.14em]">Browse another system</button>
              <button type="button" onClick={() => queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() })} className="border border-[#c9dfcb]/30 px-5 py-4 mono text-[10px] uppercase tracking-[.14em] text-[#c9dfcb]">Refresh status</button>
            </div>
          </section>
        )}

        <section className="mt-24 border-t border-[#eee9de]/15 pt-10">
          <div className="mb-6 flex items-center gap-3 mono text-[10px] uppercase tracking-[.18em] text-gold"><Clock3 size={15} /> Your order trail</div>
          {ordersQuery.isLoading ? <div className="text-sm text-sand">Loading your orders...</div> : ordersQuery.isError || (ordersQuery.data !== undefined && !Array.isArray(ordersQuery.data)) ? <div className="border border-[#e0715c]/50 bg-[#35221f] p-6 text-sm leading-6 text-paper">The member API is unavailable. Start the API server on port 5000, then refresh this page.</div> : <OrdersList orders={orders} />}
        </section>
        </>}
      </main>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="portal-loading min-h-[100dvh]"><Loader2 className="animate-spin text-gold" /></div>;
  return isSignedIn ? <Redirect to="/user-portal" /> : <Home />;
}

function SignInPage() {
  return (
    <div className="auth-page flex min-h-[100dvh] items-center justify-center px-4">
      <div className="auth-frame">
        <div className="auth-brand display">FOREX<span className="text-gold">/</span>GOBLER</div>
        <div className="auth-private-note">Private member access. Verification codes are used only to protect your account.</div>
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="auth-page flex min-h-[100dvh] items-center justify-center px-4">
      <div className="auth-frame">
        <div className="auth-brand display">FOREX<span className="text-gold">/</span>GOBLER</div>
        <div className="auth-private-note">Create your private member account. Payment tools unlock only after sign-in.</div>
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back to Forex Gobler", subtitle: "Sign in to access your private member portal" } },
        signUp: { start: { title: "Join Forex Gobler", subtitle: "Create your private member account" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/user-portal" component={UserPortal} />
          <Route path="/review" component={ReviewPortal} />
          <Route component={() => <Redirect to="/" />} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function RouterErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <RouterErrorBoundary>
        <ClerkProviderWithRoutes />
      </RouterErrorBoundary>
    </WouterRouter>
  );
}

export default App;
