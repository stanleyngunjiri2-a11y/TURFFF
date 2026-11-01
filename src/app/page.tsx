import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  Footprints,
  Goal,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
} from "lucide-react";

const turfs = [
  {
    id: "01",
    name: "The Green Arena",
    location: "Kilimani, Nairobi",
    price: "3,000",
    rating: "4.9",
    reviews: "124",
    size: "5-a-side",
    image:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1100&q=85",
    tag: "POPULAR",
    tagType: "popular",
  },
  {
    id: "02",
    name: "Urban Kickz",
    location: "Westlands, Nairobi",
    price: "2,500",
    rating: "4.8",
    reviews: "86",
    size: "5-a-side",
    image:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1100&q=85",
    tag: "GREAT VALUE",
    tagType: "value",
  },
  {
    id: "03",
    name: "Champions Pitch",
    location: "Ruiru, Kiambu",
    price: "2,000",
    rating: "4.7",
    reviews: "53",
    size: "7-a-side",
    image:
      "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1100&q=85",
    tag: "NEW FIND",
    tagType: "new",
  },
];

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Find your turf",
    description:
      "Search by town, estate, or current location to discover pitches that work for your squad.",
  },
  {
    number: "02",
    icon: CalendarDays,
    title: "Request your slot",
    description:
      "Explore pricing and availability, choose your preferred time, and send a booking request.",
  },
  {
    number: "03",
    icon: Footprints,
    title: "Pay. Play. Repeat.",
    description:
      "Once the owner approves, follow the turf's payment instructions and get ready for kick-off.",
  },
];

