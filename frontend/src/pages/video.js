import React from "react";

import Navbar from "../components/Navbar";
import VideoCall from "../components/VideoCall.js";

export default function Explore() {
  return (
    <div className="explore-page">
      <Navbar />

      <section className="explore-section">
        <VideoCall />
      </section>
    </div>
  );
}
