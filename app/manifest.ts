import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Red Queen Survival Intelligence",
    short_name: "Red Queen",
    description: "RED QUEEN turns verified threat signals into clear assessments, practical actions and survival-readiness training.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#ff4d4d",
    icons: [
      {
        src: "/token-image.png",
        sizes: "512x512",
        type: "image/png",
      }
    ],
  };
}
