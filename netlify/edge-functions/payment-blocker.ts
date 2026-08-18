import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  // Check if the PAYMENT_DUE environment variable is set to true
  const isPaymentDue = Netlify.env.get("PAYMENT_DUE") === "true";
  
  if (isPaymentDue) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Allow the payment due page itself, assets, and images to load
    const isAllowedPath = 
      path === "/payment-due.html" || 
      path.startsWith("/assets/") || 
      path.endsWith(".png") || 
      path.endsWith(".jpg") || 
      path.endsWith(".svg") ||
      path.endsWith(".css") ||
      path.endsWith(".js") ||
      path === "/favicon.ico";

    if (!isAllowedPath) {
      // Rewrite all other requests to the payment due page
      const redirectUrl = new URL("/payment-due.html", request.url);
      return context.rewrite(redirectUrl);
    }
  }
  
  // Continue to the next step in the request lifecycle
  return context.next();
};
