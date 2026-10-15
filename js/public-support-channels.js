import { createSiteClient, normalizeSupportUrl } from "./supabase-client.js";

const channels = [
  { id: "whatsapp", label: "WhatsApp", url: "" },
  { id: "telegram", label: "Telegram", url: "" }
];
const status = document.querySelector("#supportChannelsStatus");
let channelsLoaded = false;

for (const channel of channels) {
  for (const button of document.querySelectorAll(`[data-support-channel="${channel.id}"]`)) {
    button.addEventListener("click", async () => {
      if (channel.url) {
        window.open(channel.url, "_blank", "noopener,noreferrer");
        return;
      }

      if (channelsLoaded) {
        status.textContent = `${channel.label} ist noch nicht eingerichtet. Bitte schau später noch einmal vorbei.`;
        document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
        return;
      }

      const pendingTab = window.open("about:blank", "_blank");
      if (!pendingTab) {
        status.textContent = `Der ${channel.label}-Link wird geladen. Bitte klicke gleich noch einmal auf die Schaltfläche.`;
        return;
      }

      pendingTab.opener = null;
      status.textContent = `Der ${channel.label}-Link wird geladen …`;
      await channelsPromise;

      if (channel.url) {
        pendingTab.location.href = channel.url;
      } else {
        pendingTab.close();
        status.textContent = `${channel.label} ist noch nicht eingerichtet. Bitte schau später noch einmal vorbei.`;
      }
    });
  }
}

async function loadSupportChannels() {
  try {
    const supabase = await createSiteClient();
    const { data, error } = await supabase
      .from("site_support_channels")
      .select("id, url");
    if (error) throw error;

    if (!Array.isArray(data)) throw new Error("Supabase did not return the contact channel list.");

    const urlsById = new Map(data.map(({ id, url }) => [id, url]));
    let configuredCount = 0;

    for (const channel of channels) {
      const url = urlsById.get(channel.id);
      if (typeof url !== "string" || !url.trim()) continue;

      try {
        channel.url = normalizeSupportUrl(url, channel.id);
        configuredCount += 1;
      } catch (error) {
        console.error(`Invalid ${channel.label} link saved by the administrator.`, error);
      }
    }

    status.textContent = configuredCount
      ? "Die Kontakt-Schaltflächen werden von der Website-Administration verwaltet."
      : "Die Schaltflächen werden angezeigt. Ihre Links funktionieren, sobald sie von der Website-Administration eingerichtet wurden.";
  } catch (error) {
    console.error("Impossible de charger les liens WhatsApp et Telegram.", error);
    status.textContent = "Die Schaltflächen werden angezeigt, aber ihre Links sind vorübergehend nicht verfügbar. Bitte nutze die unten angeführten offiziellen Support-Angebote.";
  } finally {
    channelsLoaded = true;
  }
}

const channelsPromise = loadSupportChannels();
