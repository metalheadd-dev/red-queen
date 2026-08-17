import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Red Queen Survival Intelligence",
    short_name: "Red Queen",
    description: "Verified threat signals, practical preparedness and a context-aware survival intelligence agent.",
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
