import React from "react";
import "./App.css";

const activities = [
  { title: "Sea Expedition across the Caribbean", img: "/images/activity1.jpg" },
  { title: "Pirate Festival with Music & Dance", img: "/images/activity2.jpg" },
  { title: "Pirate Cooking Masterclass", img: "/images/activity3.jpg" },
  { title: "Navigation, Knots & Survival at Sea", img: "/images/activity4.jpg" },
  { title: "Deep-Sea Shipwreck Exploration", img: "/images/activity5.jpg" },
  { title: "Miniature Shipbuilding Workshop", img: "/images/activity6.jpg" },
  { title: "Mystical Quests & Maritime Legends", img: "/images/activity7.jpg" },
  { title: "Family & Crew Adventure Quests", img: "/images/activity8.jpg" },
  { title: "Explorer Club – Sea Adventures", img: "/images/activity9.jpg" },
  { title: "Pirate Duels & Naval Tactics", img: "/images/activity10.jpg" },
  { title: "Masterclass on Attack & Defense", img: "/images/activity11.jpg" },
  { title: "Knife & Musket Competition", img: "/images/activity12.jpg" },
];

export default function App() {
  return (
    <div className="App">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <div className="logo">
            <img src=" " alt="Hobbly logo" className="logo-icon" />
            <span className="logo-text">Hobbly</span>
          </div>
        </div>

        <ul className="nav-center">
          <li><a href="#about">About us</a></li>
          <li><a href="#activities">Activities</a></li>
          <li><a href="#application">Application</a></li>
          <li><a href="#organisations">Organisations</a></li>
          <li><a href="#contact">Contact us</a></li>
        </ul>

        <div className="nav-right">
          <a href="/#" aria-label="website">🌐</a>
          <a href="/#" aria-label="facebook">f</a>
          <a href="/#" aria-label="linkedin">in</a>
        </div>
      </nav>

      {/* ABOUT */}
      <section id="about" className="section about">
        <h2 className="section-title">ABOUT US</h2>

        <div className="about-hero">
          <img
            className="about-logo"
            src="/images/logo.png"
            alt="Hobbly logo"
          />
          <h3 className="about-heading">HOBBLY TECHNOLOGIES OY</h3>
          <p className="about-text">
            is a modern technology company, whose mission is to make people's
            everyday lives easier by making hobbies and leisure opportunities
            easy to find and accessible. The company aims to enhance people's
            well-being and sense of community by providing digital solutions
            that connect users with hobbies and service providers.
          </p>
        </div>
      </section>

      {/* ACTIVITIES */}
      <section id="activities" className="section activities">
        <h2 className="section-title">ACTIVITIES</h2>

        <div className="cards-wrap">
          {activities.map((item, i) => (
            <article className="card" key={i}>
              <img src={item.img} alt={item.title} />
              <h4 className="card-title">{item.title}</h4>
              <p className="card-sub">Short description about the event.</p>
            </article>
          ))}
        </div>
      </section>

      {/* APPLICATION */}
      <section id="application" className="section application">
        <h2 className="section-title">APPLICATION</h2>

        <div className="two-col">
          <div className="col image-col">
            <img
            
              src="./images/phone.png"
              alt="app phone"
              className="phone-mockup"
            />
          </div>

          <div className="col text-col">
            <p className="lead">
              We have a mobile application that helps you find any leisure
              activities in the Uusimaa region. The mobile application allows
              users to easily find suitable options and obtain reliable
              information about service providers. The app serves a wide range
              of target groups, including children, youth, adults, families, and seniors.
            </p>
            <div className="download-wrap">
              <button className="btn">Download the APP</button>
            </div>
          </div>
        </div>
      </section>

      {/* ORGANISATIONS */}
      <section id="organisations" className="section organisations">
        <h2 className="section-title">ORGANISATIONS</h2>

        <div className="two-col reverse">
          <div className="col image-col">
            <img
              src="./images/laptop.png"
              alt="app laptop"
              className="laptop-mockup"
            />
          </div>

          <div className="col text-col">
            <p className="lead">
              We work with various service providers who can easily register on
              our website and offer their events. Service providers can add
              their events to our application.
            </p>
            <div className="download-wrap">
              <button className="btn">Create PRO</button>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section contact">
        <h2 className="section-title">CONTACT US</h2>

        <form className="contact-grid" onSubmit={(e) => e.preventDefault()}>
          <div className="left-col">
            <input placeholder="Full name" />
            <input placeholder="E-mail address" />
            <input placeholder="Phone number" />
          </div>
          <div className="right-col">
            <textarea placeholder="Your message" />
            <div className="send-area">
              <button className="btn">Send message</button>
            </div>
          </div>
        </form>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-left">
          <div>🏠 Rautatieläisenkatu 5, 00520 Helsinki</div>
          <div>📞 +7405330530 &nbsp; | &nbsp; ✉️ hobbly@gmail.com</div>
        </div>
        <div className="footer-right">
          <a href="/#" aria-label="website">🌐</a>
          <a href="/#" aria-label="facebook">f</a>
          <a href="/#" aria-label="linkedin">in</a>
        </div>
      </footer>
    </div>
  );
}
  