const benefits = [
  "Discover pitches in your neighbourhood",
  "Compare prices before you book",
  "Request bookings directly from owners",
  "Know when your booking is confirmed",
];

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="TURFF home"
      className={`brand ${light ? "brand-light" : ""}`}
    >
      <span className="brand-mark">
        <Goal size={24} strokeWidth={2.5} />
      </span>
      <span className="brand-word">turff<span>.</span></span>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span className="section-label-dot" />
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="container nav-container">
          <Brand />

          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#discover">Find a turf</a>
            <a href="#how-it-works">How it works</a>
            <a href="#owners">For turf owners</a>
          </nav>

          <div className="nav-actions">
            <a className="nav-login" href="/login">
              Log in
            </a>
            <a className="button button-primary nav-cta" href="/register">
              Get started <ArrowUpRight size={16} />
            </a>
          </div>

          <button
            className="mobile-menu"
            aria-label="Menu"
            type="button"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <span className="live-dot" />
              MADE FOR THE LOVE OF THE GAME
            </div>

            <h1>
              Your next game
              <br />
              starts <span className="heading-accent">here.</span>
            </h1>

            <p className="hero-description">
              Find the perfect football turf, bring your squad together,
              and get back to doing what you love. The pitch is waiting.
            </p>

            <div className="hero-buttons">
              <a href="#discover" className="button button-primary button-large">
                Find a turf <ArrowRight size={18} />
              </a>
              <a href="#how-it-works" className="button button-quiet button-large">
                How it works <ArrowDownRight size={18} />
              </a>
            </div>

            <div className="hero-proof">
              <div className="proof-avatars" aria-hidden="true">
                <span>J</span>
                <span>M</span>
                <span>K</span>
                <span>+</span>
              </div>
              <div className="proof-copy">
                <div className="proof-stars">
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                  <Star size={13} fill="currentColor" />
                </div>
                <span>Your next favourite pitch is out there.</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-photo">
              <div className="hero-photo-overlay" />
              <div className="pitch-top-label">
                <span className="pitch-label-icon">
                  <Compass size={15} />
                </span>
                YOUR NEXT PLAYGROUND
              </div>

              <div className="pitch-bottom">
                <div>
                  <span className="pitch-kicker">THE GAME IS ON</span>
                  <h2>Find your<br />home ground.</h2>
                </div>
                <div className="pitch-ball">
                  <Goal size={32} />
                </div>
              </div>
            </div>

            <div className="floating-card floating-card-rating">
              <div className="floating-rating-icon">
                <Star size={18} fill="currentColor" />
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>Community rated</span>
              </div>
            </div>

            <div className="floating-card floating-card-location">
              <span className="location-icon">
                <MapPin size={17} />
              </span>
              <div>
                <strong>Find pitches nearby</strong>
                <span>Your neighbourhood. Your game.</span>
              </div>
              <ArrowUpRight size={17} className="location-arrow" />
            </div>

            <div className="hero-decoration">T</div>
          </div>
        </div>

        <div className="container hero-bottom">
          <div className="hero-bottom-item">
            <span className="bottom-icon"><MapPin size={18} /></span>
            <span>Discover pitches near you</span>
          </div>
          <div className="hero-bottom-item">
            <span className="bottom-icon"><Clock3 size={18} /></span>
            <span>Find a time that works</span>
          </div>
          <div className="hero-bottom-item">
            <span className="bottom-icon"><ShieldCheck size={18} /></span>
            <span>Owner-confirmed bookings</span>
          </div>
        </div>
      </section>

      <section className="search-section" aria-label="Search football turfs">
        <div className="container">
          <form action="/turfs" method="get" className="search-panel">
            <div className="search-field">
              <span className="search-field-icon"><MapPin size={20} /></span>
              <label htmlFor="location">WHERE DO YOU WANT TO PLAY?</label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="Town, estate, or neighbourhood"
              />
            </div>

            <div className="search-divider" />

            <div className="search-field search-field-date">
              <span className="search-field-icon"><CalendarDays size={20} /></span>
              <label htmlFor="date">WHEN ARE YOU PLAYING?</label>
              <input id="date" name="date" type="date" />
            </div>

            <button className="button button-primary search-button" type="submit">
              <Search size={18} />
              Search turfs
            </button>
          </form>

          <div className="search-note">
            <MapPin size={14} />
            <span>Know a location? Start there. Your next match is closer than you think.</span>
          </div>
        </div>
      </section>

      <section className="discover-section section-space" id="discover">
        <div className="container">
          <div className="section-heading-row">
            <div>
              <SectionLabel>THE GOOD STUFF</SectionLabel>
              <h2 className="section-title">
                Pitches worth
                <br className="mobile-break" /> <span className="text-green">playing on.</span>
              </h2>
              <p className="section-description">
                From quick five-a-side sessions to full squad battles,
                find a pitch that fits your game.
              </p>
            </div>

            <Link href="/turfs" className="text-link desktop-view-all">
              Explore all turfs <ArrowRight size={17} />
            </Link>
          </div>

          <div className="filter-row">
            <div className="filter-caption">
              <SlidersHorizontal size={16} />
              <span>Find your kind of game</span>
            </div>
            <div className="filter-chips">
              <Link className="filter-chip filter-chip-active" href="/turfs">All turfs</Link>
              <Link className="filter-chip" href="/turfs?size=5-a-side">5-a-side</Link>
              <Link className="filter-chip" href="/turfs?size=7-a-side">7-a-side</Link>
              <Link className="filter-chip" href="/turfs?sort=price">Budget friendly</Link>
            </div>
          </div>

          <div className="turf-grid">
            {turfs.map((turf) => (
              <article className="turf-card" key={turf.id}>
                <Link
                  className="turf-image"
                  href={`/turfs/${turf.id}`}
                  style={{ backgroundImage: `url("${turf.image}")` }}
                  aria-label={`Explore ${turf.name}`}
                >
                  <span className={`turf-tag turf-tag-${turf.tagType}`}>
                    {turf.tag}
                  </span>
                  <span className="turf-image-arrow">
                    <ArrowUpRight size={19} />
                  </span>
                </Link>

                <div className="turf-card-body">
                  <div className="turf-name-row">
                    <h3>{turf.name}</h3>
                    <span className="turf-rating">
                      <Star size={14} fill="currentColor" />
                      {turf.rating}
                      <span className="review-count">({turf.reviews})</span>
                    </span>
                  </div>

                  <div className="turf-location">
                    <MapPin size={15} />
                    {turf.location}
                  </div>

                  <div className="turf-card-bottom">
                    <div className="turf-meta">
                      <span className="turf-size">{turf.size}</span>
                      <span className="turf-divider-dot" />
                      <span>Artificial grass</span>
                    </div>

                    <div className="turf-price">
                      <strong>KSh {turf.price}</strong>
                      <span>/ hour</span>
                    </div>
                  </div>

                  <Link href={`/turfs/${turf.id}`} className="turf-details-link">
                    View turf details <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mobile-explore">
            <Link href="/turfs" className="button button-outline">
              Explore all turfs <ArrowRight size={17} />
            </Link>
          </div>

          <div className="discovery-note">
            <span className="discovery-note-icon"><Compass size={20} /></span>
            <div>
              <strong>Your neighbourhood, your football community.</strong>
              <p>
                We&apos;re building a better way to discover pitches across Kenya.
                More local finds, fewer missed kick-offs.
              </p>
            </div>
            <ArrowUpRight size={21} className="discovery-note-arrow" />
          </div>
        </div>
      </section>

      <section className="how-section section-space" id="how-it-works">
        <div className="container">
          <div className="centered-heading">
            <SectionLabel>THREE STEPS. ONE GAME.</SectionLabel>
            <h2 className="section-title">
              Less organising.
              <br />
              <span className="text-green">More playing.</span>
            </h2>
            <p className="section-description">
              Your next football session shouldn&apos;t take a dozen phone calls to organise.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article className="step-card" key={step.number}>
                  <div className="step-card-top">
                    <span className="step-number">{step.number}</span>
                    <span className="step-icon"><Icon size={23} /></span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  {index !== steps.length - 1 && (
                    <ArrowRight className="step-arrow" size={20} />
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="owners-section" id="owners">
        <div className="container owners-grid">
          <div className="owners-visual">
            <div className="owners-photo">
              <div className="owners-photo-top">
                <span className="owners-live-dot" />
                BUILT FOR THE PEOPLE BEHIND THE PITCH
              </div>

              <div className="owners-stat-card">
                <div className="owners-stat-icon"><Users size={19} /></div>
                <div>
                  <strong>Your turf. Your rules.</strong>
                  <span>Manage requests on your terms.</span>
                </div>
                <Check size={19} className="owners-stat-check" />
              </div>
            </div>
            <div className="owners-photo-caption">
              <span>FOR TURF OWNERS</span>
              <ArrowUpRight size={19} />
            </div>
          </div>

          <div className="owners-copy">
            <SectionLabel>OWN A FOOTBALL TURF?</SectionLabel>
            <h2 className="section-title">
              Your pitch
              <br />
              deserves to be <span className="text-green">found.</span>
            </h2>
            <p className="owners-description">
              Spend less time chasing bookings and more time growing your
              football business. Put your pitch on the map with TURFF.
            </p>

            <ul className="benefit-list">
              {benefits.map((benefit) => (
                <li key={benefit}>
                  <span className="benefit-check"><Check size={14} /></span>
                  {benefit}
                </li>
              ))}
            </ul>

            <a href="/register?role=owner" className="button button-primary button-large">
              List your turf <ArrowRight size={18} />
            </a>

            <p className="owners-small-note">
              Create an account, submit your turf, and wait for listing approval.
            </p>
          </div>
        </div>
      </section>

      <section className="closing-section">
        <div className="container closing-inner">
          <div className="closing-content">
            <span className="closing-eyebrow">
              <Footprints size={16} /> YOUR SQUAD IS WAITING
            </span>
            <h2>
              Enough talking
              <br />
              about the game.
              <br />
              <span>Let&apos;s play.</span>
            </h2>
            <p>
              Find the pitch. Bring the squad. Make it a match day.
            </p>
            <a href="#discover" className="button button-white button-large">
              Find your next turf <ArrowRight size={18} />
            </a>
          </div>

          <div className="closing-art" aria-hidden="true">
            <div className="closing-ring closing-ring-one" />
            <div className="closing-ring closing-ring-two" />
            <div className="closing-ball"><Goal size={104} strokeWidth={1.3} /></div>
            <span className="closing-art-label">GAME ON.</span>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-main">
            <div className="footer-brand">
              <Brand light />
              <p>
                Find your pitch. Bring your people.
                <br />
                Make every game count.
              </p>
            </div>

            <div className="footer-column">
              <h3>Discover</h3>
              <Link href="/turfs">Find a turf</Link>
              <Link href="/turfs?size=5-a-side">5-a-side pitches</Link>
              <Link href="/turfs?size=7-a-side">7-a-side pitches</Link>
            </div>

            <div className="footer-column">
              <h3>For owners</h3>
              <a href="/register?role=owner">List your turf</a>
              <a href="/login">Owner login</a>
              <a href="#owners">How it works</a>
            </div>

            <div className="footer-column">
              <h3>TURFF</h3>
              <a href="/about">About us</a>
              <a href="/contact">Contact</a>
              <a href="/privacy">Privacy policy</a>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} TURFF. Built for the love of the game.</span>
            <span className="footer-location"><MapPin size={14} /> Made for football in Kenya</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
