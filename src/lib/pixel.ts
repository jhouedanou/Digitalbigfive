/**
 * Helper client-side pour envoyer des événements Meta Pixel (fbq).
 * Utilisé uniquement dans les composants "use client".
 * Le Pixel doit être initialisé (via PixelLoader dans le layout) avant d'appeler ces fonctions.
 */

type FbqFunction = (
  action: string,
  eventName: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
) => void;

declare global {
  interface Window {
    fbq?: FbqFunction;
  }
}

/**
 * Envoie un événement fbq.track si le Pixel est chargé.
 * @param eventName  Nom standard Meta (ex: 'InitiateCheckout', 'Purchase', 'ViewContent')
 * @param params     Paramètres de l'événement
 * @param eventId    ID de déduplication Pixel/CAPI (doit correspondre à l'eventId envoyé côté CAPI)
 */
export function trackPixelEvent(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;

  if (eventId) {
    window.fbq("track", eventName, params || {}, { eventID: eventId });
  } else {
    window.fbq("track", eventName, params || {});
  }
}
