import api from "../lib/api";

export interface Testimonial {
  id: number;
  name: string;
  image: string;
  rating: number;
  testimonial: string;
  professional: string;
  createdAt?: string;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const response = await api.get("/testimonials");
  return response.data.data || [];
}

export async function createTestimonial(data: {
  name: string;
  image: string;
  rating: number;
  testimonial: string;
  professional: string;
}): Promise<Testimonial> {
  const response = await api.post("/testimonials", data);
  return response.data.data;
}

export async function deleteTestimonial(id: number): Promise<void> {
  await api.delete(`/testimonials/${id}`);
}
