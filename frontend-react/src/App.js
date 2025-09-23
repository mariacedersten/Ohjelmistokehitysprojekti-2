import React from "react";
import "./App.css";

const activities = [
  { 
    title: "Sea Expedition across the Caribbean", 
    img: "/images/1.1 Sea Expedition.jpg",
    description: "A sea journey across the the Helsinki archipelago with adventures and stops at picturesque locations." 
  },
  { 
    title: "Pirate Festival with Music & Dance", 
    img: "/images/2 Pirate Festival.jpg", 
    description: "A celebrating of pirate culture with live music,dancing,street perfomances." 
  },
  { 
    title: "Pirate Cooking Masterclass", 
    img: "/images/3.1 Cooking Masterclass.jpg", 
    description: "A culinary masterclass on traditional piratecuisine." 
  },
  { 
    title: "Navigation, Knots & Survival at Sea", 
    img: "/images/4.1 Navigation Knots Survival.jpg", 
    description: "Training in navigation, maritime knots, and basic survival skills at sea." 
  },
  { 
    title: "Deep-Sea Shipwreck Exploration", 
    img: "/images/5 Deep-Sea Shipwreck.jpg", 
    description: "Exploration of underwater worlds and local shipwreck legends ." 
  },
  { 
    title: "Miniature Shipbuilding Workshop", 
    img: "/images/6.2 Ship Model.jpg", 
    description: "A pratical workshop on building miniature ship models." 
  },
  { 
    title: "Mystical Quests & Maritime Legends", 
    img: "/images/7.1 Mystical Quests Legends.jpg", 
    description: "Online quests about maritime legends and myths." 
  },
  { 
    title: "Family & Crew Adventure Quests", 
    img: "/images/8.1 Family Crew Events.jpg", 
    description: "Games and quests for children and families with the crew." 
  },
  { 
    title: "Explorer Club – Sea Adventures", 
    img: "/images/9.1 Explorer Club.jpg", 
    description: "A tournament in naval fencing and battle tactics." 
  },
  { 
    title: "Pirate Duels & Naval Tactics", 
    img: "/images/10.3 Pirate Duels.jpg", 
    description: "Training in attack and defense strategies in naval battles." 
  },
  { 
    title: "Masterclass on Attack & Defense", 
    img: "/images/11 Masterclass on Attack.jpg", 
    description: "Master the strategies of attack and defense in naval combat." 
  },
  { 
    title: "Knife & Musket Competition", 
    img: "/images/12 Knife Musket.jpg", 
    description: "A tournament in knife and musket skills." 
  }
];


export default function App() {
  return (
    <div className="App">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <div className="logo">
            {/* Swap logo here */}

             <img src="/images/logo_white@low-res.png" alt=" " className=" logo-icon " /> 
            <span className=" "> </span>

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

      {/* ABOUT */}
      <section id="about" className="section about">
        <h2 className="section-title">ABOUT US</h2>

        <div className="about-hero">
          {/* Replace logo image here */}
          <img className="about-logo" src="/images/symbol_secondary@low-res.png" alt="Hobbl logo" />
          <h3 className="about-heading">HOBBLY TECHNOLOGIES OY</h3>
          <p className="about-text">
            is a modern technology company, whose mission is to make people's everyday lives easier by making hobbies
            and leisure opportunities easy to find and accessible. The company aims to enhance people's well-being and
            sense of community by providing digital solutions that connect users with hobbies and service providers.
          </p>
        </div>
      </section>



     <section id="activities" className="section activities">
  <h2 className="section-title">ACTIVITIES</h2>

  <div className="cards-wrap">
    {activities.map((item, i) => (
      <article className="card" key={i}>
        {/* Activity images */}
        <img src={item.img} alt={item.title} className="activity-image" />
        
        {/* Activity title */}
        <h4 className="card-title">{item.title}</h4>
        
        {/* Dynamic description */}
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
            {/* Replace phone mockup here */}
            <img src="/images/screen.png" alt="app phone" className="phone-mockup" />
          </div>

          <div className="col text-col">
            <p className="lead">
              We have a mobile application that helps you find any leisure activities in the Uusimaa region. The mobile
              application allows users to easily find suitable options and obtain reliable information about service
              providers. The app serves a wide range of target groups, including children,youth,adults, families,and seniors.
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

        <div className="two-col">
          <div className="col image-col">
            {/* Replace laptop mockup here */}
            <img src="/images/1 Landing Page (1).jpg" className="laptop-mockup" />
          </div>

          <div className="col text-col">
            <p className="lead">
              
              We work with various service providers who can easily register on our website and offer their events.
              Service providers can add their events to our application.
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
    {/* Address section */}
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
    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">in</a>
    <a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="Website">X</a>
  </div>
</footer>

    </div>

  );
}