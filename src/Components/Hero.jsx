import React, { useEffect, useState } from "react";
import Doctor from "../Assets/doctor-picture.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faAngleUp,
  faHeartPulse,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate  } from "react-router-dom";
import "../Styles/Hero.css";

function Hero() {
  const navigate = useNavigate();
  const [goUp, setGoUp] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookAppointmentClick = () => {
    navigate("/appointment");
  };

  useEffect(() => {
    const onPageScroll = () => {
      if (window.scrollY > 600) {
        setGoUp(true);
      } else {
        setGoUp(false);
      }
    };
    window.addEventListener("scroll", onPageScroll);

    return () => {
      window.removeEventListener("scroll", onPageScroll);
    };
  }, []);

  return (
    <div className="section-container">
      <div className="hero-section">
        <div className="text-section">
          <p className="text-headline">
            <FontAwesomeIcon icon={faHeartPulse} />
            Care that puts you first
          </p>
          <h2 className="text-title">
            Expert care, made easier.
          </h2>
          <p className="text-descritpion">
            Find the right doctor, get trusted guidance, and book care around
            your life. Your health journey starts with a team that listens.
          </p>
          <div className="hero-actions">
            <button
              className="text-appointment-btn"
              type="button"
              onClick={handleBookAppointmentClick}
            >
              Book an appointment
              <FontAwesomeIcon icon={faCalendarCheck} />
            </button>
            <a className="hero-services-link" href="#services">
              Explore our services
              <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="text-stats">
            <div className="text-stats-container">
              <p>145k+</p>
              <p>Patients cared for</p>
            </div>

            <div className="text-stats-container">
              <p>50+</p>
              <p>Expert Doctors</p>
            </div>

            <div className="text-stats-container">
              <p>10+</p>
              <p>Years of Experience</p>
            </div>
          </div>
        </div>

        <div className="hero-image-section">
          <div className="hero-image-frame">
            <img className="hero-image1" src={Doctor} alt="A doctor ready to help" />
            <div className="hero-image-note">
              <span className="hero-note-icon">
                <FontAwesomeIcon icon={faHeartPulse} />
              </span>
              <span>
                <strong>Care you can count on</strong>
                <small>Here for your next step</small>
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="Scroll to top"
        onClick={scrollToTop}
        className={`scroll-up ${goUp ? "show-scroll" : ""}`}
      >
        <FontAwesomeIcon icon={faAngleUp} />
      </button>
    </div>
  );
}

export default Hero;