import React from "react";
import "../styles/About.css";

const About = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1>About aesthetix</h1>
        <p>
          aesthetix is a platform designed to transform the way people approach
          interior design. Whether you're a professional designer or someone
          looking to reimagine your living space, aesthetix provides the tools
          and inspiration to bring your ideas to life.
        </p>
      </div>

      <div className="about-content">
        <section className="about-story">
          <h2>Our Story</h2>
          <p>
            aesthetix was born out of a desire to make interior design more
            accessible and enjoyable for everyone. We noticed that many existing
            platforms were either too complex for casual users or too limited
            for professionals. Our goal was to create a space where creativity
            could thrive, regardless of skill level.
          </p>
          <p>
            From the beginning, we envisioned a platform that combines
            simplicity with powerful features. aesthetix allows users to explore
            their creativity, experiment with ideas, and share their designs
            with a supportive community.
          </p>
        </section>

        <section className="about-mission">
          <h2>Our Mission</h2>
          <p>
            At aesthetix, our mission is to simplify the interior design
            process. We believe that everyone should have the opportunity to
            create spaces that reflect their personality and style. By providing
            intuitive tools and a vibrant community, we aim to inspire and
            empower our users to turn their vision into reality.
          </p>
        </section>

        <section className="about-vision">
          <h2>Our Vision</h2>
          <p>
            We envision a world where interior design is no longer a daunting
            task but an exciting journey of self-expression. \aesthetix strives
            to be the go-to platform for anyone looking to design, share, and
            discover beautiful spaces. Our vision is to foster a global
            community of creators who inspire and support one another.
          </p>
        </section>

        <section className="about-features">
          <h2>What We Offer</h2>
          <p>
            aesthetix is more than just a design tool—it's a creative hub. Here
            are some of the ways we help our users bring their ideas to life:
          </p>
          <ul>
            <li>
              <strong>Virtual Room Designer:</strong> Experiment with layouts,
              furniture, and decor in an interactive, user-friendly environment.
            </li>
            <li>
              <strong>Design Gallery:</strong> Browse and share designs to
              inspire and be inspired by others.
            </li>
            <li>
              <strong>Personalized Profiles:</strong> Showcase your creations
              and build a portfolio of your favorite designs.
            </li>
            <li>
              <strong>Community Engagement:</strong> Connect with like-minded
              individuals, exchange ideas, and collaborate on projects.
            </li>
          </ul>
        </section>

        <section className="about-future">
          <h2>Looking Ahead</h2>
          <p>
            At aesthetix, we’re constantly evolving to meet the needs of our
            users. Our future plans include expanding our features to make the
            design process even more seamless and enjoyable. We’re committed to
            bridging the gap between inspiration and execution, helping you
            create spaces that truly feel like home.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;