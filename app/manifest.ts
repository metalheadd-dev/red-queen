import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RQ · Survival Intelligence",
    short_name: "RQ",
    description: "Ask Red Queen. Understand threats, make a plan and find the gear you need.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#ff0033",
    icons: [
      {
        src: "/token-image.png",
        sizes: "512x512",
        type: "image/png",
      }
    ],
    shortcuts: [
      {
        name: "Live threats",
        short_name: "Threats",
        description: "Review verified signals and your Signal Watch.",
        url: "/pulse",
        icons: [{ src: "/token-image.png", sizes: "512x512", type: "image/png" }],
      },
      {
        name: "Ask Red Queen",
        short_name: "Ask Queen",
        description: "Talk to your AI survival agent.",
        url: "/red-queen",
        icons: [{ src: "/token-image.png", sizes: "512x512", type: "image/png" }],
      },
    ],
  };
}
