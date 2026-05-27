import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Red Queen Survival Terminal",
    short_name: "Red Queen",
    description: "Decentralized survival threat evaluation and secure neural link terminal.",
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
