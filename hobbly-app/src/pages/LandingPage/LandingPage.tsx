import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import "./LandingPage.css";
import { ContactForm } from "./ContactForm";

// ==== Импорты изображений для других частей страницы ====
import logoWhite from "./images/logo_white@low-res.png";
import symbolSecondary from "./images/symbol_secondary@low-res.png";
import screenMockup from "./images/screen.png";
import laptopMockup from "./images/1 Landing Page (1).jpg";

// API
import activitiesAPI from "../../api/activities.api";
import { Activity } from "../../types";

export default function LandingPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем первые 12 подтвержденных активностей
    const fetchActivities = async () => {
      try {
        const response = await activitiesAPI.getActivities({}, 1, 12, 'created_at', false);
        setActivities(response.data);
      } catch (err) {
        console.error("Ошибка загрузки активностей:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const handleMobileClick = () => {
    navigate('/mobile');
  };

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <div className="LandingPage">
      {/* NAVBAR */}
      <nav className="navbar fixed-header">
        <div className="nav-left">
         <div className="logo">
            <img 
              src="https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Webside/logo_white@high-res.png" 
              alt="Hobbly logo" 
              className="logo-icon" 
            />
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
            {/* Левая колонка */}
            <div className="column left">
              <img
                src="https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Webside/screen.png"
                alt="app phone"
                className="phone-mockup-about"
              />
              <button className="btn_about" onClick={handleMobileClick}>Mobile</button>
            </div>

            {/* Средняя колонка */}
            <div className="column middle">
              <img className="about-logo" src={symbolSecondary} alt="Hobbly logo" />
              <h3 className="about-heading">HOBBLY TECHNOLOGIES OY</h3>
              <p className="about-text">
                is a modern technology company whose mission is to make people’s everyday lives easier by making hobbies and leisure opportunities easy to find and accessible. 
                The company aims to enhance people’s well-being and sense of community by providing digital solutions that connect users with hobbies and service providers. 
                It strives to foster a stronger sense of community by offering digital solutions that seamlessly connect users with hobbies, events, and service providers.
              </p>
              <p className="about-text">
                This student project was completed by Maria Shatylovich, Maria Cedersten and Dieudonne Ngororano.
              </p>
            </div>

            {/* Правая колонка */}
            <div className="column right">
              <img
                src="https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Photos%20(1)/Organizations/1_Landing_Page.jpg"
                alt="Organisation demo"
                className="org-laptop-mockup-about"
              />
              <button className="btn_about" onClick={handleAdminClick}>Desktop</button>
            </div>
          </div>
        </section>

        {/* ACTIVITIES */}
        <section id="activities" className="section activities">
          <h2 className="section-title">ACTIVITIES</h2>
          <div className="cards-wrap">
            {loading ? (
              <p>Loading activities...</p>
            ) : (
              activities.map((item, i) => (
                <article className="card" key={i}>
                  {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="activity-image" />}
                  <h4 className="card-title">{item.title}</h4>
                  <p className="card-sub">{item.description}</p>
                </article>
              ))
            )}
          </div>
        </section>

        {/* APPLICATION */}
        <section id="application" className="section application">
          <h2 className="section-title">APPLICATION</h2>
          <div className="two-col">
            <div className="col image-col">
             <img
                src="https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Webside/screen.png"
                alt="app phone"
                className="phone-mockup"
              />
            </div>
            <div className="col text-col">
              <p className="lead">
               We have a mobile app that helps you find any leisure activities in the Uusimaa region. The app allows users to easily find suitable options and obtain reliable information about service providers and upcoming community events. It serves a wide range of target groups, including children, youth, adults, families, and seniors, offering personalized recommendations and convenient booking options for every schedule and preference. With our app, enjoying hobbies and local events has never been easier.
              </p>
              <div className="download-wrap">
                <button className="btn" onClick={handleMobileClick}>Mobile</button>
              </div>
            </div>
          </div>
        </section>

        {/* ORGANISATIONS */}
        <section id="organisations" className="section organisations">
          <h2 className="section-title">ORGANISATIONS</h2>
          <div className="org-container">
            <div className="org-image-col">
             <img
              src="https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Photos%20(1)/Organizations/1_Landing_Page.jpg"
              alt="Organisation demo"
              className="org-laptop-mockup"
            />

            </div>
            <div className="org-text-col">
              <p>
                We work with various service providers who can easily register on our website and offer their events.
              </p>
              <p>
                Service providers can easily add and manage their events, activities, and detailed information to our application.
              </p>
              <p>
                Our goal is to make it simple for organizations of any size to share their activities and connect with participants.
              </p>
              <button className="btn" onClick={handleAdminClick}>Desktop</button>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="section contact">
          <h2 className="section-title">CONTACT US</h2>
          <div className="contact-grid">
            {/* Левая колонка — форма */}
            <div className="contact-left">
              <form className="contact-form">
                <input type="text" placeholder="Full name" required />
                <input type="email" placeholder="E-mail address" required />
                <input type="tel" placeholder="Phone number" required />
                <textarea placeholder="Your message" required></textarea>
                <button type="submit" className="btn">Send message</button>
              </form>
            </div>

            {/* Правая колонка — картинка */}
            <div className="contact-right">
              <img
                src="https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Webside/a6277d48-cbd2-47b0-952e-47c6d2258a0c.png"
                alt="Contact illustration"
              />
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-left">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Rautatieläisenkatu+5,+00520+Helsinki"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div>🏠 Rautatieläisenkatu 5, 00520 Helsinki</div>
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



