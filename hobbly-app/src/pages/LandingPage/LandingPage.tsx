import React from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import "./LandingPage.css";
import { ContactForm } from "./ContactForm";

// ==== Импорты изображений ====
import img1 from "./images/1.1 Sea Expedition.jpg";
import img2 from "./images/2 Pirate Festival.jpg";
import img3 from "./images/3.1 Cooking Masterclass.jpg";
import img4 from "./images/4.1 Navigation Knots Survival.jpg";
import img5 from "./images/5 Deep-Sea Shipwreck.jpg";
import img6 from "./images/6.2 Ship Model.jpg";
import img7 from "./images/7.1 Mystical Quests Legends.jpg";
import img8 from "./images/8.1 Family Crew Events.jpg";
import img9 from "./images/9.1 Explorer Club.jpg";
import img10 from "./images/10.3 Pirate Duels.jpg";
import img11 from "./images/11 Masterclass on Attack.jpg";
import img12 from "./images/12 Knife Musket.jpg";
import logoWhite from "./images/logo_white@low-res.png";
import symbolSecondary from "./images/symbol_secondary@low-res.png";
import screenMockup from "./images/screen.png";
import laptopMockup from "./images/1 Landing Page (1).jpg";

const activities = [
  { title: "Caribbean Sea Expedition", img: img1,
    description: "A sea journey across the Helsinki archipelago with adventures and stops at picturesque locations." },
  { title: "Pirate Festival with Music & Dance", img: img2,
    description: "A celebrating of pirate culture with live music, dancing, street performances." },
  { title: "Pirate Cooking Masterclass", img: img3,
    description: "A culinary masterclass on traditional pirate cuisine." },
  { title: "Navigation, Knots & Survival at Sea", img: img4,
    description: "Training in navigation, maritime knots, and basic survival skills at sea." },
  { title: "Deep-Sea Shipwreck Exploration", img: img5,
    description: "Exploration of underwater worlds and local shipwreck legends." },
  { title: "Miniature Shipbuilding Workshop", img: img6,
    description: "A practical workshop on building miniature ship models." },
  { title: "Mystical Quests & Maritime Legends", img: img7,
    description: "Online quests about maritime legends and myths." },
  { title: "Family & Crew Adventure Quests", img: img8,
    description: "Games and quests for children and families with the crew." },
  { title: "Explorer Club – Sea Adventures", img: img9,
    description: "A tournament in naval fencing and battle tactics." },
  { title: "Pirate Duels & Naval Tactics", img: img10,
    description: "Training in attack and defense strategies in naval battles." },
  { title: "Masterclass on Attack & Defense", img: img11,
    description: "Master the strategies of attack and defense in naval combat." },
  { title: "Knife & Musket Competition", img: img12,
    description: "A tournament in knife and musket skills." }
];

export default function LandingPage() {
  const navigate = useNavigate();

  // Переход на мобильную версию
  const handleMobileClick = () => {
    navigate('/mobile');
  };

  // Переход на админ-панель
  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <div className="LandingPage">
      {/* NAVBAR */}
      <nav className="navbar fixed-header">
        <div className="nav-left">
          <div className="logo">
            <img src={logoWhite} alt="Hobbly logo" className="logo-icon" />
          </div>
        </div>
        <ul className="nav-center">
          <li><a href="#about">About us</a></li>
          <li><a href="#activities">Activities</a></li>
          <li><a href="#application">Application</a></li>
          <li><a href="#organisations">Organisations</a></li>
          <li><a href="#contact">Contact us</a></li>
        </ul>
      </nav>

      <div className="page-offset">

        {/* ABOUT */}
        <section id="about" className="section about">
          <h2 className="section-title">ABOUT US</h2>
          <div className="about-hero">
            <img className="about-logo" src={symbolSecondary} alt="Hobbly logo" />
            <h3 className="about-heading">HOBBLY TECHNOLOGIES OY</h3>
            <p className="about-text">
              is a modern technology company whose mission is to make people’s everyday lives easier by making hobbies and leisure opportunities easy to find and accessible. The company aims to enhance people’s well-being and sense of community by providing digital solutions that connect users with hobbies and service providers.is a modern technology company whose mission is to make people’s everyday lives easier by making hobbies and leisure opportunities easy to find and accessible. The company strives to improve people’s well-being and foster a stronger sense of community by offering digital solutions that seamlessly connect users with hobbies, events, and service providers.
            </p>
          </div>
        </section>

        {/* ACTIVITIES */}
        <section id="activities" className="section activities">
          <h2 className="section-title">ACTIVITIES</h2>
          <div className="cards-wrap">
            {activities.map((item, i) => (
              <article className="card" key={i}>
                <img src={item.img} alt={item.title} className="activity-image" />
                <h4 className="card-title">{item.title}</h4>
                <p className="card-sub">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* APPLICATION */}
        <section id="application" className="section application">
          <h2 className="section-title">APPLICATION</h2>
          <div className="two-col">
            <div className="col image-col">
              <img src={screenMockup} alt="app phone" className="phone-mockup" />
            </div>
            <div className="col text-col">
              <p className="lead">
                We have a mobile application that helps you find any leisure activities in the Uusimaa region. The mobile
                application allows users to easily find suitable options and obtain reliable information about service
                providers. The app serves a wide range of target groups, including children, youth, adults, families, and seniors, offering personalized recommendations and convenient booking options. With our application, enjoying hobbies and local events has never been easier.
              </p>
              <div className="download-wrap">
                <button className="btn" onClick={handleMobileClick}>Download the APP</button>
              </div>
            </div>
          </div>
        </section>

     {/* ORGANISATIONS */}
<section id="organisations" className="section organisations">
  <h2 className="section-title">ORGANISATIONS</h2>
  <div className="org-container">
    <div className="org-image-col">
      <img src={laptopMockup} alt="Organisation demo" className="org-laptop-mockup" />
    </div>
    <div className="org-text-col">
      <p>
        We work with various service providers who can easily register on our website and offer their events. </p>
        <p>
        Service providers can add their events to our application.</p>
        <p>
        Our goal is to make it simple for organizations of any size—whether local businesses, community groups, or large venues—to share their activities and connect with participants.
      </p>
      <button className="btn" onClick={handleAdminClick}>Create PRO</button>
    </div>
  </div>
</section>

        {/* CONTACT */}
       <section id="contact" className="section contact">
  <h2 className="section-title">CONTACT US</h2>
  <ContactForm />
</section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-left">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Rautatieläisenkatu+5,+00520+Helsinki"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>🏠 Rautatieläisenkatu 5</div>
              <div>📍 00520 Helsinki</div>
            </a>
          </div>
          <div className="footer-center">
            <a href="tel:+7405330530">📞 +7405330530</a>
          </div>
          <div className="footer-center1">
            <a href="mailto:hobbly@gmail.com">✉️ hobbly@gmail.com</a>
          </div>
          <div className="footer-right">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">f</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">in</a>
            <a href="https://x.com/" target="_blank" rel="noopener noreferrer">X</a>
          </div>
        </footer>

      </div>
    </div>
  );
}


