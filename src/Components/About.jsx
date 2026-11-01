import React from "react";
import DoctorGroup from "../Assets/doctor-group.png";
import SolutionStep from "./SolutionStep";
import "../Styles/About.css";

function About() {
  return (
    <section className="about-section" id="about">
      <div className="about-image-content">
        <img
          src={DoctorGroup}
          alt="A team of doctors ready to support your care"
          className="about-image1"
        />
      </div>

      <div className="about-text-content">
        <h2 className="about-title">
          <span>A care team that sees you</span>
        </h2>
        <p className="about-description">
          Good care starts with being heard. Health+ helps you find the right
          support, connect with experienced doctors, and make your next step
          feel a little simpler.
        </p>
        <p className="about-text-title">Care, made personal</p>

        <SolutionStep
          title="Start with what you need"
          description="Explore care options and find the support that fits your health goals."
        />
        <SolutionStep
          title="Connect with a doctor"
          description="Meet with a specialist in a way that works for you and your schedule."
        />
        <SolutionStep
          title="Move forward with confidence"
          description="Get clear guidance to help you take the next step in your care."
        />
      </div>
    </section>
  );
}

export default About;
