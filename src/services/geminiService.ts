import { Product } from "../types";

export const geminiService = {
  async getRecommendations(allProducts: Product[], userHistory?: string[]): Promise<string[]> {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allProducts, userHistory }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.recommendations) && data.recommendations.length > 0) {
          return data.recommendations;
        }
      }
    } catch (error) {
      console.warn("Gemini recommendation request failed, using local fallback:", error);
    }

    // Graceful fallback: 4 random products
    return allProducts
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)
      .map(p => p.id);
  }
};
