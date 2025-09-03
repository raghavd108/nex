//src/pages/ThemedRoom
import React from "react";
import { useParams } from "react-router-dom";
import VideoRoom from "../components/VideoRoom.js"; // 👈 the logic from before

export default function ThemedRoom() {
  const { roomId } = useParams();

  return (
    <div>
      <VideoRoom roomId={roomId} />
    </div>
  );
}
