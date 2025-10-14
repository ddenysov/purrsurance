async function sendEventToPublisher(eventPublisherUrl, sessionId, data, eventType) {
  if (!eventPublisherUrl) {
    console.warn("EVENT_PUBLISHER_URL not configured, skipping event publishing");
    return;
  }
  try {
    const payload = JSON.stringify({
      sessionId,
      eventType,
      data
    });
    console.log("Sending event to publisher", {
      url: eventPublisherUrl,
      sessionId,
      eventType
    });
    const response = await fetch(eventPublisherUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Session-Id": sessionId
      },
      body: payload
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send event to publisher", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
    } else {
      const result = await response.json();
      console.log("Event sent successfully", result);
    }
  } catch (error) {
    console.error("Error sending event to publisher", {
      error: error.message,
      stack: error.stack
    });
  }
}
export {
  sendEventToPublisher
};
